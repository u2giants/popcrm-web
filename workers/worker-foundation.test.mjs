import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createWorkerBoundaries,
  domainCandidates,
  domainOf,
  extractAddresses,
  isValidFirefliesSignature,
  normalizeSubject,
  routingImproves,
} from './lib/worker-foundation.mjs'

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

describe('Fireflies signature characterization', () => {
  it('accepts matching prefixed and plain signatures with an explicit secret', async () => {
    const body = '{"meetingId":"meeting-1"}'
    const secret = 'test-only-signing-secret'
    const digest = createHmac('sha256', secret).update(body).digest('hex')
    await expect(isValidFirefliesSignature(body, `sha256=${digest}`, secret)).resolves.toBe(true)
    await expect(isValidFirefliesSignature(body, digest, secret)).resolves.toBe(true)
  })

  it('rejects a modified body, wrong signature, and missing signature when secret is explicit', async () => {
    const body = '{"meetingId":"meeting-1"}'
    const secret = 'test-only-signing-secret'
    const digest = createHmac('sha256', secret).update(body).digest('hex')
    await expect(isValidFirefliesSignature(`${body} `, digest, secret)).resolves.toBe(false)
    await expect(isValidFirefliesSignature(body, 'wrong', secret)).resolves.toBe(false)
    await expect(isValidFirefliesSignature(body, undefined, secret)).resolves.toBe(false)
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
