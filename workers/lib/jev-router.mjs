// Email routing fallback on TypeSafe Jev: one multiple-choice question over
// active/potential retailers, accepted only above a calibrated confidence.

export const JEV_URL = 'https://api.typesafe.ai/v1/systemone'
export const JEV_MODEL = 'jev-latest'
export const JEV_DEFAULT_MIN_CONFIDENCE = 0.91
export const JEV_STATE_MAX_CHARS = 3000
export const JEV_NONE_OPTION = 'None of these retailers'

export function resolveJevMinConfidence(value) {
  if (value === undefined || value === '') return JEV_DEFAULT_MIN_CONFIDENCE
  if (!/^(0(\.\d+)?|1(\.0+)?)$/.test(String(value))) {
    throw new Error('JEV_ROUTING_MIN_CONFIDENCE must be a number from 0 through 1')
  }
  return Number(value)
}

// Jev sees option keys, so options are keyed by readable retailer names
// (disambiguated by domain when two retailers share a name) and mapped back.
export function retailerOptions(retailers) {
  const counts = new Map()
  for (const r of retailers) counts.set(r.name, (counts.get(r.name) || 0) + 1)
  const options = new Map()
  for (const r of retailers) {
    let key = counts.get(r.name) > 1 ? `${r.name} (${r.domain || r.id})` : r.name
    while (options.has(key) || key === JEV_NONE_OPTION) key = `${key} [${r.id}]`
    options.set(key, r)
  }
  return options
}

export function buildJevRoutingRequest({ subject, bodyText, addresses, options }) {
  const criteria = {}
  for (const [key, retailer] of options) {
    criteria[key] = retailer.domain ? `Retailer ${retailer.name}, email domain ${retailer.domain}` : `Retailer ${retailer.name}`
  }
  criteria[JEV_NONE_OPTION] = 'The email is not about or from any retailer listed here'
  const state = [
    `Subject: ${subject || ''}`,
    addresses?.length ? `Addresses: ${addresses.join(', ')}` : '',
    '',
    String(bodyText || ''),
  ].join('\n').slice(0, JEV_STATE_MAX_CHARS)
  return {
    state,
    model: JEV_MODEL,
    questions: {
      retailer: {
        type: 'choice',
        instructions: 'Which retailer customer is this business email about or from?',
        criteria,
      },
    },
  }
}

// Returns the chosen retailer id, or null when the answer is missing,
// not one of the offered retailers, or below the confidence cutoff.
export function pickJevRetailer(response, options, minConfidence) {
  const answer = response?.answers?.retailer
  if (!answer || answer.type !== 'choice') return null
  const confidence = Number(answer.confidence)
  if (!Number.isFinite(confidence) || confidence < minConfidence) return null
  return options.get(answer.choice)?.id || null
}
