import { timingSafeEqual } from 'node:crypto'

const STATUS_PRIORITY = {
  UNROUTED: 0,
  CUSTOMER_EMAIL_NO_COMPANY: 0,
  COMPANY_ONLY: 1,
  COMPANY_DEPT: 2,
  ROUTED: 3,
  SKIPPED: -1,
}

export function domainOf(address) {
  return String(address || '').split('@')[1]?.toLowerCase() || ''
}

export function domainCandidates(domain) {
  const parts = String(domain || '').toLowerCase().split('.').filter(Boolean)
  if (parts.length <= 2) return parts.length ? [parts.join('.')] : []
  return [parts.join('.'), parts.slice(-2).join('.')]
}

export function normalizeSubject(subject) {
  let normalized = subject || ''
  let previous
  do {
    previous = normalized
    normalized = normalized.replace(/^(回复:|回覆:|RE:|FW:|Fwd:)\s*/i, '').trim()
  } while (normalized !== previous)
  return normalized
}

export function extractAddresses(text) {
  const matches = String(text || '').match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
  return [...new Set(matches)].map((address) => address.toLowerCase())
}

export function routingImproves(currentStatus, next, currentRetailer) {
  const currentPriority = STATUS_PRIORITY[currentStatus] ?? 0
  const nextPriority = STATUS_PRIORITY[next.routing_status] ?? 0
  if (nextPriority > currentPriority) return true
  return nextPriority === currentPriority &&
    nextPriority > 0 &&
    Boolean(next.retailer) &&
    next.retailer !== currentRetailer
}

export async function isValidFirefliesSignature(rawBody, signature, secret) {
  if (typeof secret !== 'string' || !secret.trim()) return false
  if (typeof signature !== 'string' || !signature.trim()) return false
  const match = signature.trim().match(/^(?:sha256=)?([0-9a-f]{64})$/i)
  if (!match) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const bytes = Buffer.isBuffer(rawBody)
    ? rawBody
    : new TextEncoder().encode(String(rawBody ?? ''))
  const buffer = await crypto.subtle.sign('HMAC', key, bytes)
  const expected = Buffer.from(buffer)
  const received = Buffer.from(match[1], 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export function normalizeFirefliesWebhookPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'invalid_payload' }
  }

  const isV2 = typeof payload.event === 'string'
  if (isV2) {
    const event = typeof payload.event === 'string' ? payload.event.trim() : ''
    const meetingId = typeof payload.meeting_id === 'string' ? payload.meeting_id.trim() : ''
    if (!event || !meetingId) return { error: 'invalid_payload' }
    if (event !== 'meeting.transcribed') {
      return { skipped: 'unsupported_event', event, version: 'v2' }
    }
    return { meetingId, event, version: 'v2' }
  }

  const meetingId = typeof payload.meetingId === 'string'
    ? payload.meetingId.trim()
    : (typeof payload.meeting_id === 'string'
        ? payload.meeting_id.trim()
        : (typeof payload.transcript?.id === 'string' ? payload.transcript.id.trim() : ''))
  if (!meetingId) return { error: 'invalid_payload' }
  return {
    meetingId,
    transcript: payload.transcript?.id ? payload.transcript : undefined,
    event: typeof payload.eventType === 'string' ? payload.eventType.trim() : undefined,
    version: 'v1',
  }
}

const BASE_REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const COMMAND_REQUIRED_ENV = {
  'fireflies-server': ['FIREFLIES_WEBHOOK_SECRET', 'FIREFLIES_API_KEY', 'OPENROUTER_API_KEY'],
}

const BODY_LIMIT_DEFAULTS = {
  OPPORTUNITY_CHAT_MAX_BODY_BYTES: 65_536,
  FIREFLIES_MAX_BODY_BYTES: 1_048_576,
}

const UPSTREAM_DEFAULTS = {
  GRAPH_FETCH_TIMEOUT_MS: 30_000,
  OPENROUTER_FETCH_TIMEOUT_MS: 60_000,
  FIREFLIES_FETCH_TIMEOUT_MS: 30_000,
  UPSTREAM_MAX_ATTEMPTS: 3,
  UPSTREAM_RETRY_BASE_DELAY_MS: 250,
  UPSTREAM_RETRY_MAX_DELAY_MS: 2_000,
}

export function parsePositiveIntegerSetting(name, value, defaultValue) {
  if (value === undefined || value === '') return defaultValue
  if (!/^[1-9]\d*$/.test(String(value))) {
    throw new Error(`${name} must be a positive integer`)
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) throw new Error(`${name} must be a positive integer`)
  return parsed
}

export function resolveHttpBodyLimits(env = process.env) {
  return {
    opportunityChat: parsePositiveIntegerSetting(
      'OPPORTUNITY_CHAT_MAX_BODY_BYTES',
      env.OPPORTUNITY_CHAT_MAX_BODY_BYTES,
      BODY_LIMIT_DEFAULTS.OPPORTUNITY_CHAT_MAX_BODY_BYTES,
    ),
    fireflies: parsePositiveIntegerSetting(
      'FIREFLIES_MAX_BODY_BYTES',
      env.FIREFLIES_MAX_BODY_BYTES,
      BODY_LIMIT_DEFAULTS.FIREFLIES_MAX_BODY_BYTES,
    ),
  }
}

export function resolveUpstreamSettings(env = process.env) {
  const settings = {}
  for (const [name, defaultValue] of Object.entries(UPSTREAM_DEFAULTS)) {
    settings[name] = parsePositiveIntegerSetting(name, env[name], defaultValue)
  }
  if (settings.UPSTREAM_RETRY_MAX_DELAY_MS < settings.UPSTREAM_RETRY_BASE_DELAY_MS) {
    throw new Error('UPSTREAM_RETRY_MAX_DELAY_MS must be greater than or equal to UPSTREAM_RETRY_BASE_DELAY_MS')
  }
  return settings
}

export function validateCommandEnvironment(command, env = process.env) {
  const required = [...BASE_REQUIRED_ENV, ...(COMMAND_REQUIRED_ENV[command] || [])]
  const missing = required.filter((name) => typeof env[name] !== 'string' || !env[name].trim())
  if (missing.length) throw new Error(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required`)
  resolveUpstreamSettings(env)
  if (command === 'fireflies-server') resolveHttpBodyLimits(env)
}

const TRANSIENT_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504])
const TRANSIENT_NETWORK_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_SOCKET'])

export class UpstreamRequestError extends Error {
  constructor(operation, attempts, status, cause) {
    super(`${operation} failed after ${attempts} attempt${attempts === 1 ? '' : 's'}${status ? ` (HTTP ${status})` : ''}`)
    this.name = 'UpstreamRequestError'
    this.operation = operation
    this.attempts = attempts
    this.status = status
    this.cause = cause
  }
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

export async function fetchWithPolicy(fetchImpl, url, init = {}, options = {}) {
  const {
    operation,
    timeoutMs,
    maxAttempts = 1,
    retryTransient = false,
    baseDelayMs = 250,
    maxDelayMs = 2_000,
    random = Math.random,
    wait = sleep,
  } = options
  if (typeof fetchImpl !== 'function') throw new Error('fetchImpl must be a function')
  if (typeof operation !== 'string' || !operation.trim()) throw new Error('operation is required')
  for (const [name, value] of Object.entries({ timeoutMs, maxAttempts, baseDelayMs, maxDelayMs })) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`)
  }

  let lastStatus
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    let timedOut = false
    const onCallerAbort = () => controller.abort(init.signal?.reason)
    if (init.signal?.aborted) onCallerAbort()
    else init.signal?.addEventListener?.('abort', onCallerAbort, { once: true })
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort(new DOMException(`${operation} timed out`, 'TimeoutError'))
    }, timeoutMs)
    try {
      const response = await fetchImpl(url, { ...init, signal: controller.signal })
      lastStatus = response.status
      if (!retryTransient || !TRANSIENT_HTTP_STATUSES.has(response.status)) {
        return response
      }
      if (attempt === maxAttempts) {
        await response.body?.cancel?.().catch?.(() => {})
        throw new UpstreamRequestError(operation, attempt, response.status)
      }
      await response.body?.cancel?.().catch?.(() => {})
    } catch (error) {
      if (error instanceof UpstreamRequestError) throw error
      lastError = error
      const transientNetworkError = timedOut || error?.name === 'TimeoutError' || error?.name === 'AbortError' || error instanceof TypeError || TRANSIENT_NETWORK_CODES.has(error?.code)
      if (init.signal?.aborted || !retryTransient || !transientNetworkError || attempt === maxAttempts) {
        throw new UpstreamRequestError(operation, attempt, undefined, error)
      }
    } finally {
      clearTimeout(timeout)
      init.signal?.removeEventListener?.('abort', onCallerAbort)
    }

    const exponential = Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1)))
    const jittered = Math.max(1, Math.round(exponential * (0.5 + random() * 0.5)))
    await wait(jittered)
  }
  throw new UpstreamRequestError(operation, maxAttempts, lastStatus, lastError)
}

export class HttpBodyError extends Error {
  constructor(status, code) {
    super(code)
    this.name = 'HttpBodyError'
    this.status = status
    this.code = code
  }
}

export function readJsonBody(request, { maxBytes, beforeParse } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('maxBytes must be a positive integer')
  }

  return new Promise((resolve, reject) => {
    const chunks = []
    let bytes = 0
    let settled = false

    const cleanup = () => {
      request.removeListener('data', onData)
      request.removeListener('end', onEnd)
      request.removeListener('aborted', onAborted)
      request.removeListener('error', onError)
    }
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      cleanup()
      fn(value)
    }
    const fail = (status, code) => {
      if (settled) return
      request.pause?.()
      // IncomingMessage can emit a late transport error after an abort or
      // early 413 response. Keep one inert listener so that event cannot
      // become an uncaught exception after the active reader is cleaned up.
      request.once('error', () => {})
      finish(reject, new HttpBodyError(status, code))
    }
    const onData = (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      bytes += buffer.length
      if (bytes > maxBytes) {
        fail(413, 'payload_too_large')
        return
      }
      chunks.push(buffer)
    }
    const onEnd = async () => {
      const rawBody = Buffer.concat(chunks, bytes)
      try {
        await beforeParse?.(rawBody)
      } catch (error) {
        finish(reject, error)
        return
      }
      let body
      try {
        body = JSON.parse(rawBody.length ? rawBody.toString('utf8') : '{}')
      } catch {
        fail(400, 'invalid_json')
        return
      }
      finish(resolve, { rawBody, body })
    }
    const onAborted = () => fail(400, 'request_aborted')
    const onError = () => fail(400, 'request_error')

    request.on('data', onData)
    request.once('end', onEnd)
    request.once('aborted', onAborted)
    request.once('error', onError)
  })
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function authorizeCrmUser(token, { verifyToken, loadProfile }) {
  if (!token) return { status: 401, error: 'unauthorized' }
  const user = await verifyToken(token)
  if (!user?.id) return { status: 401, error: 'unauthorized' }

  const profile = await loadProfile(token)
  const roles = Array.isArray(profile?.roles) ? profile.roles : []
  const authorized = profile?.auth_user_id === user.id &&
    profile?.status === 'active' &&
    (profile?.crm_access === true || roles.includes('administrator'))

  if (!authorized) return { status: 403, error: 'forbidden', userId: user.id }
  return { status: 200, userId: user.id, profileId: profile.id }
}

export function parseOpportunityChatPayload(rawBody) {
  let payload
  try {
    payload = JSON.parse(rawBody || '{}')
  } catch {
    return { error: 'invalid_request' }
  }
  const opportunityId = typeof payload?.opportunityId === 'string' ? payload.opportunityId.trim() : ''
  const question = typeof payload?.question === 'string' ? payload.question.trim() : ''
  if (!UUID_PATTERN.test(opportunityId) || !question) return { error: 'invalid_request' }
  return { opportunityId, question }
}

export async function handleOpportunityChatRequest({
  authorization,
  rawBody,
  verifyToken,
  loadProfile,
  chat,
  logDenied = () => {},
}) {
  const token = String(authorization || '').startsWith('Bearer ')
    ? String(authorization).slice(7).trim()
    : ''
  const access = await authorizeCrmUser(token, { verifyToken, loadProfile })
  if (access.status !== 200) {
    logDenied({ status: access.status, userId: access.userId || null })
    return { status: access.status, body: { error: access.error } }
  }

  const payload = parseOpportunityChatPayload(rawBody)
  if (payload.error) return { status: 400, body: { error: payload.error } }

  const answer = await chat(payload.opportunityId, payload.question)
  return { status: 200, body: { answer } }
}

export function safeWorkerErrorDetails(error) {
  return {
    name: typeof error?.name === 'string' ? error.name : 'Error',
    code: typeof error?.code === 'string' ? error.code : undefined,
    status: Number.isInteger(error?.status) ? error.status : undefined,
  }
}

export function createUserScopedSupabaseClient({
  createClient,
  url,
  serviceRoleKey,
  token,
  realtimeTransport,
}) {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
    realtime: { transport: realtimeTransport },
  })
}

export async function respondToOpportunityChatRequest({
  response,
  headers,
  logError = console.error,
  ...request
}) {
  let result
  try {
    result = await handleOpportunityChatRequest(request)
  } catch (error) {
    logError('opportunity-chat request failed', safeWorkerErrorDetails(error))
    result = { status: 500, body: { error: 'internal_error' } }
  }
  response.writeHead(result.status, headers)
  response.end(JSON.stringify(result.body))
}

export function createWorkerBoundaries(overrides = {}) {
  return {
    fetch: globalThis.fetch,
    now: () => Date.now(),
    readJsonBody,
    validateSignature: isValidFirefliesSignature,
    verifyAccess: async (client, token) => {
      if (!token) return null
      const { data, error } = await client.auth.getUser(token)
      return error ? null : data?.user || null
    },
    resolveCrmProfile: async (client) => {
      const { data, error } = await client.schema('api').rpc('current_user_profile')
      if (error) throw new Error(`CRM access lookup failed: ${error.message}`)
      return data || null
    },
    graphCursorStore: {
      load: async () => null,
      save: async () => {},
    },
    ...overrides,
  }
}
