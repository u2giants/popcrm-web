/**
 * @vitest-environment happy-dom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useAllContactsQuery: vi.fn(() => ({ data: [keep, drop] })),
  useMergeContactsMutation: vi.fn(() => ({ mutateAsync, isPending: false })),
}))

const { MergeContactsDialog } = await import('./MergeContactsDialog')

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
})
