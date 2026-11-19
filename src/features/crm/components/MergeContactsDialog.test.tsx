/**
 * @vitest-environment happy-dom
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Buyer } from '@/lib/types'

const mutateAsync = vi.fn()

const keep = {
  id: 'keep-1',
  name: 'Holly Price',
  email: null,
  phone: null,
  job_title: 'Buyer',
  retailer: null,
} as unknown as Buyer

const drop = {
  id: 'drop-1',
  name: "'Holly Price'",
  email: 'holly@acme.example',
  phone: '555-0100',
  job_title: null,
  retailer: null,
} as unknown as Buyer

const other = {
  id: 'other-1',
  name: 'Cara Voss',
  email: 'cara@acme.example',
  phone: null,
  job_title: 'Buyer',
  retailer: null,
} as unknown as Buyer

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useAllContactsQuery: vi.fn(() => ({ data: [keep, drop, other] })),
  useMergeContactsMutation: vi.fn(() => ({ mutateAsync, isPending: false })),
  useEmailsQuery: vi.fn(() => ({ data: [] })),
  useMeetingsQuery: vi.fn(() => ({ data: [] })),
  useDepartmentsQuery: vi.fn(() => ({ data: [] })),
  useCustomerPickerQuery: vi.fn(() => ({ data: [] })),
  useDefunctContactsQuery: vi.fn(() => ({ data: {} })),
  useUpdateContactMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useSetContactDefunctMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveContactMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('@/auth/auth', () => ({ useAuth: vi.fn(() => ({ user: { roles: ['administrator'] } })) }))

const { MergeContactsDialog } = await import('./MergeContactsDialog')
const { ContactDrawer } = await import('./ContactDrawer')

// The merge dialog's portal content; the drawer itself is a Sheet, so this
// selector picks only the dialog.
const mergeDialog = () => within(document.querySelector('[data-slot="dialog-content"]') as HTMLElement)

afterEach(cleanup)

describe('MergeContactsDialog', () => {
  it('lists every other contact and keeps the open contact out', () => {
    render(<MergeContactsDialog keep={keep} onClose={vi.fn()} onMerged={vi.fn()} />)

    expect(screen.getByText("'Holly Price'")).toBeTruthy()
    expect(screen.queryByText('Merges away')).toBeNull()
    const mergeButton = screen.getByRole('button', { name: 'Merge' }) as HTMLButtonElement
    expect(mergeButton.disabled).toBe(true)
  })

  it('previews which fields the kept contact gains before merging', () => {
    render(<MergeContactsDialog keep={keep} onClose={vi.fn()} onMerged={vi.fn()} />)

    fireEvent.click(screen.getByText("'Holly Price'"))

    expect(screen.getAllByText('filled from duplicate').length).toBe(2)
    expect(screen.getAllByText('holly@acme.example').length).toBeGreaterThan(0)

    const mergeButton = screen.getByRole('button', { name: 'Merge' }) as HTMLButtonElement
    expect(mergeButton.disabled).toBe(false)
  })

  it('merges the picked duplicate into the kept contact, never the reverse', async () => {
    mutateAsync.mockResolvedValueOnce(undefined)
    render(<MergeContactsDialog keep={keep} onClose={vi.fn()} onMerged={vi.fn()} />)

    fireEvent.click(screen.getByText("'Holly Price'"))
    fireEvent.click(screen.getByRole('button', { name: 'Merge' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ keepId: 'keep-1', dropId: 'drop-1' }))
  })

  it('opens with nothing selected and an empty search after closing, even for another contact', () => {
    const onClose = vi.fn()
    const view = render(<MergeContactsDialog keep={keep} onClose={onClose} onMerged={vi.fn()} />)

    fireEvent.click(screen.getByText("'Holly Price'"))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()

    // The drawer drops `keep` to null on close, then a different contact opens it again.
    view.rerender(<MergeContactsDialog keep={null} onClose={onClose} onMerged={vi.fn()} />)
    view.rerender(<MergeContactsDialog keep={other} onClose={onClose} onMerged={vi.fn()} />)

    expect(screen.queryByText('Merges away')).toBeNull()
    expect((screen.getByLabelText('Find the duplicate') as HTMLInputElement).value).toBe('')
    const mergeButton = screen.getByRole('button', { name: 'Merge' }) as HTMLButtonElement
    expect(mergeButton.disabled).toBe(true)
  })

  it('never carries a duplicate picked in the drawer for one contact into a merge for another', async () => {
    const view = render(<ContactDrawer row={keep} onClose={vi.fn()} />)

    // Open the merge dialog for the first contact and pick their duplicate.
    fireEvent.click(screen.getByRole('button', { name: 'Merge' }))
    fireEvent.click(mergeDialog().getByText("'Holly Price'"))
    expect((mergeDialog().getByRole('button', { name: 'Merge' }) as HTMLButtonElement).disabled).toBe(false)

    // Cancel, switch the drawer to a different contact, open merge again.
    fireEvent.click(mergeDialog().getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull())
    view.rerender(<ContactDrawer row={other} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Merge' }))

    expect(mergeDialog().queryByText('Merges away')).toBeNull()
    expect((mergeDialog().getByLabelText('Find the duplicate') as HTMLInputElement).value).toBe('')
    expect((mergeDialog().getByRole('button', { name: 'Merge' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
