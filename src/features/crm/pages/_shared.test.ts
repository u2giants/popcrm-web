import { describe, expect, it } from 'vitest'
import {
  buildRetailerById,
  customerPickerOptions,
  isSelectableCustomer,
  withCurrentCustomer,
} from './_shared'
import type { Retailer } from '@/lib/types'

const active: Retailer = {
  id: 'a1',
  name: 'Active Co',
  display_name: 'Active',
  status: 'active',
  domain: null,
  customer_status: 'ACTIVE_CUSTOMER',
  chain_type: null,
  routing_aliases: null,
}

const inactive: Retailer = {
  id: 'i1',
  name: 'Inactive Co',
  display_name: 'Inactive',
  status: 'inactive',
  domain: null,
  customer_status: 'ACTIVE_CUSTOMER',
  chain_type: null,
  routing_aliases: null,
}

describe('CRM customer picker helpers', () => {
  it('isSelectableCustomer only allows active/potential hub status', () => {
    expect(isSelectableCustomer('active')).toBe(true)
    expect(isSelectableCustomer('potential')).toBe(true)
    expect(isSelectableCustomer('inactive')).toBe(false)
    expect(isSelectableCustomer('ACTIVE_CUSTOMER')).toBe(false)
  })

  it('customerPickerOptions hides inactive unless currently assigned', () => {
    const without = customerPickerOptions([active, inactive])
    expect(without.map((o) => o.value)).toEqual(['a1'])

    const withCurrent = customerPickerOptions([active], 'i1', undefined, inactive)
    expect(withCurrent.map((o) => o.value).sort()).toEqual(['a1', 'i1'])
    expect(withCurrent.find((o) => o.value === 'i1')?.label).toBe('Inactive')
  })

  it('withCurrentCustomer preserves historical inactive labels', () => {
    const map = buildRetailerById([active], [inactive])
    const opts = withCurrentCustomer(
      [{ value: '', label: 'Unassigned' }, { value: 'a1', label: 'Active' }],
      'i1',
      map,
    )
    expect(opts.some((o) => o.value === 'i1' && o.label === 'Inactive')).toBe(true)
  })
})
