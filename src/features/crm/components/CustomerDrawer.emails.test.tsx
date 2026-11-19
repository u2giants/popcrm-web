/**
 * @vitest-environment happy-dom
 *
 * #40: the drawer's "Recent email" list comes from the scoped per-customer
 * query (api.crm_emails_for_page by company id), not a filter over the
 * company-wide newest-500 feed — and a failed load shows an error with retry
 * instead of silently hiding the section.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Retailer } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/crm/components/CustomerLogoField', () => ({
  CustomerLogoField: () => null,
}))

const refetch = vi.fn()

type EmailsForStub = {
  rows: { id: string; subject?: string; sender?: string }[]
  total: number | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

const stub = (overrides: Partial<EmailsForStub>): EmailsForStub => ({
  rows: [],
  total: 0,
  isLoading: false,
  isError: false,
  refetch,
  ...overrides,
})

// Records the hook arguments so tests can pin the scoped filter (#40);
// mockReturnValue (set below and in afterEach) supplies the stub result.
const emailsForQuery = vi.fn<(filter: unknown, limit: number) => EmailsForStub>()

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useIngestedContactsQuery: vi.fn(() => ({ data: [] })),
  useDepartmentsQuery: vi.fn(() => ({ data: [] })),
  useOpportunitiesQuery: vi.fn(() => ({ data: [] })),
  useEmailsForQuery: (...args: unknown[]) => emailsForQuery(...(args as Parameters<typeof emailsForQuery>)),
  useCustomerIngestedDomainsQuery: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
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
  emailsForQuery.mockReset()
  emailsForQuery.mockReturnValue(stub({}))
})

describe('CustomerDrawer recent email (#40)', () => {
  it('renders the customer’s emails from the scoped company query', () => {
    emailsForQuery.mockReturnValue(
      stub({
        rows: [
          { id: 'e1', subject: 'Old spring order', sender: 'buyer@acme.example' },
          { id: 'e2', subject: 'Re: Old spring order', sender: 'buyer@acme.example' },
        ],
        total: 2,
      }),
    )

    render(<CustomerDrawer row={row} onClose={() => {}} />)

    expect(emailsForQuery).toHaveBeenCalledWith({ companyId: 'c1' }, 6)
    expect(screen.getByText('Old spring order')).toBeTruthy()
    expect(screen.getByText('Re: Old spring order')).toBeTruthy()
  })

  it('shows a load failure with retry instead of hiding the section', () => {
    emailsForQuery.mockReturnValue(stub({ total: null, isError: true }))

    render(<CustomerDrawer row={row} onClose={() => {}} />)

    expect(screen.getByText('Could not load recent email.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
