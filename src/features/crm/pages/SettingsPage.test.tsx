/**
 * @vitest-environment happy-dom
 *
 * #58: a failed AI-config query must show an error state with a retry, never
 * the "No AI model config" empty state; and a bogus ?tab= value must fall
 * back to General instead of rendering a blank page.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/lib/supabase', () => ({ SUPABASE_URL: 'https://example.supabase.co' }))
vi.mock('@/features/crm/components/IgnoreRulesPanel', () => ({
  IgnoreRulesPanel: () => null,
}))
vi.mock('@/features/admin/PeoplePanel', () => ({ PeoplePanel: () => null }))
vi.mock('@/features/admin/AssignmentsPanel', () => ({ AssignmentsPanel: () => null }))
vi.mock('@/features/admin/AccessHistoryPanel', () => ({ AccessHistoryPanel: () => null }))

const refetch = vi.fn()
const aiConfigsState: { data?: unknown[]; isPending: boolean; isError: boolean } = {
  data: undefined,
  isPending: false,
  isError: true,
}

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useAiConfigsQuery: vi.fn(() => ({ ...aiConfigsState, refetch })),
  useIgnoreRulesQuery: vi.fn(() => ({ data: [] })),
  useFirefliesHealth: vi.fn(() => ({ data: false })),
  useUpdateAiConfigMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))
vi.mock('@/auth/auth', () => ({ useAuth: vi.fn(() => ({ isAdmin: false })) }))

const { SettingsPage } = await import('./SettingsPage')

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  refetch.mockClear()
})

afterEach(cleanup)

describe('SettingsPage (#58)', () => {
  it('shows a load failure with retry instead of "No AI model config"', () => {
    renderAt('/settings')

    expect(screen.getByText('Could not load AI model config')).toBeTruthy()
    expect(screen.queryByText('No AI model config')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('falls back to General for an unknown ?tab= value instead of a blank page', () => {
    renderAt('/settings?tab=does-not-exist')

    expect(screen.getByRole('tab', { name: 'General', selected: true })).toBeTruthy()
    expect(screen.getByText('AI model configuration')).toBeTruthy()
  })

  it('keeps admin tabs away from a non-admin', () => {
    renderAt('/settings?tab=people')

    expect(screen.getByRole('tab', { name: 'General', selected: true })).toBeTruthy()
    expect(screen.queryByText('People & permissions')).toBeNull()
  })

  it('keeps the honest empty state when the query succeeds with no rows', () => {
    aiConfigsState.isError = false
    aiConfigsState.data = []

    renderAt('/settings')

    expect(screen.getByText('No AI model config')).toBeTruthy()
    expect(screen.queryByText('Could not load AI model config')).toBeNull()

    aiConfigsState.data = undefined
    aiConfigsState.isError = true
  })
})
