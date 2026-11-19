// Display formatting helpers shared across CRM screens.

// Overrides for values whose generic snake→title conversion is wrong or ugly.
const LABEL_OVERRIDES: Record<string, string> = {
  AI: 'AI',
  DETERMINISTIC: 'Rule match',
  COMPANY_ONLY: 'Company only',
  COMPANY_DEPT: 'Company + dept',
  COMPANY_EMAIL_NO_COMPANY: 'Company (no match)',
  CUSTOMER_EMAIL_NO_COMPANY: 'Unmatched sender',
  IN_PROGRESS: 'In progress',
  TODO: 'To do',
  // Customer status / chain — match the imported legacy choice labels.
  UNASSIGNED: 'New Company',
  OFF_PRICE: 'Off-Price',
  ECOM: 'eCom',
  GROCERY_DRUG: 'Grocery/Drug',
  // Global contact titles are stored and shown as written (acronyms stay
  // upper case); generic title-casing would mangle them.
  SVP: 'SVP',
  GVP: 'GVP',
  VP: 'VP',
  GMM: 'GMM',
  DMM: 'DMM',
  BUYER: 'BUYER',
  'ASSOCIATE BUYER': 'ASSOCIATE BUYER',
  'ASSISTANT BUYER': 'ASSISTANT BUYER',
}

// Turn an UPPER_SNAKE enum or snake field name into a readable label.
export function label(value: string | null | undefined) {
  if (!value) return 'Unspecified'
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value]
  return value
    .toLowerCase()
    .split('_')
    .map((part) => (part[0]?.toUpperCase() ?? '') + part.slice(1))
    .join(' ')
}

// Short human label for customer/vendor pickers and relation rendering:
// the curated display_name when present, else the full (legal/ERP) name.
export function customerLabel(row: { name?: string | null; display_name?: string | null }) {
  return row.display_name?.trim() || row.name || ''
}

// Resolve the display name of a legacy relation that may be expanded or an id.
// Prefers the hub display_name (customers/vendors) over the full name; handles
// named records (name/title) and user records (first/last/email).
export function relatedName(
  value:
    | string
    | {
        display_name?: string | null
        name?: string | null
        title?: string | null
        first_name?: string | null
        last_name?: string | null
        email?: string | null
      }
    | null
    | undefined,
) {
  if (!value) return '—'
  if (typeof value === 'string') return '—'
  if (value.display_name) return value.display_name
  if (value.name) return value.name
  if (value.title) return value.title
  const full = [value.first_name, value.last_name].filter(Boolean).join(' ')
  if (full) return full
  return value.email || '—'
}

// Resolve the id of a relation that may be expanded or an id string.
export function idOf(value: string | { id?: string } | null | undefined) {
  if (!value) return ''
  return typeof value === 'string' ? value : value.id || ''
}

export function textOf(...values: unknown[]) {
  return values.filter(Boolean).join(' ').toLowerCase()
}

export function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?'
  )
}

// A date-only string ("2026-11-20" — no time, no offset) names a calendar day,
// not an instant. `new Date("2026-11-20")` parses it as UTC midnight, which
// reads as the 19th for everyone west of UTC. Split it into local parts so the
// entered day is the day shown (#48).
export function parseDateParts(value: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const parts = parseDateParts(value)
  const date = parts ? new Date(parts.year, parts.month - 1, parts.day) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Money for estimate tiles, one shared rule (#55): the value is rounded to
// the precision each band displays BEFORE the unit is chosen, so 999,600
// rounds to 1,000k and reads "$1.00M" — the per-screen copies this replaced
// chose "k" first and printed "$1000k". Missing or unparsable values read as
// an em dash, like the date helpers.
export function formatAmount(val: string | number | null | undefined): string {
  if (val == null || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return '—'
  // The k band shows whole thousands: round to that precision, then let the
  // rounded value pick the band (so 1,500 -> "$2k", 999,499 -> "$999k").
  const roundedK = Math.round(n / 1_000) * 1_000
  if (roundedK >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (roundedK >= 1_000) return `$${(roundedK / 1_000).toFixed(0)}k`
  return `$${Math.round(n).toFixed(0)}`
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function monthKey(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}
