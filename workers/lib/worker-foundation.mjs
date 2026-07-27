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
    graphCursorStore: {
      load: async () => null,
      save: async () => {},
    },
    ...overrides,
  }
}
