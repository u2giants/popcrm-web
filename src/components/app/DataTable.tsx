import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  className?: string
  headClassName?: string
  hideBelow?: Breakpoint
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
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const sv = col.sortValue
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = sv(a)
      const bv = sv(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv)) * factor
    })
  }, [rows, sort, columns])

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

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-2">
        <LoadingState rows={8} />
      </div>
    )
  }

  if (!sorted.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const active = sort?.key === col.key
              const sortable = !!col.sortValue
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
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
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
                    col.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
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
          ))}
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
