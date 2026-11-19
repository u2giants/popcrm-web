/**
 * @vitest-environment happy-dom
 *
 * #59: ModalInner must be keyed by the program. Without the key, an unsent
 * comment draft (and the last AI answer) survived switching to another
 * program — and one Enter would post the old draft onto the new program.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CrmOpportunity } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const createNote = vi.fn()

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useNotesQuery: vi.fn(() => ({ data: [] })),
  useTasksQuery: vi.fn(() => ({ data: [] })),
  useCreateNoteMutation: vi.fn(() => ({ mutateAsync: createNote, isPending: false })),
  useSetOpportunityStageMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveOpportunityMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))
vi.mock('@/features/crm/api', () => ({ askOpportunityAi: vi.fn() }))

const { OpportunityModal } = await import('./OpportunityModal')

afterEach(() => {
  cleanup()
  createNote.mockClear()
})

const programA = { id: 'o1', name: 'Program A', stage: 'BUYER_REVIEW' } as unknown as CrmOpportunity
const programB = { id: 'o2', name: 'Program B', stage: 'BUYER_REVIEW' } as unknown as CrmOpportunity

describe('OpportunityModal draft isolation (#59)', () => {
  it('does not carry an unsent comment into another program', () => {
    const { rerender } = render(<OpportunityModal row={programA} onClose={vi.fn()} />)

    const composer = screen.getByPlaceholderText('Add a comment…') as HTMLInputElement
    fireEvent.change(composer, { target: { value: 'draft about program A' } })
    expect(composer.value).toBe('draft about program A')

    rerender(<OpportunityModal row={programB} onClose={vi.fn()} />)

    const freshComposer = screen.getByPlaceholderText('Add a comment…') as HTMLInputElement
    expect(freshComposer.value).toBe('')
    expect(createNote).not.toHaveBeenCalled()
  })
})
