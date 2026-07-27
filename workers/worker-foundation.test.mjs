import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createWorkerBoundaries,
  domainCandidates,
  domainOf,
  extractAddresses,
  isValidFirefliesSignature,
  normalizeFirefliesWebhookPayload,
  normalizeSubject,
  routingImproves,
  validateCommandEnvironment,
} from './lib/worker-foundation.mjs'
import { main } from './crm-worker-supabase.mjs'

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
