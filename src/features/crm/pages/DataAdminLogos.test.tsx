/**
 * @vitest-environment happy-dom
 *
 * Data Admin → Logos tab: rows take domain/logo_url from the brand feed
 * (merged by id onto picker customers), and every logo/domain save
 * invalidates the two feeds the tab reads (customerBrands + customerPicker).
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CustomerBrand } from '@/features/crm/api'
import type { Retailer } from '@/lib/types'

const api = {
  createDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
  setRetailerLogo: vi.fn(),
  updateDepartment: vi.fn(),
  updateOpportunity: vi.fn(),
  updateRetailer: vi.fn(),
  uploadRetailerLogo: vi.fn(),
}
vi.mock('@/features/crm/api', () => api)

const queryClient = {
  setQueriesData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
}
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => queryClient }))

let pickerRows: Retailer[] = []
let brandRows: CustomerBrand[] = []

function queryStub<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: vi.fn() }
}

vi.mock('@/features/crm/queries', () => ({
  crmKeys: { all: ['crm'] },
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useDepartmentsQuery: () => queryStub([]),
  useIngestedContactsQuery: () => queryStub([]),
  useOpportunitiesQuery: () => queryStub([]),
  useCustomerPickerQuery: () => queryStub(pickerRows),
  useCustomerBrandsQuery: () => queryStub(brandRows),
  useCustomerBrandMap: () => new Map(brandRows.map((b) => [b.id, b])),
  useCustomerDisplayName: () => (value: unknown) =>
    value && typeof value === 'object' ? String((value as { name?: string | null }).name ?? '') : String(value ?? ''),
}))

const { DataAdminPage } = await import('./DataAdminPage')

afterEach(cleanup)

function pickerCustomer(overrides: Partial<Retailer> & { id: string; name: string }): Retailer {
  return {
    display_name: null,
    status: 'active',
    domain: null,
    logo_url: null,
    customer_status: null,
    chain_type: null,
    routing_aliases: null,
    is_potential: false,
    ...overrides,
  }
}

function seedCustomers() {
  pickerRows = [pickerCustomer({ id: 'c-target', name: 'Target Corp' }), pickerCustomer({ id: 'c-acme', name: 'Acme Pty' })]
  brandRows = [
    { id: 'c-target', name: 'Target Corp', display_name: null, domain: 'target.com', logo_url: null },
    { id: 'c-other', name: 'Gone Ltd', display_name: null, domain: 'gone.example', logo_url: null },
  ]
}

// Radix tabs activate on mousedown, not click.
function openLogosTab() {
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Logos' }))
}

function invalidationCount(key: string) {
  return queryClient.invalidateQueries.mock.calls.filter(([{ queryKey }]) => queryKey[1] === key).length
}

describe('Data Admin Logos tab', () => {
  it('shows each picker customer the domain and source from the brand feed', () => {
    seedCustomers()
    render(<DataAdminPage />)
    openLogosTab()

    // Brand row merged by id: real domain and token-based source.
    expect(screen.getByText('target.com')).toBeTruthy()
    expect(screen.getByText('Logo.dev token only')).toBeTruthy()
    // Picker-only customer keeps the fallback; brands rows without a picker row are not listed.
    expect(screen.getByText('Initials fallback')).toBeTruthy()
    expect(screen.queryByText('gone.example')).toBeNull()
  })

  it('invalidates customerBrands and customerPicker after every logo/domain save', async () => {
    seedCustomers()
    api.updateRetailer.mockResolvedValue(undefined)
    api.setRetailerLogo.mockResolvedValue(undefined)
    api.uploadRetailerLogo.mockResolvedValue('https://cdn.example/logos/target-corp-logo.png')
    const { container } = render(<DataAdminPage />)
    openLogosTab()

    fireEvent.click(within(screen.getByText('target.com').closest('tr')!).getByRole('button', { name: 'Edit' }))
    expect(screen.getByText('Edit Logo')).toBeTruthy()

    // Token-domain save.
    const tokenSection = screen.getByText('Token logo.dev domain').parentElement!
    fireEvent.click(within(tokenSection).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateRetailer).toHaveBeenCalledWith('c-target', { domain: 'target.com' }))
    await waitFor(() => expect(invalidationCount('customerBrands')).toBe(1))
    expect(invalidationCount('customerPicker')).toBe(1)

    // Full-logo URL save.
    const urlSection = screen.getByText('Full logo URL').parentElement!
    fireEvent.change(within(urlSection).getByPlaceholderText('https://...'), { target: { value: 'https://cdn.example/logo.png' } })
    fireEvent.click(within(urlSection).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.setRetailerLogo).toHaveBeenCalledWith('c-target', 'https://cdn.example/logo.png'))
    await waitFor(() => expect(invalidationCount('customerBrands')).toBe(2))
    expect(invalidationCount('customerPicker')).toBe(2)

    // Full-logo upload.
    const file = new File([new Uint8Array([137, 80])], 'logo.png', { type: 'image/png' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    await waitFor(() => expect(api.uploadRetailerLogo).toHaveBeenCalledWith('c-target', expect.any(File)))
    await waitFor(() => expect(invalidationCount('customerBrands')).toBe(3))
    expect(invalidationCount('customerPicker')).toBe(3)
  })
})
