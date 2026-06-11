import { label } from '@/features/crm/format'

// Build a sorted, de-duplicated list of filter options from a record set.
export function uniqueValues<T>(
  rows: T[],
  pick: (row: T) => string | null | undefined,
): { value: string; label: string }[] {
  const seen = new Set<string>()
  for (const row of rows) {
    const v = pick(row)
    if (v) seen.add(v)
  }
  return Array.from(seen)
    .sort()
    .map((v) => ({ value: v, label: label(v) }))
}
