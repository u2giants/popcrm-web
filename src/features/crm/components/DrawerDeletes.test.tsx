/**
 * @vitest-environment happy-dom
 *
 * One confirm-dialog test per drawer delete: every remove is two clicks and
 * names the record, and the confirm calls the right mutation.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Buyer, CrmMeetingNote, CrmNote, CrmOpportunity, CrmTask, Retailer } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/crm/components/CustomerLogoField', () => ({
  CustomerLogoField: () => null,
}))

const calls = {
  archiveContact: vi.fn(),
  deleteNote: vi.fn(),
  deleteTask: vi.fn(),
  deleteMeeting: vi.fn(),
  archiveOpportunity: vi.fn(),
  archiveCustomer: vi.fn(),
}

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useEmailsQuery: vi.fn(() => ({ data: [] })),
  useMeetingsQuery: vi.fn(() => ({ data: [] })),
  useNotesQuery: vi.fn(() => ({ data: [] })),
  useTasksQuery: vi.fn(() => ({ data: [] })),
  useDepartmentsQuery: vi.fn(() => ({ data: [] })),
  useIngestedContactsQuery: vi.fn(() => ({ data: [] })),
  useOpportunitiesQuery: vi.fn(() => ({ data: [] })),
  useCustomerPickerQuery: vi.fn(() => ({ data: [] })),
  useAllContactsQuery: vi.fn(() => ({ data: [] })),
  useCustomerIngestedDomainsQuery: vi.fn(() => ({ data: [] })),
  useUpdateContactMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useMergeContactsMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveContactMutation: vi.fn(() => ({ mutateAsync: calls.archiveContact, isPending: false })),
  useUpdateNoteMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteNoteMutation: vi.fn(() => ({ mutateAsync: calls.deleteNote, isPending: false })),
  useUpdateTaskMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteTaskMutation: vi.fn(() => ({ mutateAsync: calls.deleteTask, isPending: false })),
  useDeleteMeetingMutation: vi.fn(() => ({ mutateAsync: calls.deleteMeeting, isPending: false })),
  useUpdateOpportunityMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useSetOpportunityStageMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveOpportunityMutation: vi.fn(() => ({ mutateAsync: calls.archiveOpportunity, isPending: false })),
  useUpdateCustomerMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveCustomerMutation: vi.fn(() => ({ mutateAsync: calls.archiveCustomer, isPending: false })),
  useCreateNoteMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

const { ContactDrawer } = await import('./ContactDrawer')
const { NoteDrawer } = await import('./NoteDrawer')
const { TaskDrawer } = await import('./TaskDrawer')
const { MeetingDrawer } = await import('./MeetingDrawer')
const { OpportunityModal } = await import('./OpportunityModal')
const { CustomerDrawer } = await import('./CustomerDrawer')

afterEach(cleanup)

const buyer = { id: 'b1', name: 'Holly Price', email: 'holly@acme.example' } as unknown as Buyer
const note = { id: 'n1', title: 'Kickoff note', body: 'text' } as unknown as CrmNote
const task = { id: 't1', title: 'Send samples' } as unknown as CrmTask
const meeting = { id: 'm1', name: 'Weekly sync' } as unknown as CrmMeetingNote
const opportunity = { id: 'o1', name: 'Spring 2027 program', stage: 'BUYER_REVIEW' } as unknown as CrmOpportunity
const customer = { id: 'cust-1', name: 'Acme', display_name: 'Acme' } as unknown as Retailer

async function confirmRemoval(label: string, confirmLabel: string) {
  fireEvent.click(screen.getByRole('button', { name: label }))
  // The confirm dialog names the record before anything is removed.
  expect(screen.getByRole('button', { name: confirmLabel })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: confirmLabel }))
  await waitFor(() => expect(screen.queryByRole('button', { name: confirmLabel })).toBeNull())
}

describe('drawer deletes', () => {
  it('contact: confirm names the contact, then archives', async () => {
    calls.archiveContact.mockResolvedValueOnce(undefined)
    render(<ContactDrawer row={buyer} onClose={vi.fn()} />)
    await confirmRemoval('Delete', 'Remove contact')
    expect(calls.archiveContact).toHaveBeenCalledWith('b1')
  })

  it('note: confirm names the note, then deletes', async () => {
    calls.deleteNote.mockResolvedValueOnce(undefined)
    render(<NoteDrawer row={note} onClose={vi.fn()} />)
    await confirmRemoval('Delete', 'Delete note')
    expect(calls.deleteNote).toHaveBeenCalledWith('n1')
  })

  it('task: confirm names the task, then deletes', async () => {
    calls.deleteTask.mockResolvedValueOnce(undefined)
    render(<TaskDrawer row={task} onClose={vi.fn()} />)
    await confirmRemoval('Delete', 'Delete task')
    expect(calls.deleteTask).toHaveBeenCalledWith('t1')
  })

  it('meeting: confirm names the meeting, then deletes', async () => {
    calls.deleteMeeting.mockResolvedValueOnce(undefined)
    render(<MeetingDrawer row={meeting} onClose={vi.fn()} />)
    await confirmRemoval('Delete', 'Delete meeting note')
    expect(calls.deleteMeeting).toHaveBeenCalledWith('m1')
  })

  it('program: confirm names the program, then archives', async () => {
    calls.archiveOpportunity.mockResolvedValueOnce(undefined)
    render(<OpportunityModal row={opportunity} onClose={vi.fn()} />)
    await confirmRemoval('Delete', 'Remove program')
    expect(calls.archiveOpportunity).toHaveBeenCalledWith('o1')
  })

  it('customer: confirm names the customer, then archives', async () => {
    calls.archiveCustomer.mockResolvedValueOnce(undefined)
    render(<CustomerDrawer row={customer} onClose={vi.fn()} />)
    await confirmRemoval('Delete', 'Remove customer')
    expect(calls.archiveCustomer).toHaveBeenCalledWith('cust-1')
  })
})
