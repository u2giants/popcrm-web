/**
 * @vitest-environment happy-dom
 *
 * #58: a failed linked-domains query must show an error with a retry, never
 * the "No linked email domains." empty state or a "(0)" count that reads as
 * real data.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Retailer } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/crm/components/CustomerLogoField', () => ({
  CustomerLogoField: () => null,
}))

const refetch = vi.fn()

const domainsQueryState: { data?: unknown[]; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: true,
}

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useIngestedContactsQuery: vi.fn(() => ({ data: [] })),
  useDepartmentsQuery: vi.fn(() => ({ data: [] })),
  useOpportunitiesQuery: vi.fn(() => ({ data: [] })),
  useEmailsQuery: vi.fn(() => ({ data: [] })),
  useCustomerIngestedDomainsQuery: vi.fn(() => ({ ...domainsQueryState, refetch })),
  useUpdateCustomerMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveCustomerMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

const { CustomerDrawer } = await import('./CustomerDrawer')

const row = {
  id: 'c1',
  name: 'Acme',
  display_name: null,
  domain: null,
  logo_url: null,
  routing_aliases: '',
  customer_status: 'ACTIVE_CUSTOMER',
} as unknown as Retailer

afterEach(() => {
  cleanup()
  refetch.mockClear()
})

describe('CustomerDrawer linked email domains (#58)', () => {
  it('shows a load failure with retry instead of an empty list', () => {
    render(<CustomerDrawer row={row} onClose={() => {}} />)

    expect(screen.getByText('Could not load linked email domains.')).toBeTruthy()
    expect(screen.queryByText('No linked email domains.')).toBeNull()
    // A failed load must not claim a count either.
    expect(screen.queryByText('Linked email domains (0)')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('keeps the count and empty wording when the query succeeds with none', () => {
    domainsQueryState.data = []
    domainsQueryState.isError = false

    render(<CustomerDrawer row={row} onClose={() => {}} />)

    expect(screen.getByText('Linked email domains (0)')).toBeTruthy()
    expect(screen.getByText('No linked email domains.')).toBeTruthy()
    expect(screen.queryByText('Could not load linked email domains.')).toBeNull()

    domainsQueryState.data = undefined
    domainsQueryState.isError = true
  })
})
