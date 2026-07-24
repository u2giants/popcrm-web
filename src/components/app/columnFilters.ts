// Pure, framework-free helpers for DataTable column filtering.
// Kept out of DataTable.tsx so they can be unit-tested in the node test env
// (the component itself needs a DOM to render).

/** Extracts a comparable string for a row/column, matching the filter's own key. */
export type ValueOf<T> = (row: T) => string | number | null | undefined

/**
 * Distinct display values for a column across ALL rows (not the filtered subset,
 * so checking one value never collapses the list). Blank/empty values collapse to
 * a single '' sentinel surfaced first — rendered as "(blank)" — so rows with no
 * value in a column are still filterable.
 */
export function columnDistinctValues<T>(rows: readonly T[], valueOf: ValueOf<T>): string[] {
  const seen = new Set<string>()
  let hasBlank = false
  for (const row of rows) {
    const v = String(valueOf(row) ?? '').trim()
    if (v) seen.add(v)
    else hasBlank = true
  }
  const sorted = [...seen].sort((a, b) => a.localeCompare(b))
  return hasBlank ? ['', ...sorted] : sorted
}
