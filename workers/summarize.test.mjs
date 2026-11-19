import { afterEach, describe, expect, it, vi } from 'vitest'
import { main } from './crm-worker-supabase.mjs'
import { createFakeSupabase } from './lib/fake-supabase.mjs'

// #65: each program's AI summary is regenerated only when its emails changed,
// and once per run — not once per improved email and not every run
// regardless. All behaviour is driven through main() against an injected
// in-memory fake client; no real environment is touched.

const BASE_ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
  OPENROUTER_API_KEY: 'test-only-openrouter-key',
}

function openRouterResponse() {
  return new Response(JSON.stringify({
    choices: [{ message: { content: '{"summary":"fresh","updatedAt":"2026-11-19T00:00:00Z"}' } }],
  }), { status: 200 })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('reroute summarises once per program per run (#65 step 1)', () => {
  it('40 improved messages for one program produce exactly one paid summary call', async () => {
    const emails = Array.from({ length: 40 }, (_, index) => ({
      id: `email-${String(index).padStart(2, '0')}`,
      subject: 'Update on our order',
      body_preview: 'Please find PO-123456 attached.',
      sender: 'buyer@customer-a.example',
      recipients: '',
      routing_status: 'UNROUTED',
      routing_method: null,
      company_id: null,
    }))
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': emails,
        'core.customer': [{
          id: 'customer-a',
          name: 'Customer A',
          domain: 'customer-a.example',
          routing_aliases: null,
          customer_status: 'ACTIVE_CUSTOMER',
        }],
        'crm.opportunity': [{
          id: 'opp-1',
          name: 'Spring line',
          stage: 'OPEN',
          company_id: 'customer-a',
          department_id: null,
          production_po_number: '123456',
          sales_order_number: null,
          project_id: null,
        }],
        'crm.ai_model_config': [{ id: 'cfg-1', opportunity_summary_model: 'GEMINI_2_FLASH' }],
      },
    })
    const fetchImpl = vi.fn(async () => openRouterResponse())
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await main(['node', 'worker', 'reroute'], BASE_ENV, { supabaseClient: fake, fetch: fetchImpl })
    } finally {
      logSpy.mockRestore()
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('summarize is incremental (#65 step 2)', () => {
  it('skips a program whose newest email predates its stored summary timestamp', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [
          { id: 'email-1', opportunity_id: 'opp-1', received_at: '2026-11-10T00:00:00Z' },
        ],
        'crm.opportunity': [{
          id: 'opp-1',
          ai_state: JSON.stringify({ summary: 'fresh', updatedAt: '2026-11-18T00:00:00Z' }),
          updated_at: '2026-11-18T00:00:00Z',
        }],
      },
    })
    const fetchImpl = vi.fn(async () => openRouterResponse())
    const logs = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((line) => logs.push(line))
    try {
      await main(['node', 'worker', 'summarize'], BASE_ENV, { supabaseClient: fake, fetch: fetchImpl })
    } finally {
      logSpy.mockRestore()
    }
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(logs.at(-1)).toBe('summarize: 0/0 opportunities refreshed')
  })

  it('skips a program with no emails at all', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [
          { id: 'email-1', opportunity_id: 'opp-with-email', received_at: '2026-11-19T00:00:00Z' },
        ],
        'crm.opportunity': [
          { id: 'opp-with-email', ai_state: null, updated_at: '2026-11-18T00:00:00Z' },
          { id: 'opp-without-email', ai_state: null, updated_at: '2026-11-01T00:00:00Z' },
        ],
        'crm.ai_model_config': [{ id: 'cfg-1', opportunity_summary_model: 'GEMINI_2_FLASH' }],
      },
    })
    const fetchImpl = vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body)
      expect(JSON.parse(body.messages[1].content).opportunity.id).toBe('opp-with-email')
      return openRouterResponse()
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await main(['node', 'worker', 'summarize'], BASE_ENV, { supabaseClient: fake, fetch: fetchImpl })
    } finally {
      logSpy.mockRestore()
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('refreshes due programs least-recently-updated first', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [
          { id: 'email-new', opportunity_id: 'opp-new', received_at: '2026-11-19T00:00:00Z' },
          { id: 'email-old', opportunity_id: 'opp-old', received_at: '2026-11-19T00:00:00Z' },
        ],
        'crm.opportunity': [
          { id: 'opp-new', ai_state: null, updated_at: '2026-11-18T00:00:00Z' },
          { id: 'opp-old', ai_state: null, updated_at: '2026-11-01T00:00:00Z' },
        ],
        'crm.ai_model_config': [{ id: 'cfg-1', opportunity_summary_model: 'GEMINI_2_FLASH' }],
      },
    })
    const summarized = []
    const fetchImpl = vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body)
      summarized.push(JSON.parse(body.messages[1].content).opportunity.id)
      return openRouterResponse()
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await main(['node', 'worker', 'summarize'], BASE_ENV, { supabaseClient: fake, fetch: fetchImpl })
    } finally {
      logSpy.mockRestore()
    }
    expect(summarized).toEqual(['opp-old', 'opp-new'])
  })

  it('refreshes a program whose newest email is newer than its stored summary timestamp', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.email_message': [{ id: 'email-1', opportunity_id: 'opp-1', received_at: '2026-11-19T00:00:00Z' }],
        'crm.opportunity': [{
          id: 'opp-1',
          ai_state: JSON.stringify({ summary: 'stale', updatedAt: '2026-11-10T00:00:00Z' }),
          updated_at: '2026-11-10T00:00:00Z',
        }],
        'crm.ai_model_config': [{ id: 'cfg-1', opportunity_summary_model: 'GEMINI_2_FLASH' }],
      },
    })
    const fetchImpl = vi.fn(async () => openRouterResponse())
    const logs = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((line) => logs.push(line))
    try {
      await main(['node', 'worker', 'summarize'], BASE_ENV, { supabaseClient: fake, fetch: fetchImpl })
    } finally {
      logSpy.mockRestore()
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(logs.at(-1)).toBe('summarize: 1/1 opportunities refreshed')
  })
})
