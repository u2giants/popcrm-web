import { createServer } from 'node:http'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWorkerHttpHandler } from './crm-worker-supabase.mjs'
import {
  readJsonBody,
  resolveHttpBodyLimits,
  validateCommandEnvironment,
} from './lib/worker-foundation.mjs'

const completeEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  FIREFLIES_API_KEY: 'test-fireflies-key',
  FIREFLIES_WEBHOOK_SECRET: 'test-webhook-secret',
  OPENROUTER_API_KEY: 'test-openrouter-key',
}

function streamBody(chunks) {
  return Readable.from(chunks.map((chunk) => Buffer.from(chunk)))
}

async function listen(handler) {
  const server = createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

afterEach(() => vi.restoreAllMocks())

describe('HTTP body limit configuration', () => {
  it('uses safe defaults', () => {
    expect(resolveHttpBodyLimits({})).toEqual({
      opportunityChat: 65_536,
      fireflies: 1_048_576,
    })
  })

  it('accepts positive integer overrides', () => {
    expect(resolveHttpBodyLimits({
      OPPORTUNITY_CHAT_MAX_BODY_BYTES: '123',
      FIREFLIES_MAX_BODY_BYTES: '456',
    })).toEqual({ opportunityChat: 123, fireflies: 456 })
  })

  it.each(['0', '-1', '1.5', ' 2', '2 ', 'word', '9007199254740992'])(
    'fails startup for invalid body limit %s',
    (value) => {
      const env = { ...completeEnv, OPPORTUNITY_CHAT_MAX_BODY_BYTES: value }
      expect(() => validateCommandEnvironment('fireflies-server', env))
        .toThrow('OPPORTUNITY_CHAT_MAX_BODY_BYTES must be a positive integer')
    },
  )
})

describe('readJsonBody', () => {
  it('accepts a body exactly at the raw-byte limit', async () => {
    const raw = Buffer.from('{"é":1}')
    await expect(readJsonBody(streamBody([raw]), { maxBytes: raw.length })).resolves.toEqual({
      rawBody: raw,
      body: { é: 1 },
    })
  })

  it('rejects one raw byte over the limit', async () => {
    await expect(readJsonBody(streamBody(['{"a":1}']), { maxBytes: 6 }))
      .rejects.toMatchObject({ status: 413, code: 'payload_too_large' })
  })

  it('rejects a chunked body as soon as its cumulative bytes exceed the limit', async () => {
    const request = new EventEmitter()
    request.pause = vi.fn()
    const promise = readJsonBody(request, { maxBytes: 5 })
    request.emit('data', Buffer.from('123'))
    request.emit('data', Buffer.from('456'))
    request.emit('data', Buffer.alloc(1_000_000))
    await expect(promise).rejects.toMatchObject({ status: 413, code: 'payload_too_large' })
    expect(request.pause).toHaveBeenCalledOnce()
    expect(request.listenerCount('data')).toBe(0)
  })

  it('rejects invalid JSON without including the body in the error', async () => {
    await expect(readJsonBody(streamBody(['private invalid body']), { maxBytes: 100 }))
      .rejects.toMatchObject({ status: 400, code: 'invalid_json', message: 'invalid_json' })
  })

  it.each([
    ['aborted', 'request_aborted'],
    ['error', 'request_error'],
  ])('settles once for an %s request', async (event, code) => {
    const request = new EventEmitter()
    request.pause = vi.fn()
    const promise = readJsonBody(request, { maxBytes: 100 })
    const assertion = expect(promise).rejects.toMatchObject({ status: 400, code })
    request.emit(event, new Error('private transport detail'))
    await assertion
    expect(request.listenerCount('aborted')).toBe(0)
    expect(request.listenerCount('error')).toBe(1)
    expect(() => request.emit('error', new Error('late transport error'))).not.toThrow()
    expect(request.listenerCount('error')).toBe(0)
  })

  it('runs the raw-body callback before JSON parsing', async () => {
    const order = []
    const beforeParse = vi.fn(() => order.push('signature'))
    const result = await readJsonBody(streamBody(['{"ok":true}']), { maxBytes: 100, beforeParse })
    order.push(result.body.ok ? 'parsed' : 'unexpected')
    expect(order).toEqual(['signature', 'parsed'])
    expect(beforeParse.mock.calls[0][0]).toEqual(Buffer.from('{"ok":true}'))
  })
})

describe('public worker routes', () => {
  function dependencies(overrides = {}) {
    return {
      bodyLimits: { opportunityChat: 256, fireflies: 256 },
      validateSignature: vi.fn(async () => true),
      verifyToken: vi.fn(async () => ({ id: 'user-1' })),
      loadProfile: vi.fn(async () => ({
        id: 'profile-1',
        auth_user_id: 'user-1',
        status: 'active',
        crm_access: true,
        roles: [],
      })),
      chat: vi.fn(async () => 'answer'),
      processFireflies: vi.fn(async () => ({ success: true })),
      logWarn: vi.fn(),
      logError: vi.fn(),
      ...overrides,
    }
  }

  it.each([
    ['/s/opportunity-chat', 'chat'],
    ['/s/fireflies-webhook', 'processFireflies'],
  ])('returns 413 and never reaches protected work for %s', async (path, paidCall) => {
    const deps = dependencies({ bodyLimits: { opportunityChat: 8, fireflies: 8 } })
    const local = await listen(createWorkerHttpHandler(deps))
    try {
      const response = await fetch(`${local.url}${path}`, {
        method: 'POST',
        headers: { authorization: 'Bearer token', 'x-hub-signature': 'test' },
        body: '{"too":"large"}',
      })
      expect(response.status).toBe(413)
      await expect(response.json()).resolves.toEqual({ error: 'payload_too_large' })
      expect(deps[paidCall]).not.toHaveBeenCalled()
      expect(deps.validateSignature).not.toHaveBeenCalled()
      expect(deps.verifyToken).not.toHaveBeenCalled()
    } finally {
      await local.close()
    }
  })

  it.each([
    ['/s/opportunity-chat', 'chat'],
    ['/s/fireflies-webhook', 'processFireflies'],
  ])('returns 400 and never reaches protected work for invalid JSON on %s', async (path, paidCall) => {
    const deps = dependencies()
    const local = await listen(createWorkerHttpHandler(deps))
    try {
      const response = await fetch(`${local.url}${path}`, {
        method: 'POST',
        headers: { authorization: 'Bearer token', 'x-hub-signature': 'test' },
        body: 'not-json',
      })
      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: 'invalid_json' })
      expect(deps[paidCall]).not.toHaveBeenCalled()
      expect(deps.verifyToken).not.toHaveBeenCalled()
    } finally {
      await local.close()
    }
  })

  it('accepts a valid Opportunity Chat request exactly at its route limit', async () => {
    const body = JSON.stringify({
      opportunityId: '123e4567-e89b-42d3-a456-426614174000',
      question: 'Status?',
    })
    const deps = dependencies({ bodyLimits: { opportunityChat: Buffer.byteLength(body), fireflies: 256 } })
    const local = await listen(createWorkerHttpHandler(deps))
    try {
      const response = await fetch(`${local.url}/s/opportunity-chat`, {
        method: 'POST',
        headers: { authorization: 'Bearer token' },
        body,
      })
      expect(response.status).toBe(200)
      expect(deps.chat).toHaveBeenCalledOnce()
    } finally {
      await local.close()
    }
  })

  it('validates the exact raw Fireflies bytes before parsing and accepts the request', async () => {
    const body = '{"event":"meeting.transcribed","meeting_id":"meeting-1"}\n'
    const deps = dependencies({ bodyLimits: { opportunityChat: 256, fireflies: Buffer.byteLength(body) } })
    const local = await listen(createWorkerHttpHandler(deps))
    try {
      const response = await fetch(`${local.url}/s/fireflies-webhook`, {
        method: 'POST',
        headers: { 'x-hub-signature': 'test' },
        body,
      })
      expect(response.status).toBe(202)
      expect(deps.validateSignature).toHaveBeenCalledWith(Buffer.from(body), 'test')
      expect(deps.processFireflies).toHaveBeenCalledOnce()
    } finally {
      await local.close()
    }
  })
})
