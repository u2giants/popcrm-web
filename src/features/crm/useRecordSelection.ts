import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

// Deep-linkable record selection backed by a URL query param (e.g. ?message=<id>).
// Returns the matched record (or null) and a setter that keeps the URL in sync.
export function useRecordSelection<T extends { id: string }>(param: string, items: T[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const id = searchParams.get(param)

  const selected = useMemo(() => items.find((i) => i.id === id) ?? null, [items, id])

  const select = useCallback(
    (next: T | null) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next) params.set(param, next.id)
          else params.delete(param)
          return params
        },
        { replace: true },
      )
    },
    [param, setSearchParams],
  )

  return [selected, select] as const
}
