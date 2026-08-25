// Suggests a Customer domain from that customer's own contact email addresses.
// This only ever proposes a value: core.customer.domain is curated data and is
// written solely when a human accepts the suggestion (see CustomerDrawer).
// Ingested email domains still never write to core.customer — that promotion
// path was retired by shared-db migration 20260629034600.
//
// A curated domain is load-bearing well beyond this screen: core.match_customer
// treats an exact domain match as a confident ERP/PLM link, and a customer with
// a domain stops obeying not-customer address rules. So the bar here is
// deliberately high — subdomains collapse to the registrable root, consumer and
// ISP mailboxes are ignored, and one lone contact is not enough evidence.

const INTERNAL_DOMAIN = 'popcre.com'

// A suggestion needs at least this many contacts agreeing on the same domain.
const MIN_CONTACTS_FOR_SUGGESTION = 2

// Consumer and ISP mailboxes say nothing about which company a contact works for.
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'ymail.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'zoho.com', 'mail.com', 'gmx.com', 'fastmail.com',
  'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'bellsouth.net',
  'cox.net', 'charter.net', 'earthlink.net', 'rogers.com', 'sympatico.ca', 'shaw.ca',
  'hotmail.co.uk', 'yahoo.co.uk', 'live.co.uk', 'btinternet.com', 'yahoo.ca', 'yahoo.com.au',
])

// Suffixes where the registrable name is the third label, not the second.
const MULTI_PART_SUFFIXES = [
  'co.uk', 'org.uk', 'me.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'co.jp',
  'com.br', 'com.mx', 'com.cn', 'com.hk', 'co.in', 'co.za', 'com.tr', 'com.sg',
]

const DOMAIN_SHAPE = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/

export function isDomainShape(value: string): boolean {
  return DOMAIN_SHAPE.test(value)
}

export function domainOfEmail(email: string | null | undefined): string | null {
  const text = String(email ?? '').trim().toLowerCase()
  const at = text.lastIndexOf('@')
  if (at < 1) return null
  const domain = text.slice(at + 1)
  return isDomainShape(domain) ? domain : null
}

/**
 * Registrable root of a domain, so relay and campaign subdomains
 * (mpsend.walmart.com, deals.zulily.com) count toward the real company.
 */
export function rootDomain(domain: string): string {
  const parts = domain.split('.')
  if (parts.length <= 2) return domain
  const lastTwo = parts.slice(-2).join('.')
  return MULTI_PART_SUFFIXES.includes(lastTwo) ? parts.slice(-3).join('.') : lastTwo
}

/**
 * Most common usable domain across the given contact emails, or null when the
 * evidence is too thin to put in front of someone as a one-click write. Ties
 * break on the first one seen, which keeps the suggestion stable.
 */
export function suggestDomainFromEmails(emails: Array<string | null | undefined>): string | null {
  const counts = new Map<string, number>()
  for (const email of emails) {
    const domain = domainOfEmail(email)
    if (!domain) continue
    const root = rootDomain(domain)
    if (root === INTERNAL_DOMAIN || PERSONAL_EMAIL_DOMAINS.has(root) || PERSONAL_EMAIL_DOMAINS.has(domain)) continue
    counts.set(root, (counts.get(root) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [domain, count] of counts) {
    if (count > bestCount) {
      best = domain
      bestCount = count
    }
  }
  return bestCount >= MIN_CONTACTS_FOR_SUGGESTION ? best : null
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
