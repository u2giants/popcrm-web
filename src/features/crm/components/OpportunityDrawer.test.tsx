/**
 * @vitest-environment happy-dom
 *
 * #59: the Meetings tile counted meetings customer-wide but matched empty
 * customer id to empty customer id, so a program with no customer showed the
 * count of every unlinked meeting. It is now labeled "Customer meetings" and
 * shows an em dash when the program has no customer.
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CrmMeetingNote, CrmOpportunity } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useEmailsQuery: vi.fn(() => ({ data: [] })),
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

afterEach(cleanup)

const countTile = () => {
  const label = screen.getByText('Customer meetings')
  return label.parentElement?.querySelector('.text-lg')?.textContent
}

describe('OpportunityDrawer meetings count (#59)', () => {
  it('counts only the program customer’s meetings, labeled as customer-wide', () => {
    render(
      <OpportunityDrawer
        row={{ id: 'o1', name: 'Program', retailer: 'r1', stage: 'BUYER_REVIEW' } as unknown as CrmOpportunity}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Customer meetings')).toBeTruthy()
    expect(countTile()).toBe('1')
  })

  it('shows an em dash instead of counting unlinked meetings when the program has no customer', () => {
    render(
      <OpportunityDrawer
        row={{ id: 'o2', name: 'Program', retailer: null, stage: 'BUYER_REVIEW' } as unknown as CrmOpportunity}
        onClose={vi.fn()}
      />,
    )
    expect(countTile()).toBe('—')
  })
})
