import { describe, expect, it } from 'vitest'
import {
  buildRetailerById,
  contactTitleOptions,
  contactTitleValues,
  customerDomainSet,
  customerPickerOptions,
  domainOfAddress,
  effectiveCustomerStatus,
  emailsToSweepOnDepartmentAssign,
  isSelectableCustomer,
  withCurrentCustomer,
} from './_shared'
import { CONTACT_TITLES } from '@/features/crm/constants'
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

describe('effectiveCustomerStatus', () => {
  const base = { customer_status: null as string | null, status: null as string | null, is_potential: null as boolean | null }

  it('uses the CRM status when it is set', () => {
    expect(effectiveCustomerStatus({ ...base, customer_status: 'OTHER', status: 'active' })).toBe('OTHER')
  })

  it('never infers customer-ness from an active ERP account record', () => {
    // The 2026-07-15 ERP import marked vendors and licensors active too, so
    // hub-active alone must stay untriaged rather than claim to be a customer.
    expect(effectiveCustomerStatus({ ...base, status: 'active', is_potential: false })).toBe('UNASSIGNED')
  })

  it('reads a hub prospect as a potential customer', () => {
    expect(effectiveCustomerStatus({ ...base, status: 'potential', is_potential: true })).toBe('POTENTIAL_CUSTOMER')
  })

  it('leaves hub-inactive companies untriaged', () => {
    expect(effectiveCustomerStatus({ ...base, status: 'inactive', is_potential: false })).toBe('UNASSIGNED')
  })
})

describe('CRM contact title helpers', () => {
  it('offers the global titles to every contact, in curated order', () => {
    const opts = contactTitleOptions([null, '  '])
    expect(opts[0]).toEqual({ value: '', label: 'No title' })
    expect(opts.slice(1).map((o) => o.value)).toEqual([...CONTACT_TITLES])
  })

  it('keeps one-off contact titles after the global list', () => {
    expect(contactTitleValues(['Senior Buyer', 'SVP', 'Intern', null])).toEqual([
      ...CONTACT_TITLES,
      'Intern',
      'Senior Buyer',
    ])
  })

  it('does not repeat a global title already present on contacts', () => {
    expect(contactTitleValues(['GMM', 'gmm'])).toEqual([...CONTACT_TITLES, 'gmm'])
  })
})

describe('customer domain helpers', () => {
  const burlington: Retailer = {
    ...active,
    id: 'b1',
    name: 'Burlington',
    domain: 'Burlington.com',
    routing_aliases: 'burlingtonstores.com, burlington-inc.com',
  }

  it('customerDomainSet collects aliases and primary domains, lowercased', () => {
    const set = customerDomainSet([burlington, active])
    expect([...set].sort()).toEqual(['burlington-inc.com', 'burlington.com', 'burlingtonstores.com'])
  })

  it('domainOfAddress takes the part after the last @, ignoring case and blanks', () => {
    expect(domainOfAddress('Clare.Catanzaro@Burlington.com')).toBe('burlington.com')
    expect(domainOfAddress('no-domain')).toBe('')
    expect(domainOfAddress(null)).toBe('')
  })
})

describe('emailsToSweepOnDepartmentAssign', () => {
  const rel = (id: string) => (id ? { id } : null)
  const email = (id: string, sender: string | null, retailerId: string, departmentId: string) => ({
    id,
    sender,
    retailer: rel(retailerId),
    department: rel(departmentId),
  })
  const emails = [
    email('e1', 'clare@burlington.com', 'b1', ''),       // the row being assigned
    email('e2', 'clare@burlington.com', 'b1', ''),       // swept: same sender+customer, no dept
    email('e3', 'Clare@Burlington.com', 'b1', ''),       // swept: sender case-insensitive
    email('e4', 'clare@burlington.com', 'b1', 'd9'),     // already has a department
    email('e5', 'clare@burlington.com', 'other', ''),    // different customer
    email('e6', 'other@burlington.com', 'b1', ''),       // different sender
    email('e7', null, 'b1', ''),                          // no sender
  ]

  it('sweeps only same-sender same-customer rows still missing a department', () => {
    expect(emailsToSweepOnDepartmentAssign(emails, emails[0], (v) => (v as { id: string } | null)?.id ?? '').map((e) => e.id))
      .toEqual(['e2', 'e3'])
  })

  it('sweeps nothing without a sender or customer to key on', () => {
    const idOf = (v: unknown) => (v as { id: string } | null)?.id ?? ''
    expect(emailsToSweepOnDepartmentAssign(emails, emails[6], idOf)).toEqual([])
    expect(emailsToSweepOnDepartmentAssign(emails, email('x', 'clare@burlington.com', '', ''), idOf)).toEqual([])
  })
})
