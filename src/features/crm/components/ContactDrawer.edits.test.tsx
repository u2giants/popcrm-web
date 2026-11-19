/**
 * @vitest-environment happy-dom
 *
 * Issue #39 from the drawer side: a null email/phone/job_title is the explicit
 * "clear this field" instruction, so ContactDrawer must send it only for
 * fields that actually changed — not re-send nulls for fields that were
 * already empty, and not swallow a real clear.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Buyer } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const updateContact = vi.fn()

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useEmailsQuery: vi.fn(() => ({ data: [] })),
  useMeetingsQuery: vi.fn(() => ({ data: [] })),
  useDepartmentsQuery: vi.fn(() => ({ data: [] })),
  useCustomerPickerQuery: vi.fn(() => ({ data: [] })),
  useAllContactsQuery: vi.fn(() => ({ data: [] })),
  useMergeContactsMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDefunctContactsQuery: vi.fn(() => ({ data: {} })),
  useUpdateContactMutation: vi.fn(() => ({ mutateAsync: updateContact, isPending: false })),
  useSetContactDefunctMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveContactMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))
vi.mock('@/auth/auth', () => ({ useAuth: vi.fn(() => ({ user: { roles: ['administrator'] } })) }))

const { ContactDrawer } = await import('./ContactDrawer')

afterEach(() => {
  cleanup()
  updateContact.mockClear()
})

const buyer = {
  id: 'b1',
  name: 'Holly Price',
  email: 'holly@acme.example',
  phone: '555-0100',
  job_title: 'Buyer',
} as unknown as Buyer

function startEdit() {
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
}

async function saveEdits() {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(updateContact).toHaveBeenCalledTimes(1))
}

describe('ContactDrawer text edits (#39)', () => {
  it('sends only the changed fields, leaving untouched ones out of the patch', async () => {
    updateContact.mockResolvedValueOnce(undefined)
    render(<ContactDrawer row={buyer} onClose={vi.fn()} />)

    startEdit()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Holly P. Price' } })
    await saveEdits()

    const { values } = updateContact.mock.calls[0][0]
    expect(values.name).toBe('Holly P. Price')
    expect('email' in values).toBe(false)
    expect('phone' in values).toBe(false)
    expect('job_title' in values).toBe(false)
  })

  it('sends an explicit null when a stored phone is cleared', async () => {
    updateContact.mockResolvedValueOnce(undefined)
    render(<ContactDrawer row={buyer} onClose={vi.fn()} />)

    startEdit()
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '' } })
    await saveEdits()

    const { values } = updateContact.mock.calls[0][0]
    expect(values.phone).toBeNull()
    expect('email' in values).toBe(false)
    expect('job_title' in values).toBe(false)
  })

  it('does not ask to clear a field that was already empty', async () => {
    updateContact.mockResolvedValueOnce(undefined)
    render(<ContactDrawer row={{ ...buyer, phone: '', job_title: '' }} onClose={vi.fn()} />)

    startEdit()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'holly.p@acme.example' } })
    await saveEdits()

    const { values } = updateContact.mock.calls[0][0]
    expect(values.email).toBe('holly.p@acme.example')
    expect('phone' in values).toBe(false)
    expect('job_title' in values).toBe(false)
  })
})

describe('ContactDrawer department scroll (#59)', () => {
  const scrollIntoView = vi.fn()
  Element.prototype.scrollIntoView = scrollIntoView

  afterEach(() => {
    scrollIntoView.mockClear()
  })

  it('scrolls the department row once per contact, not on every keystroke', () => {
    const { rerender } = render(<ContactDrawer row={buyer} onClose={vi.fn()} focusDepartment />)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    // Typing re-renders the form; the old inline ref scrolled on every one of
    // those renders and yanked the form around.
    startEdit()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Holly P. Price' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'holly.p@acme.example' } })
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    // A different contact is a new scroll target.
    rerender(<ContactDrawer row={{ ...buyer, id: 'b2' } as unknown as Buyer} onClose={vi.fn()} focusDepartment />)
    expect(scrollIntoView).toHaveBeenCalledTimes(2)
  })
})
