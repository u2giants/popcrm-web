/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mutateAsync = vi.fn(() => Promise.resolve())

vi.mock('@/features/crm/queries', () => ({
  useUpdateCustomerMutation: () => ({ mutateAsync, isPending: false }),
}))

vi.mock('@/features/crm/components/CustomerLogoField', () => ({
  CustomerLogoField: () => null,
}))

const { CustomerNameField } = await import('./CustomerDrawer')

describe('CustomerNameField', () => {
  it('renames the visible customer label through display_name', async () => {
    render(<CustomerNameField customerId="customer-1" name="Old Name" />)

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }))
    const input = screen.getByLabelText('Customer name')
    expect((input as HTMLInputElement).value).toBe('Old Name')

    fireEvent.change(input, { target: { value: '  New Name  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'customer-1',
        values: { display_name: 'New Name' },
      })
    })
  })
})
