import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createWorkerBoundaries,
  domainCandidates,
  domainOf,
  extractAddresses,
  isValidFirefliesSignature,
  mayReroute,
  normalizeFirefliesWebhookPayload,
  normalizeSubject,
  routingImproves,
  validateCommandEnvironment,
} from './lib/worker-foundation.mjs'
import { buildRerouteWrite, main, runReroute } from './crm-worker-supabase.mjs'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('worker module startup', () => {
  it('imports without reading env files, creating clients, fetching, or dispatching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const previousEnvFile = process.env.POPPIM_ENV_FILE
    process.env.POPPIM_ENV_FILE = '/this/import-must-not-read.env'
    try {
      await import('./crm-worker-supabase.mjs')
    } finally {
      if (previousEnvFile === undefined) delete process.env.POPPIM_ENV_FILE
      else process.env.POPPIM_ENV_FILE = previousEnvFile
    }
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('worker pure helpers', () => {
  it('normalizes repeated localized reply and forward prefixes', () => {
    expect(normalizeSubject(' RE: Fwd: 回复:  Spring line review ')).toBe('Spring line review')
    expect(normalizeSubject(null)).toBe('')
  })

  it('preserves routing improvement priority and customer replacement behavior', () => {
    expect(routingImproves('UNROUTED', { routing_status: 'COMPANY_ONLY', retailer: 'a' }, null)).toBe(true)
    expect(routingImproves('COMPANY_DEPT', { routing_status: 'COMPANY_ONLY', retailer: 'a' }, 'b')).toBe(false)
    expect(routingImproves('COMPANY_ONLY', { routing_status: 'COMPANY_ONLY', retailer: 'b' }, 'a')).toBe(true)
    expect(routingImproves('ROUTED', { routing_status: 'ROUTED', retailer: 'a' }, 'a')).toBe(false)
  })

  it('never moves a manually assigned company, but may complete beneath it', () => {
    const manualRow = { routing_status: 'COMPANY_ONLY', routing_method: 'MANUAL', company_id: 'customer-a' }
    // Manual row + different company -> false, even as a status upgrade.
    expect(mayReroute(manualRow, { routing_status: 'COMPANY_ONLY', retailer: 'customer-b' })).toBe(false)
    expect(mayReroute(manualRow, { routing_status: 'COMPANY_DEPT', retailer: 'customer-b', department: 'department-1' })).toBe(false)
    expect(mayReroute(manualRow, { routing_status: 'ROUTED', retailer: 'customer-b', opportunity: 'opportunity-1' })).toBe(false)
    // The job may not strip a manually assigned company either.
    expect(mayReroute(manualRow, { routing_status: 'COMPANY_ONLY', retailer: null })).toBe(false)
    // Manual row + same company + department -> true.
    expect(mayReroute(manualRow, { routing_status: 'COMPANY_DEPT', retailer: 'customer-a', department: 'department-1' })).toBe(true)
    expect(mayReroute(manualRow, { routing_status: 'ROUTED', retailer: 'customer-a', opportunity: 'opportunity-1' })).toBe(true)
    // Same company with nothing new to add stays untouched.
    expect(mayReroute(manualRow, { routing_status: 'COMPANY_ONLY', retailer: 'customer-a' })).toBe(false)
    // A company a person manually cleared is not silently reassigned.
    const clearedRow = { routing_status: 'UNROUTED', routing_method: 'MANUAL', company_id: null }
    expect(mayReroute(clearedRow, { routing_status: 'COMPANY_ONLY', retailer: 'customer-b' })).toBe(false)
    // Automatic rows keep the replace-on-same-priority behavior.
    const automaticRow = { routing_status: 'COMPANY_ONLY', routing_method: 'EMAIL_DOMAIN', company_id: 'customer-a' }
    expect(mayReroute(automaticRow, { routing_status: 'COMPANY_ONLY', retailer: 'customer-b' })).toBe(true)
  })

  it('normalizes address and domain inputs', () => {
    expect(domainOf('Person@Sub.Example.COM')).toBe('sub.example.com')
    expect(domainCandidates('Sub.Example.COM')).toEqual(['sub.example.com', 'example.com'])
    expect(extractAddresses('One@Example.com, ONE@example.com; two+tag@Sub.Example.com')).toEqual([
      'one@example.com',
      'one@example.com',
      'two+tag@sub.example.com',
    ])
  })
})

// A PostgREST-shaped stand-in for the supabase-js query chain the reroute
// write builds: records the chain and resolves like a real await would.
function fakeEmailTable(writeResult) {
  const recorded = { patch: null, filters: [], selected: null }
  const chain = {
    eq(column, value) { recorded.filters.push(['eq', column, value]); return chain },
    is(column, value) { recorded.filters.push(['is', column, value]); return chain },
    select(columns) { recorded.selected = columns; return chain },
    then(onFulfilled, onRejected) {
      return Promise.resolve({ data: writeResult, error: null }).then(onFulfilled, onRejected)
    },
  }
  return {
    recorded,
    update(patch) { recorded.patch = patch; return chain },
  }
}

// The same unwrap the worker's reroute wiring applies to the write result.
async function updateRowThrough(table, row, patch) {
  const { data, error } = await buildRerouteWrite(table.update(patch), row)
  if (error) throw new Error(error.message)
  return data.length
}

describe('reroute compare-and-set writes', () => {
  const staleRow = {
    id: 'email-1',
    subject: 'Spring line review',
    body_preview: '',
    sender: 'buyer@customer-a.example',
    recipients: '',
    routing_status: 'COMPANY_ONLY',
    routing_method: 'EMAIL_DOMAIN',
    company_id: 'customer-a',
  }
  const improvingRoute = {
    routing_status: 'COMPANY_DEPT',
    routing_method: 'EMAIL_DOMAIN',
    retailer: 'customer-a',
    department: 'department-1',
  }

  it('does not overwrite a row changed between read and write, and counts it separately', async () => {
    // The compare-and-set matched nothing: someone edited the row mid-run.
    const table = fakeEmailTable([])
    const logs = []
    const result = await runReroute({
      fetchRows: () => [staleRow],
      routeMessage: () => improvingRoute,
      updateRow: (row) => updateRowThrough(table, row, { routing_status: improvingRoute.routing_status }),
      log: (line) => logs.push(line),
    })
    expect(result).toEqual({ evaluated: 1, updated: 0, changedUnderneath: 1 })
    expect(table.recorded.patch).toEqual({ routing_status: 'COMPANY_DEPT' })
    // The write is gated on what was read, not just the row id.
    expect(table.recorded.filters).toEqual([
      ['eq', 'id', 'email-1'],
      ['eq', 'routing_status', 'COMPANY_ONLY'],
      ['eq', 'company_id', 'customer-a'],
    ])
    expect(table.recorded.selected).toBe('id')
    expect(logs.at(-1)).toBe('reroute: 1 messages evaluated, 0 improved, 1 changed underneath')
  })

  it('counts a matched write as improved', async () => {
    const table = fakeEmailTable([{ id: 'email-1' }])
    const logs = []
    const result = await runReroute({
      fetchRows: () => [staleRow],
      routeMessage: () => improvingRoute,
      updateRow: (row) => updateRowThrough(table, row, { routing_status: improvingRoute.routing_status }),
      log: (line) => logs.push(line),
    })
    expect(result).toEqual({ evaluated: 1, updated: 1, changedUnderneath: 0 })
    expect(logs.at(-1)).toBe('reroute: 1 messages evaluated, 1 improved, 0 changed underneath')
  })

  it('gates a row without a company on company_id being null', async () => {
    const row = { ...staleRow, routing_status: 'UNROUTED', company_id: null }
    const table = fakeEmailTable([])
    await runReroute({
      fetchRows: () => [row],
      routeMessage: () => ({ routing_status: 'COMPANY_ONLY', routing_method: 'EMAIL_DOMAIN', retailer: 'customer-a' }),
      updateRow: (current) => updateRowThrough(table, current, {}),
      log: () => {},
    })
    expect(table.recorded.filters).toEqual([
      ['eq', 'id', 'email-1'],
      ['eq', 'routing_status', 'UNROUTED'],
      ['is', 'company_id', null],
    ])
  })

  it('never issues a write that would move a manual company choice', async () => {
    const updateRow = vi.fn()
    const result = await runReroute({
      fetchRows: () => [{ ...staleRow, routing_method: 'MANUAL' }],
      routeMessage: () => ({ routing_status: 'COMPANY_ONLY', routing_method: 'EMAIL_DOMAIN', retailer: 'customer-b' }),
      updateRow,
      log: () => {},
    })
    expect(updateRow).not.toHaveBeenCalled()
    expect(result).toEqual({ evaluated: 1, updated: 0, changedUnderneath: 0 })
  })

  it('warns and counts nothing when the write itself fails', async () => {
    const warnings = []
    const result = await runReroute({
      fetchRows: () => [staleRow],
      routeMessage: () => improvingRoute,
      updateRow: async () => { throw new Error('row violates a policy') },
      log: () => {},
      warn: (line) => warnings.push(line),
    })
    expect(result).toEqual({ evaluated: 1, updated: 0, changedUnderneath: 0 })
    expect(warnings).toEqual(['reroute skipped email-1: row violates a policy'])
  })
})

describe('Fireflies signature validation', () => {
  it('accepts the supported sha256-prefixed signature for the correct body', async () => {
    const body = '{"meetingId":"meeting-1"}'
    const secret = 'test-only-signing-secret'
    const digest = createHmac('sha256', secret).update(body).digest('hex')
    await expect(isValidFirefliesSignature(body, `sha256=${digest}`, secret)).resolves.toBe(true)
  })

  it('accepts the supported plain-hex signature for the correct body', async () => {
    const body = '{"meetingId":"meeting-1"}'
    const secret = 'test-only-signing-secret'
    const digest = createHmac('sha256', secret).update(body).digest('hex')
    await expect(isValidFirefliesSignature(body, digest, secret)).resolves.toBe(true)
  })

  it('rejects a signature for a modified body', async () => {
    const body = '{"meetingId":"meeting-1"}'
    const secret = 'test-only-signing-secret'
    const digest = createHmac('sha256', secret).update(body).digest('hex')
    await expect(isValidFirefliesSignature(`${body} `, digest, secret)).resolves.toBe(false)
  })

  it('rejects a signature generated with the wrong secret', async () => {
    const body = '{"meetingId":"meeting-1"}'
    const digest = createHmac('sha256', 'wrong-test-secret').update(body).digest('hex')
    await expect(isValidFirefliesSignature(body, digest, 'correct-test-secret')).resolves.toBe(false)
  })

  it('rejects a missing signature', async () => {
    await expect(isValidFirefliesSignature('{}', undefined, 'test-only-signing-secret')).resolves.toBe(false)
  })

  it.each([
    'wrong',
    'sha256=xyz',
    'sha1=0000000000000000000000000000000000000000000000000000000000000000',
    'sha256=000000000000000000000000000000000000000000000000000000000000000',
    '00000000000000000000000000000000000000000000000000000000000000000',
  ])('rejects malformed signature %s', async (signature) => {
    await expect(isValidFirefliesSignature('{}', signature, 'test-only-signing-secret')).resolves.toBe(false)
  })

  it.each([undefined, '', '   '])('fails closed when the secret is %s', async (secret) => {
    const digest = createHmac('sha256', 'any-secret').update('{}').digest('hex')
    await expect(isValidFirefliesSignature('{}', digest, secret)).resolves.toBe(false)
  })
})

describe('Fireflies webhook payload normalization', () => {
  it('normalizes a Webhooks V2 meeting.transcribed event', () => {
    expect(normalizeFirefliesWebhookPayload({
      event: 'meeting.transcribed',
      meeting_id: 'meeting-v2',
      timestamp: '2026-07-27T12:00:00Z',
    })).toEqual({
      meetingId: 'meeting-v2',
      event: 'meeting.transcribed',
      version: 'v2',
    })
  })

  it('acknowledges but does not ingest other V2 events', () => {
    expect(normalizeFirefliesWebhookPayload({
      event: 'meeting.summarized',
      meeting_id: 'meeting-v2',
      timestamp: '2026-07-27T12:01:00Z',
    })).toEqual({
      skipped: 'unsupported_event',
      event: 'meeting.summarized',
      version: 'v2',
    })
  })

  it('preserves legacy V1 meetingId and eventType payloads', () => {
    expect(normalizeFirefliesWebhookPayload({
      meetingId: 'meeting-v1',
      eventType: 'Transcription completed',
    })).toEqual({
      meetingId: 'meeting-v1',
      event: 'Transcription completed',
      version: 'v1',
      transcript: undefined,
    })
  })

  it('preserves the previously accepted snake-case legacy meeting id', () => {
    expect(normalizeFirefliesWebhookPayload({
      meeting_id: 'meeting-v1-snake-case',
    })).toEqual({
      meetingId: 'meeting-v1-snake-case',
      event: undefined,
      version: 'v1',
      transcript: undefined,
    })
  })

  it('preserves an embedded legacy transcript so ingestion does not refetch it', () => {
    const transcript = { id: 'meeting-v1', title: 'Legacy meeting' }
    expect(normalizeFirefliesWebhookPayload({ transcript })).toEqual({
      meetingId: 'meeting-v1',
      event: undefined,
      version: 'v1',
      transcript,
    })
  })

  it.each([
    null,
    [],
    {},
    { event: 'meeting.transcribed' },
    { event: 'meeting.transcribed', meeting_id: '   ' },
  ])('rejects malformed payload %#', (payload) => {
    expect(normalizeFirefliesWebhookPayload(payload)).toEqual({ error: 'invalid_payload' })
  })
})

describe('Fireflies command configuration', () => {
  const completeEnv = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
    FIREFLIES_WEBHOOK_SECRET: 'test-only-webhook-secret',
    FIREFLIES_API_KEY: 'test-only-fireflies-key',
    OPENROUTER_API_KEY: 'test-only-openrouter-key',
  }

  it.each([undefined, '', '   '])('rejects a %s webhook secret before server startup', async (secret) => {
    const env = { ...completeEnv, FIREFLIES_WEBHOOK_SECRET: secret }
    expect(() => validateCommandEnvironment('fireflies-server', env)).toThrow('FIREFLIES_WEBHOOK_SECRET is required')
    await expect(main(['node', 'worker', 'fireflies-server'], env)).rejects.toThrow('FIREFLIES_WEBHOOK_SECRET is required')
  })

  it.each([
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FIREFLIES_API_KEY',
    'OPENROUTER_API_KEY',
  ])('requires %s for the enabled Fireflies server endpoints', (name) => {
    expect(() => validateCommandEnvironment('fireflies-server', { ...completeEnv, [name]: ' ' })).toThrow(`${name} is required`)
  })

  it('does not impose Fireflies-only configuration on other commands', () => {
    expect(() => validateCommandEnvironment('reroute', {
      SUPABASE_URL: completeEnv.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: completeEnv.SUPABASE_SERVICE_ROLE_KEY,
    })).not.toThrow()
  })
})

describe('injectable worker boundaries', () => {
  it('accepts explicit replacements without invoking real services', async () => {
    const mockFetch = vi.fn()
    const mockNow = vi.fn(() => 123)
    const mockLoadCursor = vi.fn(async () => 'cursor')
    const dependencies = createWorkerBoundaries({
      fetch: mockFetch,
      now: mockNow,
      graphCursorStore: { load: mockLoadCursor, save: vi.fn() },
    })
    expect(dependencies.fetch).toBe(mockFetch)
    expect(dependencies.now()).toBe(123)
    await expect(dependencies.graphCursorStore.load()).resolves.toBe('cursor')
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
