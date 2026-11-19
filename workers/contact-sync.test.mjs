import { afterEach, describe, expect, it, vi } from 'vitest'
import { initializeRuntime, main, routeEmail } from './crm-worker-supabase.mjs'
import { createFakeSupabase } from './lib/fake-supabase.mjs'

// #69 step 1: contact sync checks for the company link, not just the contact;
// every route result sets routing_method explicitly (null when none); the
// mailbox variable is required for outlook-ingest (covered in
// worker-foundation.test.mjs). All behaviour runs against an injected
// in-memory fake client; no real environment is touched.

const BASE_ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('contact sync backfills missing company links (#69)', () => {
  const emailRow = {
    id: 'email-1',
    subject: 'Spring line review',
    sender: 'buyer@customer-a.example',
    recipients: '',
  }
  const customer = {
    id: 'customer-a',
    name: 'Customer A',
    domain: 'customer-a.example',
    routing_aliases: null,
    customer_status: 'ACTIVE_CUSTOMER',
  }

  it('creates the missing link for an existing contact on the next run', async () => {
    // The contact exists (an earlier run created it) but the link write never
    // landed, so the contact sat unlinked forever.
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [emailRow],
        'core.customer': [customer],
        'core.contact': [{ id: 'contact-1', full_name: 'Buyer', email: 'buyer@customer-a.example' }],
        'core.contact_company': [],
      },
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await main(['node', 'worker', 'contact-sync'], BASE_ENV, { supabaseClient: fake })
    } finally {
      logSpy.mockRestore()
    }
    const linkWrites = fake.calls.filter((call) => call.table === 'contact_company' && call.op === 'upsert')
    expect(linkWrites).toHaveLength(1)
    expect(linkWrites[0].payload).toMatchObject({
      contact_id: 'contact-1',
      company_id: 'customer-a',
      relationship_type: 'buyer',
      scope: 'COMPANY_WIDE',
    })
    // No duplicate contact was created for the existing address.
    expect(fake.calls.filter((call) => call.table === 'contact' && call.op === 'insert')).toHaveLength(0)
  })

  it('creates the contact and the link together on a first run', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [emailRow],
        'core.customer': [customer],
      },
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await main(['node', 'worker', 'contact-sync'], BASE_ENV, { supabaseClient: fake })
    } finally {
      logSpy.mockRestore()
    }
    const contactWrites = fake.calls.filter((call) => call.table === 'contact' && call.op === 'insert')
    expect(contactWrites).toHaveLength(1)
    expect(contactWrites[0].payload.email).toBe('buyer@customer-a.example')
    const linkWrites = fake.calls.filter((call) => call.table === 'contact_company' && call.op === 'upsert')
    expect(linkWrites).toHaveLength(1)
    expect(linkWrites[0].payload.company_id).toBe('customer-a')
    const links = fake.rows.get('core.contact_company')
    expect(links).toHaveLength(1)
    const [contact] = fake.rows.get('core.contact')
    expect(links[0].contact_id).toBe(contact.id)
  })

  it('does not rewrite a link that already exists', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [emailRow],
        'core.customer': [customer],
        'core.contact': [{ id: 'contact-1', full_name: 'Buyer', email: 'buyer@customer-a.example' }],
        'core.contact_company': [{ contact_id: 'contact-1', company_id: 'customer-a', relationship_type: 'buyer' }],
      },
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await main(['node', 'worker', 'contact-sync'], BASE_ENV, { supabaseClient: fake })
    } finally {
      logSpy.mockRestore()
    }
    expect(fake.calls.filter((call) => call.table === 'contact_company' && call.op === 'upsert')).toHaveLength(0)
  })
})

describe('route results always carry a routing method (#69)', () => {
  it('an unrouted recheck result carries routing_method: null, clearing a stale skip label', async () => {
    // A classified domain (so the message is customer mail, not skipped) that
    // matches no customer: routing lands on UNROUTED with no method.
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

  it('a reroute recheck writes the null method onto a previously skipped row', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [{
          id: 'email-1',
          subject: 'Spring line review',
          body_preview: '',
          sender: 'buyer@classified.example',
          recipients: '',
          routing_status: 'SKIPPED',
          routing_method: 'NO_CUSTOMER_DOMAIN',
          company_id: null,
        }],
        'crm.ingested_domain': [{ id: 'dom-1', domain: 'classified.example', status: 'ACTIVE_CUSTOMER' }],
      },
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await main(['node', 'worker', 'reroute'], BASE_ENV, { supabaseClient: fake })
    } finally {
      logSpy.mockRestore()
    }
    const [row] = fake.rows.get('crm.email_message')
    // The stale 'no customer domain' label is gone.
    expect(row.routing_status).toBe('UNROUTED')
    expect(row.routing_method).toBeNull()
  })
})
