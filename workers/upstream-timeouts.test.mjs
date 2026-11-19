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

  it('waits the requested Retry-After seconds on a 429 before retrying', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '5' } }))
      .mockResolvedValueOnce(new Response('{}'))
    const pending = fetchWithPolicy(fetchImpl, 'https://example.test', {}, options)
    let settled = false
    void pending.then(() => { settled = true }, () => { settled = true })
    // One millisecond short of the requested 5 seconds: still waiting.
    await vi.advanceTimersByTimeAsync(4_999)
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    const response = await pending
    expect(response.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('caps a Retry-After wait at 60 seconds', async () => {
    const wait = vi.fn(async () => {})
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 503, headers: { 'Retry-After': '120' } }))
      .mockResolvedValueOnce(new Response('{}'))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait })
    expect(response.status).toBe(200)
    expect(wait).toHaveBeenCalledTimes(1)
    expect(wait).toHaveBeenCalledWith(60_000)
  })

  it('honours an HTTP-date Retry-After', async () => {
    const wait = vi.fn(async () => {})
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': new Date(1_005_000).toUTCString() } }))
      .mockResolvedValueOnce(new Response('{}'))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait, now: () => 1_000_000 })
    expect(response.status).toBe(200)
    expect(wait).toHaveBeenCalledWith(5_000)
  })

  it('ignores Retry-After on statuses outside 429/503 and uses the backoff', async () => {
    const wait = vi.fn(async () => {})
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 502, headers: { 'Retry-After': '5' } }))
      .mockResolvedValueOnce(new Response('{}'))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait })
    expect(response.status).toBe(200)
    expect(wait).toHaveBeenCalledWith(10)
  })

  it('stops retrying when the next Retry-After wait would exceed the run budget', async () => {
    const wait = vi.fn(async () => {})
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '5' } }))
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '5' } }))
    await expect(fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, wait, retryWaitBudgetMs: 6_000 }))
      .rejects.toMatchObject({ name: 'UpstreamRequestError', attempts: 2, status: 429 })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(wait).toHaveBeenCalledTimes(1)
  })

  it('aborts a stalled body read at the deadline', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn((_url, init) => Promise.resolve({
      status: 200,
      ok: true,
      json: () => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })
      }),
    }))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, retryTransient: false, maxAttempts: 1 })
    const pending = response.json()
    const rejection = expect(pending).rejects.toMatchObject({ name: 'TimeoutError' })
    await vi.advanceTimersByTimeAsync(100)
    await rejection
  })

  it('reads a healthy body through the deadline wrapper', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    const response = await fetchWithPolicy(fetchImpl, 'https://example.test', {}, { ...options, retryTransient: false, maxAttempts: 1 })
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})

describe('upstream configuration', () => {
  it('uses documented defaults', () => {
    expect(resolveUpstreamSettings({})).toEqual({
      GRAPH_FETCH_TIMEOUT_MS: 30_000,
      OPENROUTER_FETCH_TIMEOUT_MS: 60_000,
      FIREFLIES_FETCH_TIMEOUT_MS: 30_000,
      SCALEDOWN_FETCH_TIMEOUT_MS: 30_000,
      UPSTREAM_MAX_ATTEMPTS: 3,
      UPSTREAM_RETRY_BASE_DELAY_MS: 250,
      UPSTREAM_RETRY_MAX_DELAY_MS: 2_000,
      UPSTREAM_RETRY_WAIT_BUDGET_MS: 120_000,
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
