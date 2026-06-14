import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Columns3, GripVertical, ListFilter, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState, EmptyState } from '@/components/app/states'
import { cn } from '@/lib/utils'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

const HIDE_CLASS: Record<Breakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

export interface EditOption {
  value: string
  label: string
}

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  filterValue?: (row: T) => string | number | null | undefined
  /** Optional display label for a raw filterValue string shown in the popover. */
  filterLabel?: (value: string) => string
  /** Show a per-column quick-search box in the header. Defaults to filterable && !numeric. */
  headerSearch?: boolean
  /** Make cells inline-editable: clicking a cell opens a value dropdown instead of the row action. */
  editOptions?: EditOption[]
  /** Current raw value of an editable cell (used by the editor + drag-to-copy). */
  editValue?: (row: T) => string | null | undefined
  className?: string
  headClassName?: string
  hideBelow?: Breakpoint
  numeric?: boolean
  width?: number
  minWidth?: number
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  onCellEdit,
  loading,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyIcon,
  pageSize = 50,
  initialSort,
}: {
  rows: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  /** Persist an inline edit / drag-copy. Called once per affected row. */
  onCellEdit?: (row: T, columnKey: string, value: string) => void | Promise<void>
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  pageSize?: number
  initialSort?: { key: string; dir: 'asc' | 'desc' }
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [filterSets, setFilterSets] = useState<Record<string, string[]>>({})
  const [searchText, setSearchText] = useState<Record<string, string>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [filterSearch, setFilterSearch] = useState('')
  const [filterPos, setFilterPos] = useState<{ top: number; left: number } | null>(null)
  const [autocomplete, setAutocomplete] = useState<{ key: string; top: number; left: number; width: number } | null>(null)
  const [colOrder, setColOrder] = useState<string[]>(() => columns.map((c) => c.key))
  const [colHidden, setColHidden] = useState<Record<string, boolean>>({})
  const [colWidths, setColWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.width ?? 0])),
  )
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [page, setPage] = useState(0)
  const dragKey = useRef<string | null>(null)
  const [dropKey, setDropKey] = useState<string | null>(null)
  const resizing = useRef<{ key: string; startX: number; startW: number } | null>(null)
  const filterPopoverRef = useRef<HTMLDivElement | null>(null)

  // Inline editing + drag-to-copy state
  const [editCell, setEditCell] = useState<{ rowId: string; key: string; top: number; left: number } | null>(null)
  const [fill, setFill] = useState<{ key: string; sourceRowId: string; value: string; throughIndex: number } | null>(null)
  const fillRef = useRef(fill)
  useEffect(() => { fillRef.current = fill }, [fill])

  const byKey = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns])
  const orderedCols = colOrder.map((k) => byKey[k]).filter(Boolean)
  const allVisibleCols = orderedCols.filter((c) => !colHidden[c.key])

  const activeFilterEntries = useMemo(
    () => Object.entries(filterSets).filter(([, v]) => v.length > 0),
    [filterSets],
  )
  const activeSearchEntries = useMemo(
    () => Object.entries(searchText).filter(([, v]) => v.trim()),
    [searchText],
  )
  const activeCount = activeFilterEntries.length + activeSearchEntries.length

  const filtered = useMemo(() => {
    if (!activeFilterEntries.length && !activeSearchEntries.length) return rows
    return rows.filter((row) => {
      for (const [key, selected] of activeFilterEntries) {
        const col = byKey[key]
        const valueOf = col?.filterValue ?? col?.sortValue
        if (valueOf && !selected.includes(String(valueOf(row) ?? ''))) return false
      }
      for (const [key, text] of activeSearchEntries) {
        const col = byKey[key]
        const valueOf = col?.filterValue ?? col?.sortValue
        if (valueOf && !String(valueOf(row) ?? '').toLowerCase().includes(text.trim().toLowerCase())) return false
      }
      return true
    })
  }, [rows, activeFilterEntries, activeSearchEntries, byKey])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = byKey[sort.key]
    if (!col?.sortValue) return filtered
    const sv = col.sortValue
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = sv(a), bv = sv(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv)) * factor
    })
  }, [filtered, sort, byKey])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const pageRowIndex = useMemo(() => {
    const m = new Map<string, number>()
    pageRows.forEach((r, i) => m.set(getRowId(r), i))
    return m
  }, [pageRows, getRowId])

  // Distinct values per column (for popover + autocomplete), from ALL rows.
  function distinctValues(key: string): string[] {
    const col = byKey[key]
    const valueOf = col?.filterValue ?? col?.sortValue
    if (!valueOf) return []
    const seen = new Set<string>()
    for (const row of rows) {
      const v = String(valueOf(row) ?? '').trim()
      if (v) seen.add(v)
    }
    return [...seen].sort((a, b) => a.localeCompare(b))
  }

  const openFilterValues = useMemo(
    () => (openFilter ? distinctValues(openFilter) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openFilter, rows, byKey],
  )
  const filteredPopoverValues = useMemo(() => {
    const q = filterSearch.trim().toLowerCase()
    return q ? openFilterValues.filter((v) => v.toLowerCase().includes(q)) : openFilterValues
  }, [openFilterValues, filterSearch])

  // Autocomplete suggestions for the active header search box.
  const acSuggestions = useMemo(() => {
    if (!autocomplete) return []
    const q = (searchText[autocomplete.key] ?? '').trim().toLowerCase()
    if (!q) return []
    const col = byKey[autocomplete.key]
    return distinctValues(autocomplete.key)
      .map((v) => (col?.filterLabel ? col.filterLabel(v) : v))
      .filter((v) => v.toLowerCase().includes(q))
      .slice(0, 8)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autocomplete, searchText, byKey, rows])

  // Close filter popover on outside click / Escape.
  useEffect(() => {
    if (!openFilter) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenFilter(null)
    }
    function onPointer(e: PointerEvent) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setOpenFilter(null)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [openFilter])

  // Close edit dropdown on Escape.
  useEffect(() => {
    if (!editCell) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setEditCell(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editCell])

  function toggleSort(key: string) {
    setPage(0)
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  function openFilterFor(key: string, btn: HTMLElement) {
    if (openFilter === key) { setOpenFilter(null); return }
    setFilterSearch('')
    const rect = btn.getBoundingClientRect()
    const popW = 228
    const left = Math.min(rect.left, window.innerWidth - popW - 8)
    setFilterPos({ top: rect.bottom + 4, left })
    setOpenFilter(key)
  }

  function toggleFilterValue(key: string, value: string) {
    setPage(0)
    setFilterSets((prev) => {
      const current = prev[key] ?? []
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      if (!next.length) return Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
      return { ...prev, [key]: next }
    })
  }

  function selectAllValues(key: string) {
    setPage(0)
    setFilterSets((prev) => ({ ...prev, [key]: distinctValues(key) }))
  }

  function clearColFilter(key: string) {
    setPage(0)
    setFilterSets((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)))
  }

  function setColSearch(key: string, value: string, input: HTMLInputElement) {
    setPage(0)
    setSearchText((prev) => {
      if (!value) return Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
      return { ...prev, [key]: value }
    })
    const rect = input.getBoundingClientRect()
    setAutocomplete(value ? { key, top: rect.bottom + 2, left: rect.left, width: rect.width } : null)
  }

  // Column resize via mouse drag
  function onResizeDown(e: React.MouseEvent, key: string) {
    e.preventDefault()
    e.stopPropagation()
    const th = (e.currentTarget as HTMLElement).closest('th')
    resizing.current = { key, startX: e.clientX, startW: th?.offsetWidth ?? colWidths[key] ?? 160 }
    function onMove(ev: MouseEvent) {
      const r = resizing.current
      if (!r) return
      const minW = byKey[r.key]?.minWidth ?? 80
      setColWidths((prev) => ({ ...prev, [r.key]: Math.max(minW, r.startW + (ev.clientX - r.startX)) }))
    }
    function onUp() {
      resizing.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Column reorder via HTML5 drag
  function onDrop(targetKey: string) {
    const from = dragKey.current
    if (!from || from === targetKey) { setDropKey(null); return }
    setColOrder((prev) => {
      const next = prev.filter((k) => k !== from)
      const i = next.indexOf(targetKey)
      next.splice(i, 0, from)
      return next
    })
    dragKey.current = null
    setDropKey(null)
  }

  // Spreadsheet-style fill: drag the handle down/up the same column to copy a value.
  function onFillDown(e: React.MouseEvent, key: string, sourceRowId: string, value: string) {
    e.preventDefault()
    e.stopPropagation()
    const startIndex = pageRowIndex.get(sourceRowId) ?? 0
    setFill({ key, sourceRowId, value, throughIndex: startIndex })
    function onMove(ev: MouseEvent) {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null
      const td = el?.closest('td[data-row-index]') as HTMLElement | null
      if (!td) return
      const idx = Number(td.getAttribute('data-row-index'))
      if (!Number.isNaN(idx)) setFill((f) => (f ? { ...f, throughIndex: idx } : f))
    }
    async function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const f = fillRef.current
      setFill(null)
      if (!f || !onCellEdit) return
      const lo = Math.min(startIndex, f.throughIndex)
      const hi = Math.max(startIndex, f.throughIndex)
      for (let i = lo; i <= hi; i++) {
        const row = pageRows[i]
        if (!row) continue
        const col = byKey[f.key]
        const current = col?.editValue ? String(col.editValue(row) ?? '') : ''
        if (current === f.value) continue
        await onCellEdit(row, f.key, f.value)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function fillRangeHas(rowId: string, key: string): boolean {
    const f = fill
    if (!f || f.key !== key) return false
    const src = pageRowIndex.get(f.sourceRowId)
    const idx = pageRowIndex.get(rowId)
    if (src == null || idx == null) return false
    return idx >= Math.min(src, f.throughIndex) && idx <= Math.max(src, f.throughIndex)
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-[13px] border bg-card p-2">
        <LoadingState rows={8} />
      </div>
    )
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
  }

  const hasWidths = allVisibleCols.some((c) => colWidths[c.key] > 0)
  const tableWidth = hasWidths
    ? allVisibleCols.reduce((sum, col) => sum + (colWidths[col.key] || col.width || col.minWidth || 120), 0)
    : undefined

  return (
    <div
      className="overflow-hidden rounded-[13px] border bg-card"
      onClick={() => {
        if (colMenuOpen) setColMenuOpen(false)
        if (openFilter) setOpenFilter(null)
        if (editCell) setEditCell(null)
        if (autocomplete) setAutocomplete(null)
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 border-b bg-card px-[10px] py-[7px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11.5px] font-[500] text-muted-foreground">
          {sorted.length.toLocaleString()} rows
          {activeCount > 0 ? ` · ${activeCount} filter${activeCount !== 1 ? 's' : ''} active` : ''}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-[28px] gap-1.5 px-[10px] text-[12px]"
              onClick={() => { setFilterSets({}); setSearchText({}) }}
              title="Clear all filters"
            >
              <X className="size-[13px] " />
              Clear filters
            </Button>
          )}
          {/* Columns visibility menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-[28px] gap-1.5 px-[10px] text-[12px]"
              onClick={(e) => { e.stopPropagation(); setColMenuOpen((o) => !o) }}
            >
              <Columns3 className="size-[14px]" />
              Columns
            </Button>
            {colMenuOpen && (
              <div
                className="absolute right-0 top-[calc(100%+6px)] z-20 w-[220px] overflow-y-auto rounded-[11px] border bg-popover p-[7px]"
                style={{ maxHeight: 320, boxShadow: 'var(--shadow-lg)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {orderedCols.map((col) => (
                  <button
                    key={col.key}
                    className="flex w-full cursor-grab items-center gap-[9px] rounded-[7px] px-[8px] py-[6px] text-[12.5px] hover:bg-accent"
                    draggable
                    onDragStart={() => { dragKey.current = col.key }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(col.key)}
                    onClick={() => setColHidden((h) => ({ ...h, [col.key]: !h[col.key] }))}
                  >
                    <GripVertical className="size-[13px] shrink-0 text-muted-foreground" />
                    <span
                      className={cn(
                        'flex size-[16px] shrink-0 items-center justify-center rounded-[5px] border',
                        !colHidden[col.key]
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border-strong',
                      )}
                    >
                      {!colHidden[col.key] && (
                        <svg className="size-[11px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 truncate text-left">{col.header}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="overflow-auto">
        <table
          className="w-max border-collapse"
          style={{
            tableLayout: hasWidths ? 'fixed' : undefined,
            width: tableWidth,
          }}
        >
          {hasWidths && (
            <colgroup>
              {allVisibleCols.map((col) => (
                <col key={col.key} style={colWidths[col.key] ? { width: colWidths[col.key] } : undefined} />
              ))}
            </colgroup>
          )}

          <thead>
            <tr className="border-b bg-muted">
              {allVisibleCols.map((col) => {
                const sortable = !!col.sortValue
                const filterable = !!(col.filterValue ?? col.sortValue)
                const showSearch = (col.headerSearch ?? (filterable && !col.numeric))
                const activeSort = sort?.key === col.key
                const hasFilter = !!(filterSets[col.key]?.length)
                const hasSearch = !!(searchText[col.key]?.trim())
                const filterOpen = openFilter === col.key
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'group relative select-none border-b-0 border-r border-r-border/60 last:border-r-0 px-[14px] py-[7px] text-left text-[11px] font-[600] uppercase tracking-[0.04em] whitespace-nowrap text-muted-foreground',
                      col.numeric && 'text-right',
                      dropKey === col.key &&
                        'before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-primary before:content-[""]',
                      col.headClassName ?? col.className?.replace('max-w-0', ''),
                      col.hideBelow && HIDE_CLASS[col.hideBelow],
                    )}
                    draggable
                    onDragStart={() => { dragKey.current = col.key }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (dropKey !== col.key) setDropKey(col.key)
                    }}
                    onDragLeave={() => setDropKey((k) => (k === col.key ? null : k))}
                    onDrop={() => onDrop(col.key)}
                  >
                    <div className={cn('flex items-center gap-[6px]', col.numeric && 'flex-row-reverse')}>
                      {sortable ? (
                        <button
                          type="button"
                          className="inline-flex min-w-0 shrink-0 items-center gap-[4px] hover:text-foreground"
                          onClick={() => toggleSort(col.key)}
                        >
                          <span className="truncate">{col.header}</span>
                          {activeSort ? (
                            sort?.dir === 'asc' ? (
                              <ChevronUp className="size-3 shrink-0 opacity-70" />
                            ) : (
                              <ChevronDown className="size-3 shrink-0 opacity-70" />
                            )
                          ) : (
                            <ChevronsUpDown className="size-3 shrink-0 opacity-30" />
                          )}
                        </button>
                      ) : (
                        <span className="shrink-0 truncate">{col.header}</span>
                      )}

                      {showSearch && (
                        <div className="relative min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            className={cn(
                              'h-[22px] w-full min-w-[40px] rounded-[6px] border bg-card px-[7px] text-[11px] font-normal normal-case tracking-normal text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring',
                              hasSearch && 'border-primary/60',
                            )}
                            placeholder="Search…"
                            value={searchText[col.key] ?? ''}
                            onChange={(e) => setColSearch(col.key, e.target.value, e.currentTarget)}
                            onFocus={(e) => {
                              if (e.currentTarget.value) {
                                const r = e.currentTarget.getBoundingClientRect()
                                setAutocomplete({ key: col.key, top: r.bottom + 2, left: r.left, width: r.width })
                              }
                            }}
                            onKeyDown={(e) => { if (e.key === 'Escape') { setColSearch(col.key, '', e.currentTarget); (e.currentTarget as HTMLInputElement).blur() } }}
                          />
                        </div>
                      )}

                      {filterable && (
                        <button
                          type="button"
                          className={cn(
                            'ml-auto flex size-[20px] shrink-0 items-center justify-center rounded-[5px] transition-colors',
                            hasFilter || filterOpen
                              ? 'bg-primary/14 text-primary'
                              : 'text-muted-foreground opacity-30 group-hover:opacity-70 hover:!opacity-100 hover:bg-accent',
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openFilterFor(col.key, e.currentTarget)
                          }}
                          title={`Filter by ${String(col.header)}`}
                        >
                          <ListFilter className="size-3" />
                        </button>
                      )}
                    </div>

                    {/* Resize handle with a visible separator line */}
                    <div
                      className="group/resize absolute top-0 right-[-4px] z-[3] flex h-full w-[9px] cursor-col-resize items-center justify-center"
                      onMouseDown={(e) => onResizeDown(e, col.key)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="h-[60%] w-[2px] rounded-[2px] bg-border transition-colors group-hover/resize:bg-primary" />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {pageRows.length ? (
              pageRows.map((row) => {
                const rowId = getRowId(row)
                const rowIndex = pageRowIndex.get(rowId) ?? 0
                return (
                  <tr
                    key={rowId}
                    className={cn(
                      'border-b transition-colors duration-[100ms] last:border-b-0',
                      onRowClick && 'hover:bg-accent/55',
                    )}
                  >
                    {allVisibleCols.map((col) => {
                      const editable = !!col.editOptions && !!onCellEdit
                      const inFill = fillRangeHas(rowId, col.key)
                      const isEditing = editCell?.rowId === rowId && editCell.key === col.key
                      return (
                        <td
                          key={col.key}
                          data-row-index={rowIndex}
                          onClick={
                            editable
                              ? (e) => {
                                  e.stopPropagation()
                                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                  setEditCell({ rowId, key: col.key, top: r.bottom + 2, left: r.left })
                                }
                              : onRowClick
                                ? () => onRowClick(row)
                                : undefined
                          }
                          className={cn(
                            'group/cell relative h-10 px-[14px] py-0 text-[12.5px] align-middle',
                            col.numeric && 'text-right font-[650] tabular-nums',
                            (onRowClick || editable) && 'cursor-pointer',
                            isEditing && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
                            inFill && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
                            col.className,
                            col.hideBelow && HIDE_CLASS[col.hideBelow],
                          )}
                        >
                          {col.cell(row)}
                          {/* Fill handle (spreadsheet drag-to-copy) */}
                          {editable && (
                            <span
                              role="button"
                              aria-label="Drag to copy down"
                              title="Drag to copy"
                              className="absolute bottom-[3px] right-[3px] z-[2] size-[8px] cursor-crosshair rounded-[2px] border border-card bg-primary opacity-0 transition-opacity group-hover/cell:opacity-100"
                              onMouseDown={(e) =>
                                onFillDown(e, col.key, rowId, String(col.editValue?.(row) ?? ''))
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={allVisibleCols.length}
                  className="h-20 text-center text-[12.5px] text-muted-foreground"
                >
                  No rows match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="px-2">
              {safePage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Filter popover (set/checkbox filter) */}
      {openFilter && filterPos && (
        <FilterPopover
          ref={filterPopoverRef}
          col={byKey[openFilter]}
          pos={filterPos}
          values={filteredPopoverValues}
          allValues={openFilterValues}
          selected={filterSets[openFilter] ?? []}
          search={filterSearch}
          onSearch={setFilterSearch}
          onToggle={(v) => toggleFilterValue(openFilter, v)}
          onSelectAll={() => selectAllValues(openFilter)}
          onClear={() => clearColFilter(openFilter)}
          onClose={() => setOpenFilter(null)}
        />
      )}

      {/* Header search autocomplete */}
      {autocomplete && acSuggestions.length > 0 && (
        <div
          className="fixed z-50 max-h-[220px] overflow-y-auto rounded-[9px] border bg-popover p-[4px]"
          style={{ top: autocomplete.top, left: autocomplete.left, minWidth: Math.max(autocomplete.width, 140), boxShadow: 'var(--shadow-lg)' }}
          onPointerDown={(e) => e.preventDefault()}
        >
          {acSuggestions.map((s) => (
            <button
              key={s}
              className="block w-full truncate rounded-[6px] px-[8px] py-[5px] text-left text-[12px] hover:bg-accent"
              onClick={() => {
                setSearchText((prev) => ({ ...prev, [autocomplete.key]: s }))
                setAutocomplete(null)
                setPage(0)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Inline cell edit dropdown */}
      {editCell && (() => {
        const col = byKey[editCell.key]
        const row = pageRows.find((r) => getRowId(r) === editCell.rowId)
        if (!col?.editOptions || !row) return null
        const current = String(col.editValue?.(row) ?? '')
        return (
          <div
            className="fixed z-50 max-h-[260px] w-[200px] overflow-y-auto rounded-[10px] border bg-popover p-[5px]"
            style={{ top: editCell.top, left: editCell.left, boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {col.editOptions.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-[7px] px-[8px] py-[6px] text-left text-[12.5px] hover:bg-accent',
                  opt.value === current && 'font-[600] text-primary',
                )}
                onClick={async () => {
                  setEditCell(null)
                  if (opt.value !== current) await onCellEdit?.(row, editCell.key, opt.value)
                }}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === current && (
                  <svg className="size-[13px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )
      })()}
    </div>
  )
}

function FilterPopover({
  ref,
  col,
  pos,
  values,
  allValues,
  selected,
  search,
  onSearch,
  onToggle,
  onSelectAll,
  onClear,
  onClose,
}: {
  ref: React.Ref<HTMLDivElement>
  col: { filterLabel?: (value: string) => string } | undefined
  pos: { top: number; left: number }
  values: string[]
  allValues: string[]
  selected: string[]
  search: string
  onSearch: (s: string) => void
  onToggle: (v: string) => void
  onSelectAll: () => void
  onClear: () => void
  onClose: () => void
}) {
  const searchRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => { searchRef.current?.focus() }, [])

  const allSelected = allValues.length > 0 && allValues.every((v) => selected.includes(v))
  const noneSelected = selected.length === 0

  return (
    <div
      ref={ref}
      className="fixed z-50 flex w-[228px] flex-col overflow-hidden rounded-[11px] border bg-popover"
      style={{ top: pos.top, left: pos.left, boxShadow: 'var(--shadow-lg, 0 8px 24px oklch(0 0 0 / 0.14))' }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-[6px] border-b px-[10px] py-[8px]">
        <Search className="size-[13px] shrink-0 text-muted-foreground" />
        <input
          ref={searchRef}
          className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          placeholder="Search values…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => onSearch('')} className="text-muted-foreground hover:text-foreground">
            <X className="size-[12px]" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-b px-[10px] py-[6px]">
        <button
          className="text-[11.5px] font-[500] text-primary hover:underline disabled:opacity-40"
          disabled={allSelected}
          onClick={onSelectAll}
        >
          Select all
        </button>
        <button
          className="text-[11.5px] font-[500] text-muted-foreground hover:text-foreground hover:underline disabled:opacity-40"
          disabled={noneSelected}
          onClick={() => { onClear(); onClose() }}
        >
          Clear
        </button>
      </div>

      {values.length === 0 ? (
        <p className="px-[10px] py-[10px] text-center text-[11.5px] text-muted-foreground">
          {allValues.length === 0 ? 'No values in column.' : 'No values match.'}
        </p>
      ) : (
        <ul className="max-h-[240px] overflow-y-auto p-[5px]">
          {values.map((v) => {
            const checked = selected.includes(v)
            const display = col?.filterLabel ? col.filterLabel(v) : v
            return (
              <li key={v}>
                <button
                  className="flex w-full items-center gap-[8px] rounded-[7px] px-[8px] py-[5px] text-left text-[12.5px] hover:bg-accent"
                  onClick={() => onToggle(v)}
                >
                  <span
                    className={cn(
                      'flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {checked && (
                      <svg className="size-[10px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 truncate">{display || <span className="italic text-muted-foreground">(blank)</span>}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="border-t px-[10px] py-[7px] text-[11.5px] text-muted-foreground">
          {selected.length} of {allValues.length} selected
        </div>
      )}
    </div>
  )
}
