/**
 * @vitest-environment happy-dom
 *
 * Issue #51: every create dialog must open with an empty form. Fill, submit
 * (mock ok), close, reopen — the fields must be blank again, not the values
 * from the last submission.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'

const contactCreate = vi.fn()
const programCreate = vi.fn()
const taskCreate = vi.fn()

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useCustomerPickerQuery: vi.fn(() => ({
    data: [
      { id: 'cust-1', name: 'Acme', display_name: 'Acme', status: 'active', customer_status: 'ACTIVE_CUSTOMER' },
    ],
  })),
  useDepartmentsQuery: vi.fn(() => ({
    data: [{ id: 'dept-1', name: 'Boys', retailer: { id: 'cust-1', name: 'Acme' } }],
  })),
  useAllContactsQuery: vi.fn(() => ({ data: [] })),
  useCreateContactMutation: vi.fn(() => ({ mutateAsync: contactCreate, isPending: false })),
  useCreateOpportunityMutation: vi.fn(() => ({ mutateAsync: programCreate, isPending: false })),
  useCreateTaskMutation: vi.fn(() => ({ mutateAsync: taskCreate, isPending: false })),
}))

const { CreateContactDialog } = await import('./CreateContactDialog')
const { CreateProgramDialog } = await import('./CreateProgramDialog')
const { CreateTaskDialog } = await import('./CreateTaskDialog')

afterEach(cleanup)

type CreateDialog = (props: { open: boolean; onClose: () => void }) => ReactElement

// The pages toggle `open`; the reopened dialog must behave like a fresh mount.
function reopen(Dialog: CreateDialog, onClose: () => void, rerender: (node: ReactElement) => void) {
  rerender(<Dialog open={false} onClose={onClose} />)
  rerender(<Dialog open onClose={onClose} />)
}

function input(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement
}

describe('create dialogs reopen empty after a submit (#51)', () => {
  it('contact: fill, submit, reopen — every field is blank again', async () => {
    contactCreate.mockResolvedValueOnce({ id: 'c1', name: 'Holly Price' })
    const onClose = vi.fn()
    const view = render(<CreateContactDialog open onClose={onClose} />)

    fireEvent.change(input('Name'), { target: { value: 'Holly Price' } })
    fireEvent.change(input('Email'), { target: { value: 'holly@acme.example' } })
    fireEvent.change(input('Phone'), { target: { value: '555-0100' } })
    fireEvent.change(input('Title'), { target: { value: 'Buyer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(contactCreate).toHaveBeenCalledTimes(1)

    reopen(CreateContactDialog, onClose, view.rerender)
    expect(input('Name').value).toBe('')
    expect(input('Email').value).toBe('')
    expect(input('Phone').value).toBe('')
    expect(input('Title').value).toBe('')
  })

  it('program: fill, submit, reopen — every field is blank again', async () => {
    programCreate.mockResolvedValueOnce({ id: 'o1', name: 'Spring program' })
    const onClose = vi.fn()
    const view = render(<CreateProgramDialog open onClose={onClose} />)

    fireEvent.change(input('Name'), { target: { value: 'Spring program' } })
    fireEvent.click(screen.getByText('Select customer'))
    fireEvent.click(screen.getByText('Acme'))
    fireEvent.change(input('Amount'), { target: { value: '1500' } })
    fireEvent.change(input('Close date'), { target: { value: '2026-12-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add program' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(programCreate).toHaveBeenCalledTimes(1)

    reopen(CreateProgramDialog, onClose, view.rerender)
    expect(input('Name').value).toBe('')
    expect(input('Amount').value).toBe('')
    expect(input('Close date').value).toBe('')
    // The stage select resets to the first stage rather than the last choice.
    expect((screen.getByLabelText('Stage') as HTMLSelectElement).value).toBe('DIRECTIVE_RECEIVED')
  })

  it('task: fill, submit, reopen — every field is blank again', async () => {
    taskCreate.mockResolvedValueOnce(undefined)
    const onClose = vi.fn()
    const view = render(<CreateTaskDialog open onClose={onClose} />)

    fireEvent.change(input('Title'), { target: { value: 'Send samples' } })
    fireEvent.change(input('Due date'), { target: { value: '2026-12-01' } })
    fireEvent.change(screen.getByLabelText('Details'), { target: { value: 'Overnight to the buyer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(taskCreate).toHaveBeenCalledTimes(1)

    reopen(CreateTaskDialog, onClose, view.rerender)
    expect(input('Title').value).toBe('')
    expect(input('Due date').value).toBe('')
    expect((screen.getByLabelText('Details') as HTMLTextAreaElement).value).toBe('')
  })
})
