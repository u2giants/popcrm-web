/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Retailer } from '@/lib/types'

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

vi.mock('@/features/crm/queries', () => ({
  useCustomerMergePreviewsQuery: vi.fn(() => ({ data: previews, isPending: false })),
  useMergeCustomersMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('@/features/crm/api', () => ({ previewCustomerMerge: vi.fn() }))

const { MergeCustomersDialog } = await import('./MergeCustomersDialog')

const record = (id: string, name: string, domain: string | null = null) => ({
  id,
  name,
  display_name: name,
  domain,
  customer_status: null,
}) as Retailer

describe('MergeCustomersDialog', () => {
  it('reviews any number of selected customers with one survivor', () => {
    render(
      <MergeCustomersDialog
        records={[
          record('customer-a', 'Alpha', 'alpha.example'),
          record('customer-b', 'Beta'),
          record('customer-c', 'Gamma'),
        ]}
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
})
