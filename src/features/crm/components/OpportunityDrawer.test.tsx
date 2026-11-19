/**
 * @vitest-environment happy-dom
 *
 * #59: the Meetings tile counted meetings customer-wide but matched empty
 * customer id to empty customer id, so a program with no customer showed the
 * count of every unlinked meeting. It is now labeled "Customer meetings" and
 * shows an em dash when the program has no customer.
 *
 * #40: the Emails tile reads the scoped hook's server total instead of the
 * matched rows inside the company-wide newest-500 feed, and shows an em dash
 * (never a false 0) when the count query fails.
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CrmMeetingNote, CrmOpportunity } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

type EmailsForStub = {
  rows: { id: string; subject?: string; sender?: string }[]
  total: number | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

// Records the hook arguments so tests can pin the scoped filter (#40);
const emailsForQuery = vi.fn<(filter: unknown, limit: number) => EmailsForStub>()
emailsForQuery.mockReturnValue({
  rows: [],
  total: 0,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
})

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useEmailsForQuery: (...args: unknown[]) => emailsForQuery(...(args as Parameters<typeof emailsForQuery>)),
  useMeetingsQuery: vi.fn(() => ({
    data: [
      { id: 'm1', name: 'Acme sync', retailer: 'r1' },
      { id: 'm2', name: 'Unlinked sync', retailer: null },
      { id: 'm3', name: 'Other retailer sync', retailer: 'r2' },
    ] as CrmMeetingNote[],
  })),
  useNotesQuery: vi.fn(() => ({ data: [] })),
  useTasksQuery: vi.fn(() => ({ data: [] })),
  useSetOpportunityStageMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateOpportunityMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

const { OpportunityDrawer } = await import('./OpportunityDrawer')

afterEach(() => {
  cleanup()
  emailsForQuery.mockReset()
  emailsForQuery.mockReturnValue(stub({}))
})

const countTile = (label: string) => {
  const el = screen.getByText(label)
  return el.parentElement?.querySelector('.text-lg')?.textContent
}

const program = (overrides: Partial<CrmOpportunity> = {}) =>
  ({ id: 'o1', name: 'Program', retailer: 'r1', stage: 'BUYER_REVIEW', ...overrides }) as unknown as CrmOpportunity

const stub = (overrides: Partial<EmailsForStub>): EmailsForStub => ({
  rows: [],
  total: 0,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  ...overrides,
})

describe('OpportunityDrawer meetings count (#59)', () => {
  it('counts only the program customer’s meetings, labeled as customer-wide', () => {
    render(<OpportunityDrawer row={program()} onClose={vi.fn()} />)
    expect(screen.getByText('Customer meetings')).toBeTruthy()
    expect(countTile('Customer meetings')).toBe('1')
  })

  it('shows an em dash instead of counting unlinked meetings when the program has no customer', () => {
    render(<OpportunityDrawer row={program({ retailer: null })} onClose={vi.fn()} />)
    expect(countTile('Customer meetings')).toBe('—')
  })
})

describe('OpportunityDrawer emails count (#40)', () => {
  it('reads the count from the scoped program query’s server total', () => {
    emailsForQuery.mockReturnValue(stub({ total: 7 }))
    render(<OpportunityDrawer row={program()} onClose={vi.fn()} />)
    expect(emailsForQuery).toHaveBeenCalledWith({ opportunityId: 'o1' }, 1)
    expect(countTile('Emails')).toBe('7')
  })

  it('shows an em dash, not 0, when the scoped count query fails', () => {
    emailsForQuery.mockReturnValue(stub({ total: null, isError: true }))
    render(<OpportunityDrawer row={program()} onClose={vi.fn()} />)
    expect(countTile('Emails')).toBe('—')
  })
})
