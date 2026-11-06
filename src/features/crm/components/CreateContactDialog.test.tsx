/**
 * @vitest-environment happy-dom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mutateAsync = vi.fn()

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
  useCreateContactMutation: vi.fn(() => ({ mutateAsync, isPending: false })),
}))

const { CreateContactDialog } = await import('./CreateContactDialog')

afterEach(cleanup)

describe('CreateContactDialog', () => {
  it('blocks saving until a name is entered', () => {
    render(<CreateContactDialog open onClose={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Add contact' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Holly Price' } })
    expect(button.disabled).toBe(false)
  })

  it('rejects a malformed email before submitting', () => {
    render(<CreateContactDialog open onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Holly Price' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    expect(screen.getByText('That email address does not look right.')).toBeTruthy()
    const button = screen.getByRole('button', { name: 'Add contact' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('submits the trimmed payload with the picked customer and department', async () => {
    const onClose = vi.fn()
    mutateAsync.mockResolvedValueOnce({ id: 'c1', name: 'Holly Price' })
    render(<CreateContactDialog open onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Holly Price  ' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' holly@acme.example ' } })
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Buyer ' } })

    // Pick customer through the combobox, then the department enabled by it.
    fireEvent.click(screen.getByText('Select customer'))
    fireEvent.click(screen.getByText('Acme'))
    fireEvent.click(screen.getByText('Select department'))
    fireEvent.click(screen.getByText('Boys'))

    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Holly Price',
      email: 'holly@acme.example',
      phone: null,
      job_title: 'Buyer',
      retailer_id: 'cust-1',
      department_id: 'dept-1',
    })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
