// Human-readable error extraction for toast descriptions and console logs.
//
// Most write failures in this app come back from Supabase / PostgREST, which
// carry far more than a generic `Error.message`: a Postgres `code`, plus
// `details` and `hint` strings that usually say exactly what went wrong (e.g.
// which unique constraint or RLS policy tripped). The old `catch {}` sites threw
// all of that away and showed a flat "Could not …" toast, which is why failures
// were impossible to diagnose from a phone. These helpers surface it instead.

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// A short, human-facing description of any thrown value — safe to drop straight
// into a toast description. Combines the PostgREST message/details/hint/code
// when present, and falls back to Error.message or String(value) otherwise.
export function describeError(error: unknown): string {
  if (error == null) return 'Unknown error'
  if (typeof error === 'string') return error.trim() || 'Unknown error'

  const record = asRecord(error)
  if (record) {
    const message = str(record.message)
    const details = str(record.details)
    const hint = str(record.hint)
    const code = str(record.code)

    const parts: string[] = []
    if (message) parts.push(message)
    // `details`/`hint` frequently name the exact constraint or column, so keep
    // them unless they just repeat the message.
    if (details && details !== message) parts.push(details)
    if (hint && hint !== message && hint !== details) parts.push(`Hint: ${hint}`)

    let text = parts.join(' — ')
    if (code) text = text ? `${text} (${code})` : `Error ${code}`
    if (text) return text
  }

  if (error instanceof Error && error.message) return error.message

  try {
    return String(error)
  } catch {
    return 'Unknown error'
  }
}

// The Postgres SQLSTATE / PostgREST code for a thrown value, if any.
// `23505` = unique_violation, `23503` = foreign_key_violation, etc.
export function errorCode(error: unknown): string | undefined {
  const record = asRecord(error)
  const code = record ? str(record.code) : ''
  return code || undefined
}

// Log the full error object (all fields, stack) alongside a context label, then
// return a description for display. Keeps the console useful for debugging while
// the toast stays concise.
export function logError(context: string, error: unknown): string {
  console.error(`[${context}]`, error)
  return describeError(error)
}
