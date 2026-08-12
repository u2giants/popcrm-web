import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  UpstreamRequestError,
  fetchWithPolicy,
  resolveUpstreamSettings,
} from './lib/worker-foundation.mjs'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const options = {
  operation: 'test upstream',
  timeoutMs: 100,
  maxAttempts: 3,
  retryTransient: true,
  baseDelayMs: 10,
  maxDelayMs: 20,
  random: () => 1,
}

describe('upstream timeout and retry policy', () => {
  it('aborts the real request signal when the deadline expires', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })
    }))
    const pending = fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, retryTransient: false, maxAttempts: 1 })
    const rejection = expect(pending).rejects.toMatchObject({ name: 'UpstreamRequestError', attempts: 1 })
    await vi.advanceTimersByTimeAsync(100)
    await rejection
    expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('retries a Graph-style HTTP 429 and transient 5xx with capped delays', async () => {
    const wait = vi.fn(async () => {})
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait })
    expect(response.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(wait).toHaveBeenNthCalledWith(1, 10)
    expect(wait).toHaveBeenNthCalledWith(2, 20)
  })

  it('fails loudly after the transient retry cap without response content', async () => {
    const cancel = vi.fn(async () => {})
    const fetchImpl = vi.fn(async () => ({ status: 503, body: { cancel } }))
    const error = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait: async () => {} }).catch((caught) => caught)
    expect(error).toBeInstanceOf(UpstreamRequestError)
    expect(error).toMatchObject({ operation: 'test upstream', attempts: 3, status: 503 })
    expect(error.message).toBe('test upstream failed after 3 attempts (HTTP 503)')
    expect(error.message).not.toContain('private upstream body')
    expect(cancel).toHaveBeenCalledTimes(3)
  })

  it('does not retry an authentication failure', async () => {
    const fetchImpl = vi.fn(async () => new Response('secret details', { status: 401 }))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait: async () => {} })
    expect(response.status).toBe(401)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('retries a network reset and succeeds', async () => {
    const reset = Object.assign(new TypeError('fetch failed'), { code: 'ECONNRESET' })
    const fetchImpl = vi.fn().mockRejectedValueOnce(reset).mockResolvedValueOnce(new Response('{}'))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait: async () => {} })
    expect(response.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('does not retry an ordinary application error', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('bad test setup') })
    await expect(fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait: async () => {} }))
      .rejects.toMatchObject({ attempts: 1 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('upstream configuration', () => {
  it('uses documented defaults', () => {
    expect(resolveUpstreamSettings({})).toEqual({
      GRAPH_FETCH_TIMEOUT_MS: 30_000,
      OPENROUTER_FETCH_TIMEOUT_MS: 60_000,
      FIREFLIES_FETCH_TIMEOUT_MS: 30_000,
      UPSTREAM_MAX_ATTEMPTS: 3,
      UPSTREAM_RETRY_BASE_DELAY_MS: 250,
      UPSTREAM_RETRY_MAX_DELAY_MS: 2_000,
    })
  })

  it.each(['0', '-1', '1.5', ' 5', 'not-a-number'])('rejects invalid values: %s', (value) => {
    expect(() => resolveUpstreamSettings({ GRAPH_FETCH_TIMEOUT_MS: value })).toThrow('GRAPH_FETCH_TIMEOUT_MS must be a positive integer')
  })

  it('rejects a retry cap below the initial delay', () => {
    expect(() => resolveUpstreamSettings({ UPSTREAM_RETRY_BASE_DELAY_MS: '500', UPSTREAM_RETRY_MAX_DELAY_MS: '250' }))
      .toThrow('UPSTREAM_RETRY_MAX_DELAY_MS must be greater than or equal to UPSTREAM_RETRY_BASE_DELAY_MS')
  })
})
