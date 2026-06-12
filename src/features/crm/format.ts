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

// Resolve the display name of a Directus relation that may be expanded or an id.
// Handles named records (name/title) and user records (first/last/email).
export function relatedName(
  value:
    | string
    | {
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

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
