// Suggests a Customer domain from that customer's own contact email addresses.
// This only ever proposes a value: core.customer.domain is curated data and is
// written solely when a human accepts the suggestion (see CustomerDrawer).
// Ingested email domains still never write to core.customer — that promotion
// path was retired by shared-db migration 20260629034600.

const INTERNAL_DOMAIN = 'popcre.com'

// Consumer mailboxes say nothing about which company a contact works for.
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'ymail.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'zoho.com', 'mail.com', 'gmx.com', 'fastmail.com',
])

export function domainOfEmail(email: string | null | undefined): string | null {
  const at = String(email ?? '').trim().toLowerCase().lastIndexOf('@')
  if (at < 1) return null
  const domain = String(email).trim().toLowerCase().slice(at + 1)
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) ? domain : null
}

/**
 * Most common usable domain across the given contact emails. Ties break on the
 * first one seen, which keeps the suggestion stable for a given contact list.
 */
export function suggestDomainFromEmails(emails: Array<string | null | undefined>): string | null {
  const counts = new Map<string, number>()
  for (const email of emails) {
    const domain = domainOfEmail(email)
    if (!domain || domain === INTERNAL_DOMAIN || FREE_EMAIL_DOMAINS.has(domain)) continue
    counts.set(domain, (counts.get(domain) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [domain, count] of counts) {
    if (count > bestCount) {
      best = domain
      bestCount = count
    }
  }
  return best
}

/** Trim/normalize what a user typed into the Domain box ('' means "clear it"). */
export function normalizeDomainInput(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''
  return trimmed
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^[^@]*@/, '')
    .replace(/\/.*$/, '')
}
