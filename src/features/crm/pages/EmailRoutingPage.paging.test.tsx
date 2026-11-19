/**
 * @vitest-environment happy-dom
 *
 * Issue #47: routing the last row of the final page shrinks the stage below
 * the current offset. The page must clamp itself back to the last real page
 * so staff never land on a blank "Nothing here" table with no pager out.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { CrmEmailMessage } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/auth/auth', () => ({ useAuth: vi.fn(() => ({ user: null })) }))
// The drawer is not under test here; nulling it keeps the mock surface small.
vi.mock('@/features/crm/components/EmailDrawer', () => ({ EmailDrawer: () => null }))
vi.mock('@/features/crm/components/DomainRoutingPanel', () => ({
  DomainRoutingPanel: () => null,
  useUnroutedCustomerDomains: () => [],
}))

// Per-test feeds and the recorded stage-page query arguments.
const state = vi.hoisted(() => ({
  counts: { needs_company: 251, needs_department: 0, needs_program: 0, routed: 0, skipped: 0, all: 251 },
  emails: [] as CrmEmailMessage[],
  pageArgs: [] as Array<[string, number, number]>,
}))

vi.mock('@/features/crm/queries', () => ({
  listData: (data: unknown) => data ?? [],
  useCustomerDisplayName: () => (value: unknown) =>
    value && typeof value === 'object' ? ((value as { name?: string }).name ?? '') : '',
  useCustomerBrandMap: () => new Map(),
  useEmailStageCountsQuery: () => ({ data: state.counts }),
  // Records every (stage, limit, offset) the page queries with; only the
  // first page of the stage returns rows, like the server would.
  useEmailStagePageQuery: (stage: string, limit: number, offset: number) => {
    state.pageArgs.push([stage, limit, offset])
    return { data: offset === 0 ? state.emails : [], isPending: false, isError: false, refetch: vi.fn() }
  },
  useDepartmentsQuery: () => ({ data: [] }),
  useCustomerPickerQuery: () => ({ data: [] }),
  useOpportunitiesQuery: () => ({ data: [] }),
  useRetailersQuery: () => ({ data: [] }),
  useFirefliesHealth: () => ({ data: true }),
  useUpdateEmailMutation: () => ({ mutateAsync: vi.fn() }),
}))

const { EmailRoutingPage } = await import('./EmailRoutingPage')

const email = (id: string, subject: string): CrmEmailMessage => ({
  id,
  subject,
  sender: 'buyer@acme.example',
  recipients: null,
  received_at: null,
  routing_status: 'UNROUTED',
  routing_method: null,
  body_preview: null,
  retailer: null,
  department: null,
  opportunity: null,
})

const lastOffset = () => state.pageArgs.at(-1)![2]

describe('Email Routing page clamps its page when a stage shrinks (issue #47)', () => {
  afterEach(() => {
    cleanup()
    state.pageArgs.length = 0
    state.counts = { needs_company: 251, needs_department: 0, needs_program: 0, routed: 0, skipped: 0, all: 251 }
  })

  it('drops from page 2 back to page 1 when the total falls from 251 to 250, instead of stranding on an empty page', async () => {
    state.emails = [email('e1', 'Welcome to the queue')]
    const { rerender } = render(<MemoryRouter><EmailRoutingPage /></MemoryRouter>)

    // Radix tabs activate on mousedown, not click.
    fireEvent.mouseDown(screen.getByRole('tab', { name: /needs company/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(lastOffset()).toBe(250)
    // The shrunk stage no longer has a second page of rows.
    expect(screen.getByText('Nothing here')).toBeTruthy()

    // The last message on that page is routed: the stage falls to one page.
    state.counts.needs_company = 250
    state.counts.all = 250
    rerender(<MemoryRouter><EmailRoutingPage /></MemoryRouter>)

    await waitFor(() => expect(lastOffset()).toBe(0))
    // Staff land back on the remaining rows with the pager retired for good.
    expect(screen.getByText('Welcome to the queue')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()
  })
})
