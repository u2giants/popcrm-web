/**
 * @vitest-environment happy-dom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Retailer } from '@/lib/types'
import type { CustomerMergePreview } from '@/features/crm/api'

const previews = [
  {
    ok: true,
    previewToken: 'preview-b',
    affectedCounts: [{ label: 'contacts', count: 2 }],
    movingAliases: ['Beta'],
    conflicts: [],
  },
  {
    ok: true,
    previewToken: 'preview-c',
    affectedCounts: [{ label: 'contacts', count: 3 }],
    movingAliases: ['Gamma'],
    conflicts: [],
  },
]

const mutateAsync = vi.fn()

vi.mock('@/features/crm/queries', () => ({
  useCustomerMergePreviewsQuery: vi.fn(() => ({ data: previews, isPending: false })),
  useMergeCustomersMutation: vi.fn(() => ({ mutateAsync, isPending: false })),
}))

vi.mock('@/features/crm/api', () => ({ previewCustomerMerge: vi.fn() }))

const { MergeCustomersDialog } = await import('./MergeCustomersDialog')
const { previewCustomerMerge } = await import('@/features/crm/api')
const { useCustomerMergePreviewsQuery } = await import('@/features/crm/queries')

const record = (id: string, name: string, domain: string | null = null) => ({
  id,
  name,
  display_name: name,
  domain,
  customer_status: null,
}) as Retailer

const selection = [
  record('customer-a', 'Alpha', 'alpha.example'),
  record('customer-b', 'Beta'),
  record('customer-c', 'Gamma'),
]

beforeEach(() => {
  vi.mocked(useCustomerMergePreviewsQuery).mockReturnValue({
    data: previews,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCustomerMergePreviewsQuery>)
})

afterEach(cleanup)

describe('MergeCustomersDialog', () => {
  it('reviews any number of selected customers with one survivor', () => {
    render(
      <MergeCustomersDialog
        records={selection}
        onClose={vi.fn()}
        onMerged={vi.fn()}
      />,
    )

    expect(screen.getAllByText('Alpha')).toHaveLength(2)
    expect(screen.getByText('Beta')).toBeTruthy()
    expect(screen.getByText('Gamma')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('Aliases kept: Beta, Gamma')).toBeTruthy()

    const mergeButton = screen.getByRole('button', { name: 'Merge 2 records' }) as HTMLButtonElement
    expect(mergeButton.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Reason for the merge'), { target: { value: 'Duplicate imports' } })
    expect(mergeButton.disabled).toBe(false)
  })

  it('starts the merge loop only once for two rapid clicks', async () => {
    // Hold the very first preflight so the second click lands while the first
    // loop is still mid-await, exactly where merge.isPending is false.
    let preflightCalls = 0
    let releaseFirst!: (value: CustomerMergePreview) => void
    const firstPreflight = new Promise<CustomerMergePreview>((resolve) => {
      releaseFirst = resolve
    })
    vi.mocked(previewCustomerMerge).mockImplementation(async () => {
      preflightCalls += 1
      return preflightCalls === 1
        ? firstPreflight
        : { ok: true, previewToken: `fresh-${preflightCalls}`, affectedCounts: [], movingAliases: [], conflicts: [] }
    })
    mutateAsync.mockResolvedValue({ ok: true })

    const onClose = vi.fn()
    const onMerged = vi.fn()
    render(<MergeCustomersDialog records={selection} onClose={onClose} onMerged={onMerged} />)
    fireEvent.change(screen.getByLabelText('Reason for the merge'), { target: { value: 'Duplicate imports' } })

    const mergeButton = screen.getByRole('button', { name: 'Merge 2 records' }) as HTMLButtonElement
    fireEvent.click(mergeButton)
    fireEvent.click(mergeButton)

    // The running flag locks the button for the whole loop, not just the
    // mutation windows.
    const workingButton = screen.getByRole('button', { name: 'Merging…' }) as HTMLButtonElement
    expect(workingButton.disabled).toBe(true)

    releaseFirst({ ok: true, previewToken: 'fresh-1', affectedCounts: [], movingAliases: [], conflicts: [] })
    await waitFor(() => expect(onMerged).toHaveBeenCalledTimes(1))

    expect(previewCustomerMerge).toHaveBeenCalledTimes(2)
    expect(mutateAsync).toHaveBeenCalledTimes(2)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows a failed preview check with a retry', () => {
    const refetch = vi.fn()
    vi.mocked(useCustomerMergePreviewsQuery).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useCustomerMergePreviewsQuery>)

    render(<MergeCustomersDialog records={selection} onClose={vi.fn()} onMerged={vi.fn()} />)

    expect(screen.getByText('Could not check what would move. Check your connection and try again.')).toBeTruthy()

    const mergeButton = screen.getByRole('button', { name: 'Merge 2 records' }) as HTMLButtonElement
    expect(mergeButton.disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
