import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// A search/filter/action row. Search is always present; filters and trailing
// actions slot in around it. Wraps cleanly on mobile.
export function PageToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters,
  actions,
  onClear,
  showClear,
  className,
}: {
  search: string
  onSearch: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  actions?: ReactNode
  onClear?: () => void
  showClear?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex h-9 min-w-48 flex-1 items-center gap-2 rounded-md border bg-card px-2.5 sm:max-w-xs">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="text-muted-foreground hover:text-foreground"
            title="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {filters}
      {showClear ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      ) : null}
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
