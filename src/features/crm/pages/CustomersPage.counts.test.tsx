/**
 * @vitest-environment happy-dom
 *
 * Issue #57 step 2: the Contacts and Programs count columns read the
 * api.crm_customer_counts() aggregate. A failed counts query must show an em
 * dash plus an inline error — never 0, which would read as real data.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { Retailer } from '@/lib/types'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/crm/components/CustomerDrawer', () => ({ CustomerDrawer: () => null }))
vi.mock('@/features/crm/components/MergeCustomersDialog', () => ({ MergeCustomersDialog: () => null }))

const acme: Retailer = {
  id: 'c1',
  name: 'Acme',
  display_name: null,
  status: 'active',
  domain: null,
  logo_url: null,
  customer_status: 'ACTIVE_CUSTOMER',
  chain_type: null,
  routing_aliases: null,
}
const globex: Retailer = { ...acme, id: 'c2', name: 'Globex' }

// { failed: true } -> the counts query reports isError with no data.
const countsState: { failed?: boolean } = {}

vi.mock('@/features/crm/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/queries')>()
  return {
    ...actual,
    listData: (data: unknown) => data ?? [],
    useCustomerSegmentQuery: vi.fn(() => ({
      data: [acme, globex],
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    })),
    useCustomerSegmentCountsQuery: vi.fn(() => ({ data: undefined })),
    useIngestedDomainsQuery: vi.fn(() => ({ data: [], isPending: false, isError: false, isSuccess: true, refetch: vi.fn() })),
    useCustomerCountsQuery: vi.fn(() =>
      countsState.failed
        ? { data: undefined, isPending: false, isError: true, refetch: vi.fn() }
        : {
            data: new Map([
              ['c1', { contactCount: 3, programCount: 2 }],
              ['c2', { contactCount: 0, programCount: 0 }],
            ]),
            isPending: false,
            isError: false,
            refetch: vi.fn(),
          },
    ),
    useCustomerBrandsQuery: vi.fn(() => ({ data: [] })),
    useUpdateCustomerMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useUpdateIngestedDomainMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  }
})

const { CustomersPage } = await import('./CustomersPage')

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  countsState.failed = false
})

describe('CustomersPage count columns (#57)', () => {
  it('fills the Contacts and Programs columns from the counts aggregate', () => {
    renderPage()

    // Acme's row: 3 contacts, 2 programs from api.crm_customer_counts.
    const row = screen.getByText('Acme').closest('tr')
    expect(row).toBeTruthy()
    const cells = Array.from(row?.querySelectorAll('td') ?? []).map((td) => td.textContent)
    expect(cells).toContain('3')
    expect(cells).toContain('2')
    expect(screen.queryByText('Could not load contact and program counts.')).toBeNull()
  })

  it('shows an em dash and an inline error, never 0, when the aggregate fails', () => {
    countsState.failed = true
    renderPage()

    expect(screen.getByText('Could not load contact and program counts.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    // The count cells are em dashes; no zero poses as a real count.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
