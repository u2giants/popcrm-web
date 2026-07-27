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
  if (!secret) return true
  if (!signature) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const buffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected = [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return signature === `sha256=${expected}` || signature === expected
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
    readRequestBody: async (request) => {
      const chunks = []
      request.on('data', (chunk) => chunks.push(chunk))
      await new Promise((resolve, reject) => {
        request.on('end', resolve)
        request.on('error', reject)
      })
      return Buffer.concat(chunks).toString('utf8')
    },
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
