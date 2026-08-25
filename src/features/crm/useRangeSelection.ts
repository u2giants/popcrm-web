import { useCallback, useRef, useState } from 'react'

/**
 * Checkbox selection with spreadsheet-style shift-click ranges.
 *
 * A plain click toggles one row and becomes the anchor. Shift-clicking a
 * second row applies the clicked row's new state to every row between the
 * anchor and it, in the order the table is currently rendering them — so the
 * range follows what the user sees after sorting and column filters, not the
 * order the rows were fetched in.
 */
export function useRangeSelection() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  // Row ids in rendered order, fed by the table via onVisibleRowsChange.
  const order = useRef<string[]>([])
  const anchor = useRef<string | null>(null)

  const setVisibleIds = useCallback((ids: string[]) => {
    order.current = ids
  }, [])

  const clear = useCallback(() => {
    anchor.current = null
    setSelected(new Set())
  }, [])

  const replace = useCallback((ids: string[]) => {
    anchor.current = null
    setSelected(new Set(ids))
  }, [])

  /** Handle a click on a row checkbox. `shiftKey` comes from the click event. */
  const toggle = useCallback((id: string, shiftKey = false) => {
    setSelected((current) => {
      const next = new Set(current)
      const from = anchor.current === null ? -1 : order.current.indexOf(anchor.current)
      const to = order.current.indexOf(id)
      // Range extend: apply the clicked row's new state across the span.
      if (shiftKey && from >= 0 && to >= 0 && from !== to) {
        const select = !current.has(id)
        for (let i = Math.min(from, to); i <= Math.max(from, to); i += 1) {
          const rowId = order.current[i]
          if (select) next.add(rowId)
          else next.delete(rowId)
        }
        return next
      }
      if (next.has(id)) next.delete(id)
      else next.add(id)
      anchor.current = id
      return next
    })
  }, [])

  return { selected, setSelected, setVisibleIds, toggle, clear, replace }
}
