import { describe, expect, it, vi } from 'vitest'
import {
  createUserScopedSupabaseClient,
  handleOpportunityChatRequest,
  respondToOpportunityChatRequest,
} from './lib/worker-foundation.mjs'

const opportunityId = '11111111-1111-4111-8111-111111111111'

describe('user-scoped Supabase client', () => {
  it('constructs under Node 20 with injected WebSocket transport and caller authorization', () => {
    const createClient = vi.fn(() => ({ client: true }))
    class TestWebSocket {}
    const client = createUserScopedSupabaseClient({
      createClient,
      url: 'https://example.supabase.co',
      serviceRoleKey: 'test-only-service-key',
      token: 'caller-jwt',
      realtimeTransport: TestWebSocket,
    })
    expect(client).toEqual({ client: true })
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'test-only-service-key',
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: 'Bearer caller-jwt' } },
        realtime: { transport: TestWebSocket },
      },
    )
  })
})

function request(overrides = {}) {
  return handleOpportunityChatRequest({
    authorization: 'Bearer valid-token',
    rawBody: JSON.stringify({ opportunityId, question: 'What happens next?' }),
    verifyToken: vi.fn(async () => ({ id: 'auth-user-1' })),
    loadProfile: vi.fn(async () => ({
      id: 'profile-1',
      auth_user_id: 'auth-user-1',
      status: 'active',
      roles: [],
      crm_access: true,
    })),
    chat: vi.fn(async () => 'Follow up tomorrow.'),
    logDenied: vi.fn(),
    ...overrides,
  })
}

describe('Opportunity Chat authorization', () => {
  it('opportunity chat rejects missing token', async () => {
    const verifyToken = vi.fn()
    const loadProfile = vi.fn()
    const chat = vi.fn()
    const result = await request({ authorization: '', verifyToken, loadProfile, chat })
    expect(result).toEqual({ status: 401, body: { error: 'unauthorized' } })
    expect(verifyToken).not.toHaveBeenCalled()
    expect(loadProfile).not.toHaveBeenCalled()
    expect(chat).not.toHaveBeenCalled()
  })

  it('opportunity chat rejects invalid token', async () => {
    const loadProfile = vi.fn()
    const chat = vi.fn()
    const result = await request({ verifyToken: vi.fn(async () => null), loadProfile, chat })
    expect(result).toEqual({ status: 401, body: { error: 'unauthorized' } })
    expect(loadProfile).not.toHaveBeenCalled()
    expect(chat).not.toHaveBeenCalled()
  })

  it('opportunity chat forbids valid user without crm access', async () => {
    const chat = vi.fn()
    const logDenied = vi.fn()
    const result = await request({
      loadProfile: vi.fn(async () => ({
        id: 'profile-1', auth_user_id: 'auth-user-1', status: 'active',
        roles: ['sales'], crm_access: false,
      })),
      chat,
      logDenied,
    })
    expect(result).toEqual({ status: 403, body: { error: 'forbidden' } })
    expect(chat).not.toHaveBeenCalled()
    expect(logDenied).toHaveBeenCalledWith({ status: 403, userId: 'auth-user-1' })
  })

  it('opportunity chat allows administrator', async () => {
    const chat = vi.fn(async () => 'Admin answer')
    const result = await request({
      loadProfile: vi.fn(async () => ({
        id: 'profile-admin', auth_user_id: 'auth-user-1', status: 'active',
        roles: ['administrator'], crm_access: false,
      })),
      chat,
    })
    expect(result).toEqual({ status: 200, body: { answer: 'Admin answer' } })
    expect(chat).toHaveBeenCalledWith(opportunityId, 'What happens next?')
  })

  it('opportunity chat allows active crm user', async () => {
    const chat = vi.fn(async () => 'CRM answer')
    const result = await request({ chat })
    expect(result).toEqual({ status: 200, body: { answer: 'CRM answer' } })
    expect(chat).toHaveBeenCalledOnce()
  })

  it('opportunity chat forbids revoked access', async () => {
    const chat = vi.fn()
    const result = await request({
      loadProfile: vi.fn(async () => ({
        id: 'profile-1', auth_user_id: 'auth-user-1', status: 'active',
        roles: [], crm_access: false,
      })),
      chat,
    })
    expect(result.status).toBe(403)
    expect(chat).not.toHaveBeenCalled()
  })

  it('opportunity chat forbids inactive profile', async () => {
    const chat = vi.fn()
    const result = await request({
      loadProfile: vi.fn(async () => ({
        id: 'profile-1', auth_user_id: 'auth-user-1', status: 'inactive',
        roles: [], crm_access: true,
      })),
      chat,
    })
    expect(result.status).toBe(403)
    expect(chat).not.toHaveBeenCalled()
  })

  it('denied chat never invokes service-role crm reads', async () => {
    const privilegedCrmRead = vi.fn()
    await request({ loadProfile: vi.fn(async () => null), chat: privilegedCrmRead })
    await request({ verifyToken: vi.fn(async () => null), chat: privilegedCrmRead })
    expect(privilegedCrmRead).not.toHaveBeenCalled()
  })

  it.each([
    ['invalid json', '{'],
    ['invalid opportunity id', JSON.stringify({ opportunityId: 'not-a-uuid', question: 'Question' })],
    ['missing question', JSON.stringify({ opportunityId, question: '  ' })],
  ])('returns a safe 400 for %s', async (_name, rawBody) => {
    const chat = vi.fn()
    const result = await request({ rawBody, chat })
    expect(result).toEqual({ status: 400, body: { error: 'invalid_request' } })
    expect(chat).not.toHaveBeenCalled()
  })

  it.each([
    ['profile lookup', { loadProfile: vi.fn(async () => { throw new Error('private schema detail') }) }],
    ['chat provider', { chat: vi.fn(async () => { throw new Error('private upstream response') }) }],
  ])('writes a generic 500 when %s fails', async (_name, overrides) => {
    const response = { writeHead: vi.fn(), end: vi.fn() }
    const logError = vi.fn()
    await respondToOpportunityChatRequest({
      response,
      headers: { 'Content-Type': 'application/json' },
      authorization: 'Bearer valid-token',
      rawBody: JSON.stringify({ opportunityId, question: 'What happens next?' }),
      verifyToken: vi.fn(async () => ({ id: 'auth-user-1' })),
      loadProfile: vi.fn(async () => ({
        id: 'profile-1', auth_user_id: 'auth-user-1', status: 'active',
        roles: [], crm_access: true,
      })),
      chat: vi.fn(async () => 'answer'),
      logError,
      ...overrides,
    })
    expect(response.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' })
    expect(response.end).toHaveBeenCalledWith(JSON.stringify({ error: 'internal_error' }))
    expect(response.end.mock.calls.flat().join(' ')).not.toContain('private')
    expect(logError).toHaveBeenCalledWith(
      'opportunity-chat request failed',
      { name: 'Error', code: undefined, status: undefined },
    )
  })
})
