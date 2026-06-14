import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function AppPage({
  title,
  description,
  actions,
  toolbar,
  listBar,
  children,
  bodyClassName,
  scroll = true,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  toolbar?: ReactNode
  listBar?: ReactNode
  children: ReactNode
  bodyClassName?: string
  scroll?: boolean
}) {
  const header = listBar ? (
    <div className="shrink-0 border-b bg-background/95 backdrop-blur">{listBar}</div>
  ) : (
    <div className="shrink-0 border-b bg-background/95 px-[20px] py-[14px] backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[19px] font-[650] leading-none tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-[4px] text-[12px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {toolbar ? <div className="mt-[10px]">{toolbar}</div> : null}
    </div>
  )

  const body = (
    <div className={cn('px-[20px] py-[16px] sm:px-6 lg:px-8', bodyClassName)}>{children}</div>
  )

  if (!scroll) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {header}
        <div className="min-h-0 flex-1 overflow-hidden">{body}</div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}
      <ScrollArea className="min-h-0 flex-1">{body}</ScrollArea>
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-[650] tracking-[-0.005em] text-foreground">{title}</h2>
        {description ? (
          <p className="mt-[1px] text-[11.5px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

// One-row page header for list screens.
// Layout: title [count] [subtitle] [segments] · flex-1 · [search] [filters] [clear] [actions]
// Pass extra={<Tabs>} for a second row (e.g. email routing segments).
export function ListBar({
  title,
  subtitle,
  count,
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  showClear,
  onClear,
  filters,
  actions,
  segments,
  extra,
}: {
  title: string
  subtitle?: string
  count?: number
  search?: string
  onSearch?: (v: string) => void
  searchPlaceholder?: string
  showClear?: boolean
  onClear?: () => void
  filters?: ReactNode
  actions?: ReactNode
  segments?: ReactNode
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[8px] px-[20px] py-[10px] sm:px-6 lg:px-8">
      <div className="flex min-h-[34px] flex-wrap items-center gap-[8px]">
        <h1 className="text-[19px] font-[650] leading-none tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <span className="text-[12px] text-muted-foreground">{subtitle}</span>
        ) : null}
        {count !== undefined ? (
          <span className="rounded-full bg-muted px-[7px] py-[2px] text-[11px] tabular-nums text-muted-foreground">
            {count.toLocaleString()}
          </span>
        ) : null}
        {segments ? <div className="shrink-0">{segments}</div> : null}
        <div className="flex-1" />
        {onSearch ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-[9px] top-1/2 size-[13px] -translate-y-1/2 text-muted-foreground" />
            <input
              value={search ?? ''}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-[32px] w-[200px] rounded-[8px] border border-input bg-background pl-[28px] pr-[9px] text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ) : null}
        {filters}
        {showClear && onClear ? (
          <button
            onClick={onClear}
            className="flex h-[32px] items-center gap-[5px] rounded-[8px] px-[8px] text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-[12px]" />
            Clear
          </button>
        ) : null}
        {actions}
      </div>
      {extra ? <div>{extra}</div> : null}
    </div>
  )
}
