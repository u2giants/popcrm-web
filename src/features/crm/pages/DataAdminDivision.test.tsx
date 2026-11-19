/**
 * @vitest-environment happy-dom
 *
 * Issue #62: a division rename is a bulk change over departments and programs.
 * It must confirm first with the record count, run updates in bounded batches
 * with allSettled, report saved/failed counts honestly on a partial failure,
 * and always invalidate the departments and programs feeds afterwards — never
 * restore a pre-rename cache snapshot that hides the rows that did save.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CrmDepartment, CrmOpportunity } from '@/lib/types'
import { crmKeys } from '@/features/crm/queries'

const toasts = { error: vi.fn(), success: vi.fn() }
vi.mock('sonner', () => ({ toast: toasts }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const departments: CrmDepartment[] = [
  { id: 'd1', name: 'Buying', category: null, division: 'Legacy', active: true, retailer: null, primary_buyer: null },
  { id: 'd2', name: 'Ecommerce', category: null, division: 'Legacy', active: true, retailer: null, primary_buyer: null },
]
const opportunities: CrmOpportunity[] = [
  {
    id: 'o1',
    name: 'Spring program',
    amount: null,
    close_date: null,
    stage: null,
    program_type: null,
    season_year: null,
    division: 'Legacy',
    production_po_number: null,
    sales_order_number: null,
    hard_delivery_date: null,
    ai_summary: null,
    ai_state: null,
    retailer: null,
    contact: null,
    department: null,
    factory: null,
    project: null,
  },
]

vi.mock('@/features/crm/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/queries')>()
  return {
    ...actual,
    useIngestedContactsQuery: vi.fn(() => ({ data: [], isPending: false })),
    useDepartmentsQuery: vi.fn(() => ({ data: departments, isPending: false })),
    useOpportunitiesQuery: vi.fn(() => ({ data: opportunities, isPending: false })),
    useCustomerPickerQuery: vi.fn(() => ({ data: [], isPending: false })),
    useCustomerBrandsQuery: vi.fn(() => ({ data: [], isPending: false, isError: false })),
    useCustomerDisplayName: vi.fn(() => (value: unknown) =>
      value && typeof value === 'object' ? ((value as { name?: string }).name ?? '') : ''),
  }
})

// Hoisted: the queries mock factory loads the real queries module, which
// imports the api module, so the api mock must not capture late consts.
const { updateDepartment, updateOpportunity } = vi.hoisted(() => ({
  updateDepartment: vi.fn(async () => {}),
  updateOpportunity: vi.fn(async () => {}),
}))
vi.mock('@/features/crm/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/api')>()
  return { ...actual, updateDepartment, updateOpportunity }
})

const { DataAdminPage } = await import('./DataAdminPage')

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  render(
    <QueryClientProvider client={queryClient}>
      <DataAdminPage />
    </QueryClientProvider>,
  )
  return { queryClient, invalidateSpy }
}

function armRename() {
  // Radix tabs activate on mousedown, not click.
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Divisions' }))
  fireEvent.click(screen.getByText('Select division'))
  // The divisions value list shows the same word as a badge, so pick the button.
  fireEvent.click(screen.getByRole('button', { name: 'Legacy' }))
  fireEvent.change(screen.getByPlaceholderText('Clean division name'), { target: { value: 'Modern' } })
  fireEvent.click(screen.getByRole('button', { name: 'Rename Division' }))
  // The confirm dialog names the exact record count before anything runs.
  expect(screen.getByText('Rename this division?')).toBeTruthy()
  expect(screen.getByText(/3 records — 2 departments and 1 program/)).toBeTruthy()
}

beforeEach(() => {
  vi.clearAllMocks()
  updateDepartment.mockImplementation(async () => {})
  updateOpportunity.mockImplementation(async () => {})
})

afterEach(cleanup)

describe('DataAdmin division rename (issue #62)', () => {
  it('confirms with the record count and does not touch records before the confirm', () => {
    renderPage()
    armRename()
    expect(updateDepartment).not.toHaveBeenCalled()
    expect(updateOpportunity).not.toHaveBeenCalled()
  })

  it('reports 2 saved / 1 failed and invalidates both feeds when one update rejects', async () => {
    updateOpportunity.mockRejectedValueOnce(new Error('rpc offline'))
    const { invalidateSpy } = renderPage()
    armRename()
    fireEvent.click(screen.getByRole('button', { name: 'Rename division' }))
    await waitFor(() => expect(toasts.error).toHaveBeenCalled())
    expect(toasts.error).toHaveBeenCalledWith(
      expect.stringMatching(/2 saved, 1 failed/),
      expect.objectContaining({ description: expect.stringContaining('rpc offline') }),
    )
    expect(toasts.success).not.toHaveBeenCalled()
    // All three records were attempted, each saved on its own.
    expect(updateDepartment).toHaveBeenCalledTimes(2)
    expect(updateOpportunity).toHaveBeenCalledTimes(1)
    // The cache is never snapshotted back: both feeds are invalidated so the
    // table refetches the true server state, including the failed remainder.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...crmKeys.all, 'departments'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...crmKeys.all, 'opportunities'] })
  })

  it('renames every record and clears the form when all updates succeed', async () => {
    renderPage()
    armRename()
    fireEvent.click(screen.getByRole('button', { name: 'Rename division' }))
    await waitFor(() => expect(toasts.success).toHaveBeenCalledWith('Renamed division on 3 records'))
    expect(toasts.error).not.toHaveBeenCalled()
    expect((screen.getByPlaceholderText('Clean division name') as HTMLInputElement).value).toBe('')
  })
})
