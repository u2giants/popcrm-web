export type SearchQueryResult<T> = {
  data: T[] | null
  error: unknown
}

export function rowsOrReport<T>(group: string, result: SearchQueryResult<T>): T[] {
  if (result.error) {
    console.error(`CommandSearch: ${group} query failed`, result.error)
    return []
  }
  return result.data ?? []
}

// Which search groups failed, so the palette can say the results are
// incomplete instead of rendering a failed group as "no matches" (#58).
// Group independence itself is intentional (see api.ts searchCrm): one bad
// group must not blank the others.
export function failedSearchGroups(groups: Record<string, SearchQueryResult<unknown>>): string[] {
  return Object.entries(groups)
    .filter(([, result]) => result.error)
    .map(([group]) => group)
}
