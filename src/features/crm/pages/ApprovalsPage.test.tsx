/**
 * @vitest-environment happy-dom
 *
 * Issue #49 step 1: the Overview "Approvals" card counts unresolved threads
 * (isApprovalResolved). The Approvals page defaults to the same Open
 * predicate, so clicking through shows that exact number; All shows every
 * thread.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { CrmLicensorApprovalThread } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
// The drawer is not under test here; nulling it keeps the mock surface small.
vi.mock('@/features/crm/components/ApprovalDrawer', () => ({ ApprovalDrawer: () => null }))

const approvals: CrmLicensorApprovalThread[] = [
  {
    id: 'a1',
    name: 'Awaiting legal',
    property_name: null,
    stage: null,
    submitted_date: null,
    response_date: null,
    due_date: null,
    licensor_comments: null,
    opportunity: null,
  },
  {
    id: 'a2',
    name: 'Renewal pending',
    property_name: null,
    stage: 'Submitted for review',
    submitted_date: null,
    response_date: null,
    due_date: null,
    licensor_comments: null,
    opportunity: null,
  },
  {
    id: 'a3',
    name: 'Approved deal',
    property_name: null,
    stage: 'Approved',
    submitted_date: null,
    response_date: null,
    due_date: null,
    licensor_comments: null,
    opportunity: null,
  },
]

vi.mock('@/features/crm/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/queries')>()
  return {
    ...actual,
    listData: (data: unknown) => data ?? [],
    useApprovalsQuery: vi.fn(() => ({ data: approvals, isPending: false, isError: false, refetch: vi.fn() })),
  }
})

const { ApprovalsPage } = await import('./ApprovalsPage')

function renderPage() {
  return render(
    <MemoryRouter>
      <ApprovalsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('Approvals Open/All segment matches the Overview aggregate (issue #49)', () => {
  it('defaults to Open: the list equals the unresolved-thread count', () => {
    renderPage()
    // Two unresolved threads show; the approved one does not.
    expect(screen.getByText('Awaiting legal')).toBeTruthy()
    expect(screen.getByText('Renewal pending')).toBeTruthy()
    expect(screen.queryByText('Approved deal')).toBeNull()
    // The segment counts say Open 2 / All 3.
    expect(within(screen.getByRole('tab', { name: /Open/ })).getByText('2')).toBeTruthy()
    expect(within(screen.getByRole('tab', { name: /All/ })).getByText('3')).toBeTruthy()
  })

  it('toggles to All and shows every thread', () => {
    renderPage()
    // Radix tabs activate on mousedown, not click.
    fireEvent.mouseDown(screen.getByRole('tab', { name: /All/ }))
    expect(screen.getByText('Awaiting legal')).toBeTruthy()
    expect(screen.getByText('Renewal pending')).toBeTruthy()
    expect(screen.getByText('Approved deal')).toBeTruthy()
  })
})
