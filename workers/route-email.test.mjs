import { describe, expect, it } from 'vitest'
import { initializeRuntime, matchOpportunity, routeEmail } from './crm-worker-supabase.mjs'
import { createFakeSupabase } from './lib/fake-supabase.mjs'

// #71 step 3: characterisation tests for the two functions that decide
// routing. They pin today's decision table — domain match, thread-domain
// match, PO match, no match, skipped — so later changes to routing are
// deliberate. Everything runs against an injected in-memory fake client; no
// real environment is touched.

const BASE_ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
}

const CUSTOMER_A = {
  id: 'customer-a',
  name: 'Customer A',
  domain: 'customer-a.example',
  routing_aliases: null,
  customer_status: 'ACTIVE_CUSTOMER',
}
const CUSTOMER_B = {
  id: 'customer-b',
  name: 'Customer B',
  domain: 'customer-b.example',
  routing_aliases: null,
  customer_status: 'ACTIVE_CUSTOMER',
}

describe('routeEmail decision table', () => {
  it('routes by sender email domain to the owning customer', async () => {
    const fake = createFakeSupabase({ tables: { 'core.customer': [CUSTOMER_A] } })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const route = await routeEmail({
      subject: 'Spring line review',
      bodyText: '',
      addresses: ['buyer@customer-a.example'],
    })
    expect(route).toEqual({
      routing_status: 'COMPANY_ONLY',
      routing_method: 'EMAIL_DOMAIN',
      retailer: 'customer-a',
    })
  })

  it('routes by a customer domain quoted in the thread body', async () => {
    const fake = createFakeSupabase({ tables: { 'core.customer': [CUSTOMER_B] } })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const route = await routeEmail({
      subject: 'Fwd: Spring line review',
      bodyText: 'From: buyer@customer-b.example\n\nQuoted thread text follows.',
      addresses: ['someone@gmail.com'],
    })
    expect(route).toEqual({
      routing_status: 'COMPANY_ONLY',
      routing_method: 'THREAD_EMAIL_DOMAIN',
      retailer: 'customer-b',
    })
  })

  it('routes to the program whose PO number appears in the message', async () => {
    const fake = createFakeSupabase({
      tables: {
        'core.customer': [CUSTOMER_A],
        'crm.opportunity': [{
          id: 'opp-1',
          name: 'Spring line',
          stage: 'OPEN',
          company_id: 'customer-a',
          department_id: null,
          production_po_number: '123456',
          sales_order_number: null,
        }],
      },
    })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const route = await routeEmail({
      subject: 'Order confirmation',
      bodyText: 'Please find PO-123456 attached.',
      addresses: ['buyer@customer-a.example'],
    })
    expect(route).toEqual({
      routing_status: 'ROUTED',
      routing_method: 'PO_NUMBER',
      opportunity: 'opp-1',
      retailer: 'customer-a',
      department: null,
    })
  })

  it('leaves customer mail unmatched by anything as unrouted with no method', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.ingested_domain': [{ id: 'dom-1', domain: 'classified.example', status: 'ACTIVE_CUSTOMER' }],
      },
    })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const route = await routeEmail({
      subject: 'Spring line review',
      bodyText: '',
      addresses: ['buyer@classified.example'],
    })
    expect(route).toEqual({ routing_status: 'UNROUTED', routing_method: null })
  })

  it('skips mail whose subject matches a subject ignore rule', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.ignore_rule': [{ id: 'rule-1', pattern: 'newsletter', match_type: 'CONTAINS', rule_type: 'SUBJECT' }],
      },
    })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const route = await routeEmail({
      subject: 'RE: Monthly newsletter',
      bodyText: '',
      addresses: ['buyer@customer-a.example'],
    })
    expect(route).toEqual({ routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' })
  })

  it('skips mail with no customer domain at all as not customer-related', async () => {
    const fake = createFakeSupabase({})
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const route = await routeEmail({
      subject: 'Cold outreach',
      bodyText: '',
      addresses: ['stranger@unknown.example'],
    })
    expect(route).toEqual({ routing_status: 'SKIPPED', routing_method: 'NO_CUSTOMER_DOMAIN' })
  })
})

describe('matchOpportunity decision table', () => {
  it('returns null when nothing matches', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.opportunity': [{
          id: 'opp-1',
          name: 'Winter line',
          stage: 'OPEN',
          company_id: 'customer-a',
          department_id: null,
          sales_order_number: null,
          production_po_number: null,
        }],
      },
    })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const result = await matchOpportunity({ retailer: null, department: null, searchText: 'Completely unrelated note' })
    expect(result).toBeNull()
  })

  it('matches a sales order number among open programs', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.opportunity': [{
          id: 'opp-1',
          name: 'Spring line',
          stage: 'OPEN',
          company_id: 'customer-a',
          department_id: null,
          sales_order_number: '987654',
          production_po_number: null,
        }],
      },
    })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })
    const result = await matchOpportunity({ retailer: null, department: null, searchText: 'Shipping SO-987654 went out' })
    expect(result).toEqual({
      method: 'SALES_ORDER_NUMBER',
      row: { id: 'opp-1', retailer: 'customer-a', department: null },
    })
  })
})
