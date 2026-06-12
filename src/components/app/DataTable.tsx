import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronsUpDown, ChevronUp, Funnel, Search, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
}

type ColumnFilter = {
  search: string
  excluded: string[]
}

type FilterOption = {
  value: string
  label: string
}

function normalizeFilterValue(value: string | number | null | undefined) {
  if (value == null || value === '') return '__blank__'
  return String(value)
}

function formatFilterLabel(value: string | number | null | undefined) {
  if (value == null || value === '') return 'Blank'
  return String(value)
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
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    initialSort ?? null,
  )
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({})
  const [page, setPage] = useState(0)

  const filterOptions = useMemo(() => {
    const next: Record<string, FilterOption[]> = {}

    for (const col of columns) {
      const valueOf = col.filterValue ?? col.sortValue
      if (!valueOf) continue

      const options = new Map<string, string>()
      for (const row of rows) {
        const value = valueOf(row)
        const key = normalizeFilterValue(value)
        if (!options.has(key)) options.set(key, formatFilterLabel(value))
      }

      next[col.key] = [...options.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
    }

    return next
  }, [rows, columns])

  const filtered = useMemo(() => {
    return rows.filter((row) =>
      columns.every((col) => {
        const active = filters[col.key]
        const valueOf = col.filterValue ?? col.sortValue
        if (!active || !valueOf) return true

        const value = valueOf(row)
        const normalized = normalizeFilterValue(value)
        if (active.excluded.includes(normalized)) return false

        const search = active.search.trim().toLowerCase()
        if (search && !formatFilterLabel(value).toLowerCase().includes(search)) return false

        return true
      }),
    )
  }, [rows, columns, filters])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return filtered
    const sv = col.sortValue
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = sv(a)
      const bv = sv(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv)) * factor
    })
  }, [filtered, sort, columns])

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

  function setSortDir(key: string, dir: 'asc' | 'desc' | null) {
    setPage(0)
    setSort(dir ? { key, dir } : null)
  }

  function updateFilter(key: string, updater: (filter: ColumnFilter) => ColumnFilter) {
    setPage(0)
    setFilters((prev) => {
      const nextFilter = updater(prev[key] ?? { search: '', excluded: [] })
      const next = { ...prev }
      if (!nextFilter.search && nextFilter.excluded.length === 0) {
        delete next[key]
      } else {
        next[key] = nextFilter
      }
      return next
    })
  }

  function clearFilter(key: string) {
    setPage(0)
    setFilters((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-2">
        <LoadingState rows={8} />
      </div>
    )
  }

  if (!sorted.length) {
    if (!rows.length) {
      return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const active = sort?.key === col.key
              const sortable = !!col.sortValue
              const columnFilter = filters[col.key]
              const filterable = !!(col.filterValue ?? col.sortValue)
              const options = filterOptions[col.key] ?? []
              const filtered =
                !!columnFilter && (!!columnFilter.search || columnFilter.excluded.length > 0)
              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    // Header never inherits the cell's width-collapsing class
                    // (max-w-0 is a truncation trick that only belongs on <td>).
                    col.headClassName ?? col.className?.replace('max-w-0', ''),
                    col.hideBelow && HIDE_CLASS[col.hideBelow],
                  )}
                >
                  <div className="flex min-w-0 items-center justify-between gap-1">
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"
                      >
                        <span className="truncate">{col.header}</span>
                        {active ? (
                          sort?.dir === 'asc' ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span className="truncate">{col.header}</span>
                    )}
                    {filterable ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className={cn(
                              '-mr-1 text-muted-foreground hover:text-foreground',
                              filtered && 'bg-primary/10 text-primary hover:text-primary',
                            )}
                            aria-label={`Filter ${String(col.header)}`}
                          >
                            <Funnel className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <DropdownMenuLabel className="flex items-center justify-between gap-2">
                            <span className="truncate">{col.header}</span>
                            {filtered ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  clearFilter(col.key)
                                }}
                                aria-label="Clear filter"
                              >
                                <X className="size-3.5" />
                              </Button>
                            ) : null}
                          </DropdownMenuLabel>
                          {sortable ? (
                            <>
                              <DropdownMenuItem onClick={() => setSortDir(col.key, 'asc')}>
                                <ChevronUp className="size-3.5" />
                                Sort ascending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortDir(col.key, 'desc')}>
                                <ChevronDown className="size-3.5" />
                                Sort descending
                              </DropdownMenuItem>
                              {active ? (
                                <DropdownMenuItem onClick={() => setSortDir(col.key, null)}>
                                  <X className="size-3.5" />
                                  Clear sort
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                            </>
                          ) : null}
                          <div className="p-2" onClick={(event) => event.stopPropagation()}>
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                value={columnFilter?.search ?? ''}
                                onChange={(event) =>
                                  updateFilter(col.key, (filter) => ({
                                    ...filter,
                                    search: event.target.value,
                                  }))
                                }
                                placeholder="Search this column"
                                className="h-8 pl-8 text-xs"
                              />
                            </div>
                          </div>
                          <DropdownMenuSeparator />
                          <div className="max-h-56 overflow-y-auto p-1">
                            {options.length ? (
                              options.map((option) => {
                                const checked = !columnFilter?.excluded.includes(option.value)
                                return (
                                  <label
                                    key={option.value}
                                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(next) =>
                                        updateFilter(col.key, (filter) => ({
                                          ...filter,
                                          excluded: next
                                            ? filter.excluded.filter((value) => value !== option.value)
                                            : [...new Set([...filter.excluded, option.value])],
                                        }))
                                      }
                                    />
                                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                  </label>
                                )
                              })
                            ) : (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">No values</div>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length ? (
            pageRows.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(col.className, col.hideBelow && HIDE_CLASS[col.hideBelow])}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                No rows match the table filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pageCount > 1 ? (
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
      ) : null}
    </div>
  )
}
