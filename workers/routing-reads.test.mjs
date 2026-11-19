import { describe, expect, it } from 'vitest'
import { initializeRuntime, matchOpportunity, routeEmail } from './crm-worker-supabase.mjs'
import { createFakeSupabase } from './lib/fake-supabase.mjs'

// #66: routing must consider every open program and every classified customer
// domain, however many rows sit behind the server's row ceiling. The PostgREST
// server caps any single response, so both reads page with the keyset
// fetchAllRows helper; each test puts the decisive row past the old fixed
// limits (1000 programs / 10000 domains) and proves it is still considered.

const BASE_ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
}

describe('open-program read for routing (#66)', () => {
  it('considers all 2,500 open programs when no customer is known', async () => {
    const programs = Array.from({ length: 2500 }, (_, index) => ({
      id: `opp-${String(index).padStart(4, '0')}`,
      name: `Program ${index}`,
      company_id: null,
      department_id: null,
      sales_order_number: null,
      production_po_number: null,
      stage: 'OPEN',
    }))
    programs[2400].sales_order_number = '998877'
    const fake = createFakeSupabase({ tables: { 'crm.opportunity': programs } })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })

    const result = await matchOpportunity({ retailer: null, department: null, searchText: 'Re: spring order SO-998877 update' })

    // Row 2400 sits far past the old .limit(1000) subset; matching it proves
    // the whole set was read.
    expect(result).toMatchObject({ method: 'SALES_ORDER_NUMBER', row: { id: 'opp-2400' } })
    // The read walked keyset pages (2,500 rows / 500 per page), not one call.
    const reads = fake.calls.filter((call) => call.table === 'opportunity' && call.op === 'select')
    expect(reads.length).toBeGreaterThanOrEqual(5)
  })
})

describe('classified-domain read for routing (#66)', () => {
  it('treats mail from a domain classified past 10,000 rows as customer mail', async () => {
    const domains = Array.from({ length: 10500 }, (_, index) => ({
      id: `dom-${String(index).padStart(5, '0')}`,
      domain: `customer-${String(index).padStart(5, '0')}.example`,
      status: 'ACTIVE_CUSTOMER',
    }))
    const fake = createFakeSupabase({ tables: { 'crm.ingested_domain': domains } })
    initializeRuntime(BASE_ENV, { supabaseClient: fake })

    const route = await routeEmail({
      subject: 'Spring line review',
      bodyText: '',
      addresses: ['buyer@customer-10499.example'],
    })

    // The classifying domain is row 10,499, past the old .limit(10000) subset:
    // the message must not be skipped as having no customer domain.
    expect(route).toMatchObject({ routing_status: 'UNROUTED' })
    expect(route.routing_method).not.toBe('NO_CUSTOMER_DOMAIN')
    const reads = fake.calls.filter((call) => call.table === 'ingested_domain' && call.op === 'select')
    expect(reads.length).toBeGreaterThanOrEqual(21)
  })
})
