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
