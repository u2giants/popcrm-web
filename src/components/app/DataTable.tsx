import { useMemo, useRef, useState, type ReactNode } from 'react'
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

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  filterValue?: (row: T) => string | number | null | undefined
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
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  pageSize?: number
  initialSort?: { key: string; dir: 'asc' | 'desc' }
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [filterText, setFilterText] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)
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

  const byKey = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns])
  const orderedCols = colOrder.map((k) => byKey[k]).filter(Boolean)
  // hideBelow columns stay in DOM — responsive hiding is handled via className on td/th
  const allVisibleCols = orderedCols.filter((c) => !colHidden[c.key])

  const activeFilters = Object.entries(filterText).filter(([, v]) => v?.trim())

  const filtered = useMemo(() => {
    if (!activeFilters.length) return rows
    return rows.filter((row) =>
      activeFilters.every(([key, text]) => {
        const col = byKey[key]
        const valueOf = col?.filterValue ?? col?.sortValue
        if (!valueOf) return true
        return String(valueOf(row) ?? '').toLowerCase().includes(text.trim().toLowerCase())
      }),
    )
  }, [rows, activeFilters, byKey])

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

  function toggleSort(key: string) {
    setPage(0)
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  function setColFilter(key: string, value: string) {
    setPage(0)
    setFilterText((prev) => {
      const next = { ...prev }
      if (!value.trim()) delete next[key]
      else next[key] = value
      return next
    })
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

  return (
    <div
      className="overflow-hidden rounded-[13px] border bg-card"
      onClick={() => colMenuOpen && setColMenuOpen(false)}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 border-b bg-card px-[10px] py-[7px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11.5px] font-[500] text-muted-foreground">
          {sorted.length.toLocaleString()} rows
          {activeFilters.length > 0
            ? ` · ${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''}`
            : ''}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setFilterText({})}
              title="Clear all filters"
            >
              <X className="size-3.5" />
            </Button>
          )}
          <Button
            variant={showFilters ? 'default' : 'ghost'}
            size="sm"
            className="h-[28px] gap-1.5 px-[10px] text-[12px]"
            onClick={() => setShowFilters((s) => !s)}
          >
            <ListFilter className="size-[14px]" />
            Filters
          </Button>
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
          className="w-full min-w-full border-collapse"
          style={{ tableLayout: hasWidths ? 'fixed' : undefined }}
        >
          {hasWidths && (
            <colgroup>
              {allVisibleCols.map((col) => (
                <col key={col.key} style={colWidths[col.key] ? { width: colWidths[col.key] } : undefined} />
              ))}
            </colgroup>
          )}

          <thead>
            {/* Sort header row */}
            <tr className="border-b bg-muted">
              {allVisibleCols.map((col) => {
                const sortable = !!col.sortValue
                const filterable = !!(col.filterValue ?? col.sortValue)
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'relative select-none border-b-0 px-[14px] py-[7px] text-left text-[11px] font-[600] uppercase tracking-[0.04em] whitespace-nowrap text-muted-foreground',
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
                    <div className={cn('flex items-center gap-[4px]', col.numeric && 'flex-row-reverse')}>
                      {sortable ? (
                        <button
                          type="button"
                          className="inline-flex min-w-0 items-center gap-[4px] hover:text-foreground"
                          onClick={() => toggleSort(col.key)}
                        >
                          <span className="truncate">{col.header}</span>
                          {active ? (
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
                        <span className="truncate">{col.header}</span>
                      )}
                      {filterable && (
                        <button
                          type="button"
                          className={cn(
                            'ml-auto flex size-[20px] shrink-0 items-center justify-center rounded-[5px] opacity-50 transition-colors hover:bg-accent hover:opacity-100',
                            filterText[col.key] && 'bg-primary/14 text-primary opacity-100',
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowFilters(true)
                            setTimeout(() => document.getElementById(`flt-${col.key}`)?.focus(), 30)
                          }}
                          title={`Filter ${String(col.header)}`}
                        >
                          <ListFilter className="size-3" />
                        </button>
                      )}
                    </div>
                    {/* Resize handle */}
                    <div
                      className="absolute top-0 right-[-3px] z-[3] h-full w-[7px] cursor-col-resize"
                      onMouseDown={(e) => onResizeDown(e, col.key)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="absolute top-[6px] right-[3px] bottom-[6px] w-[2px] rounded-[2px] transition-colors hover:bg-primary" />
                    </div>
                  </th>
                )
              })}
            </tr>

            {/* Floating filter row */}
            {showFilters && (
              <tr className="border-b">
                {allVisibleCols.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'bg-muted/55 px-[8px] py-[5px]',
                      col.hideBelow && HIDE_CLASS[col.hideBelow],
                    )}
                  >
                    {(col.filterValue ?? col.sortValue) ? (
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-[7px] size-3 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id={`flt-${col.key}`}
                          className="h-[26px] w-full rounded-[6px] border bg-card pl-[25px] pr-[8px] text-[11.5px] font-normal normal-case tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Filter…"
                          value={filterText[col.key] ?? ''}
                          onChange={(e) => setColFilter(col.key, e.target.value)}
                        />
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            )}
          </thead>

          <tbody>
            {pageRows.length ? (
              pageRows.map((row) => (
                <tr
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b transition-colors duration-[100ms] last:border-b-0',
                    onRowClick && 'cursor-pointer hover:bg-accent/55',
                  )}
                >
                  {allVisibleCols.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'h-10 px-[14px] py-0 text-[12.5px] align-middle',
                        col.numeric && 'text-right font-[650] tabular-nums',
                        col.className,
                        col.hideBelow && HIDE_CLASS[col.hideBelow],
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
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
    </div>
  )
}
