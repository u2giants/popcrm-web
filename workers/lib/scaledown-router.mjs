// Email routing fallback on ScaleDown: one multiple-choice question over
// active/potential retailers, accepted only above a calibrated confidence.
//
// Uses the Decisions endpoint rather than POST /classify, which rejects more
// than 20 labels; the customer list is far longer. Cutoff evidence: issue #22.

export const SCALEDOWN_URL = 'https://api.scaledown.xyz/v1/scaledown'
export const SCALEDOWN_MODEL = 'classify-1'
export const SCALEDOWN_DEFAULT_MIN_CONFIDENCE = 0.93
export const NONE_OPTION = 'None of these retailers'

export function resolveScaledownMinConfidence(value) {
  if (value === undefined || value === '') return SCALEDOWN_DEFAULT_MIN_CONFIDENCE
  if (!/^(0(\.\d+)?|1(\.0+)?)$/.test(String(value))) {
    throw new Error('SCALEDOWN_ROUTING_MIN_CONFIDENCE must be a number from 0 through 1')
  }
  return Number(value)
}

// ScaleDown sees option keys, so options are keyed by readable retailer names
// (disambiguated by domain when two retailers share a name) and mapped back.
export function retailerOptions(retailers) {
  const counts = new Map()
  for (const r of retailers) counts.set(r.name, (counts.get(r.name) || 0) + 1)
  const options = new Map()
  for (const r of retailers) {
    let key = counts.get(r.name) > 1 ? `${r.name} (${r.domain || r.id})` : r.name
    while (options.has(key) || key === NONE_OPTION) key = `${key} [${r.id}]`
    options.set(key, r)
  }
  return options
}

export function buildScaledownRoutingRequest({ subject, bodyText, addresses, options }) {
  const criteria = {}
  for (const [key, retailer] of options) {
    criteria[key] = retailer.domain ? `Retailer ${retailer.name}, email domain ${retailer.domain}` : `Retailer ${retailer.name}`
  }
  criteria[NONE_OPTION] = 'The email is not about or from any retailer listed here'
  const state = [
    `Subject: ${subject || ''}`,
    addresses?.length ? `Addresses: ${addresses.join(', ')}` : '',
    '',
    String(bodyText || ''),
  ].join('\n')
  return {
    state,
    model: SCALEDOWN_MODEL,
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
export function pickScaledownRetailer(response, options, minConfidence) {
  const answer = response?.answers?.retailer
  if (!answer || answer.type !== 'choice') return null
  const confidence = Number(answer.confidence)
  if (!Number.isFinite(confidence) || confidence < minConfidence) return null
  return options.get(answer.choice)?.id || null
}
