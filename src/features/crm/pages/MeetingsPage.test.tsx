/**
 * @vitest-environment happy-dom
 *
 * Issue #56 step 1: a meeting's department must belong to its customer. The
 * department edit list is scoped per row to that customer's departments, and
 * changing the customer clears a department that no longer belongs to it
 * (optimistically, with rollback on failure) — the ContactsPage pattern.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { Buyer, CrmDepartment, CrmMeetingNote, Retailer } from '@/lib/types'
import { crmKeys } from '@/features/crm/queries'

const toasts = { error: vi.fn(), success: vi.fn() }
vi.mock('sonner', () => ({ toast: toasts }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
// The drawer is not under test here; nulling it keeps the mock surface small.
vi.mock('@/features/crm/components/MeetingDrawer', () => ({ MeetingDrawer: () => null }))

const acme: Retailer = {
  id: 'c1',
  name: 'Acme',
  display_name: null,
  status: 'active',
  domain: null,
  logo_url: null,
  customer_status: 'ACTIVE_CUSTOMER',
  chain_type: null,
  routing_aliases: null,
}
const globex: Retailer = { ...acme, id: 'c2', name: 'Globex' }

const departments: CrmDepartment[] = [
  { id: 'd1', name: 'Buying', category: null, division: null, active: true, retailer: acme, primary_buyer: null },
  { id: 'd2', name: 'Media', category: null, division: null, active: true, retailer: globex, primary_buyer: null },
]

const meetings: CrmMeetingNote[] = [
  {
    id: 'm1',
    name: 'Line review',
    date: '2026-11-01',
    participants: null,
    summary: null,
    action_items: null,
    source: null,
    fireflies_transcript_id: null,
    retailer: acme,
    department: departments[0],
    contact: null,
  },
]

const buyers: Buyer[] = []

const mutateAsync = vi.fn()

vi.mock('@/features/crm/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/queries')>()
  return {
    ...actual,
    listData: (data: unknown) => data ?? [],
    useMeetingsQuery: vi.fn(() => ({ data: meetings, isPending: false, isError: false, refetch: vi.fn() })),
    useCustomerPickerQuery: vi.fn(() => ({ data: [acme, globex], isPending: false })),
    useDepartmentsQuery: vi.fn(() => ({ data: departments, isPending: false })),
    useIngestedContactsQuery: vi.fn(() => ({ data: buyers, isPending: false })),
    useUpdateMeetingMutation: vi.fn(() => ({ mutateAsync })),
    useCustomerDisplayName: vi.fn(() => (value: unknown) =>
      value && typeof value === 'object' ? ((value as { name?: string }).name ?? '') : ''),
  }
})

const { MeetingsPage } = await import('./MeetingsPage')

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  queryClient.setQueryData(crmKeys.meetings(-1), meetings)
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return queryClient
}

function openCellEditor(rowText: string) {
  fireEvent.click(screen.getByText(rowText))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('Meetings department options are customer-scoped (issue #56)', () => {
  it('offers only the row customer\'s departments in the department edit list', () => {
    renderPage()
    openCellEditor('Line review') // any cell would do; the row must render
    openCellEditor('Buying') // the department cell of the Acme row
    // The dropdown offers Acme's department plus Unassigned — not Globex's.
    expect(screen.getByRole('button', { name: 'Unassigned' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Buying' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Media' })).toBeNull()
  })

  it('clears the department when the customer changes to one it does not belong to', async () => {
    const queryClient = renderPage()
    openCellEditor('Acme') // the customer cell of the row
    fireEvent.click(screen.getByRole('button', { name: 'Globex' }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ id: 'm1', values: { retailer: 'c2', department: null } }),
    )
    const row = queryClient.getQueryData<CrmMeetingNote[]>(crmKeys.meetings(-1))?.find((m) => m.id === 'm1')
    expect(row?.department).toBeNull()
    expect((row?.retailer as Retailer).id).toBe('c2')
  })

  it('restores the department when the customer change fails to save', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('rpc offline'))
    const queryClient = renderPage()
    openCellEditor('Acme')
    fireEvent.click(screen.getByRole('button', { name: 'Globex' }))
    await waitFor(() => expect(toasts.error).toHaveBeenCalledWith('Could not save change', expect.anything()))
    const row = queryClient.getQueryData<CrmMeetingNote[]>(crmKeys.meetings(-1))?.find((m) => m.id === 'm1')
    expect((row?.retailer as Retailer).id).toBe('c1')
    expect((row?.department as CrmDepartment).id).toBe('d1')
  })
})
