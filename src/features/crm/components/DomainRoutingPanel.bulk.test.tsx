/**
 * @vitest-environment happy-dom
 *
 * Bulk-routing several email domains to one customer. Every selected domain
 * must land on that customer (no last-write-wins under the table's six-wide
 * bulk concurrency), the target is validated before anything is removed and a
 * failed add restores what was removed, '+ Create new customer…' never
 * reports success in a bulk edit, and a domain an unclassified customer
 * already holds shows as routed to it and is moved off it when re-routed.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import type { CrmIngestedDomain, Retailer } from '@/lib/types'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

// Per-test feeds and mutation, read by the mocked query hooks below.
const state = vi.hoisted(() => ({
  domains: [] as CrmIngestedDomain[],
  active: [] as Retailer[],
  all: [] as Retailer[],
  picker: [] as Retailer[],
  updateCustomer: vi.fn(),
}))

vi.mock('@/features/crm/queries', () => ({
  listData: (data: unknown) => data ?? [],
  useIngestedDomainsQuery: () => ({ data: state.domains, isPending: false }),
  useRetailersQuery: () => ({ data: state.active, isPending: false }),
  useCustomerSegmentQuery: () => ({ data: state.all, isPending: false }),
  useCustomerPickerQuery: () => ({ data: state.picker, isPending: false }),
  useUpdateCustomerMutation: () => ({ mutateAsync: state.updateCustomer }),
  useUpdateIngestedDomainMutation: () => ({ mutateAsync: vi.fn() }),
  // CreateCustomerDialog (rendered by the panel) reads these.
  useContactsByDomainQuery: () => ({ data: [] }),
  useCreateCustomerMutation: () => ({ mutateAsync: vi.fn() }),
}))

const { DomainRoutingPanel } = await import('./DomainRoutingPanel')

const domain = (name: string): CrmIngestedDomain => ({
  id: `domain-${name}`,
  domain: name,
  display_name: null,
  status: 'POTENTIAL_CUSTOMER',
  email_count: 1,
  first_seen_at: null,
  last_seen_at: null,
  last_sender: null,
  sample_subject: null,
  updated_at: null,
  customer_id: null,
  customer_name: null,
})

const retailer = (id: string, name: string, aliases: string | null, classification = 'ACTIVE_CUSTOMER'): Retailer => ({
  id,
  name,
  display_name: name,
  status: 'active',
  domain: null,
  logo_url: null,
  customer_status: classification,
  chain_type: null,
  routing_aliases: aliases,
})

function renderPanel() {
  render(<DomainRoutingPanel query="" />)
}

function applyBulk(value: string) {
  fireEvent.change(screen.getByLabelText('Value to apply'), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: /apply to selected/i }))
}

const writesFor = (id: string) =>
  state.updateCustomer.mock.calls
    .filter((call) => call[0].id === id)
    .map((call) => String(call[0].values.routing_aliases))

const aliasesOfWrite = (value: string) =>
  value.split(/[,\n;]/).map((a) => a.trim()).filter(Boolean).sort()

describe('DomainRoutingPanel bulk routing', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    state.domains = []
    state.active = []
    state.all = []
    state.picker = []
  })

  it('routes six domains applied concurrently to one customer without dropping any', async () => {
    state.domains = ['shop1.example', 'shop2.example', 'shop3.example', 'shop4.example', 'shop5.example', 'shop6.example']
      .map(domain)
    const target = retailer('customer-y', 'Yuma Toys', null)
    state.active = [target]
    state.all = [target]
    state.picker = [target]
    // A real save is async; all six bulk edits start before the first settles.
    state.updateCustomer.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
    renderPanel()

    fireEvent.click(screen.getByLabelText('Select all rows on this page'))
    applyBulk('customer-y')

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    const targetWrites = writesFor('customer-y')
    expect(targetWrites).toHaveLength(6)
    expect(aliasesOfWrite(targetWrites[targetWrites.length - 1])).toEqual([
      'shop1.example', 'shop2.example', 'shop3.example', 'shop4.example', 'shop5.example', 'shop6.example',
    ])
  })

  it('restores the previous customer when the target add fails, and reports the bulk row failed', async () => {
    state.domains = [domain('legacy.example')]
    state.active = [retailer('customer-y', 'Yuma Toys', null)]
    state.all = [
      retailer('customer-o', 'Old Market', 'legacy.example', 'OTHER'),
      retailer('customer-y', 'Yuma Toys', null),
    ]
    state.picker = [retailer('customer-y', 'Yuma Toys', null)]
    state.updateCustomer.mockImplementation(async ({ id }: { id: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      if (id === 'customer-y') throw new Error('save failed')
    })
    renderPanel()

    fireEvent.click(screen.getByLabelText('Select row'))
    applyBulk('customer-y')

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    // Removed from the old customer, then put back because the add failed.
    expect(writesFor('customer-o')).toEqual(['', 'legacy.example'])
    // The failed row stays selected for a retry.
    expect(screen.getByText('1 selected')).toBeTruthy()
  })

  it('does not report success for a bulk edit that picks "+ Create new customer…"', async () => {
    state.domains = [domain('a.example'), domain('b.example')]
    const target = retailer('customer-y', 'Yuma Toys', null)
    state.active = [target]
    state.all = [target]
    state.picker = [target]
    state.updateCustomer.mockImplementation(async () => {})
    renderPanel()

    fireEvent.click(screen.getByLabelText('Select all rows on this page'))
    applyBulk('__create_new__')

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    expect(state.updateCustomer).not.toHaveBeenCalled()
  })

  it('shows a domain held by an unclassified customer as routed and moves it when re-routed', async () => {
    state.domains = [domain('legacy.example')]
    state.active = [retailer('customer-y', 'Yuma Toys', null)]
    state.all = [
      retailer('customer-o', 'Old Market', 'legacy.example', 'OTHER'),
      retailer('customer-y', 'Yuma Toys', null),
    ]
    state.picker = [retailer('customer-y', 'Yuma Toys', null)]
    state.updateCustomer.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
    renderPanel()

    expect(screen.getByText('Routed to Old Market')).toBeTruthy()

    // Re-route through the inline editor on the Routes-to cell.
    fireEvent.click(screen.getByText('Routed to Old Market').closest('td')!)
    fireEvent.click(await screen.findByRole('button', { name: 'Yuma Toys' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(aliasesOfWrite(writesFor('customer-o').at(-1)!)).toEqual([])
    expect(aliasesOfWrite(writesFor('customer-y').at(-1)!)).toEqual(['legacy.example'])
  })
})
