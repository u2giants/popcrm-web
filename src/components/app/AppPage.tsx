import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Standard page wrapper: sticky page heading (title/description/actions) over a
// scrollable body with consistent Tailwind Plus page padding.
export function AppPage({
  title,
  description,
  actions,
  toolbar,
  children,
  bodyClassName,
  scroll = true,
}: {
  title: string
  description?: string
  actions?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
  bodyClassName?: string
  scroll?: boolean
}) {
  const header = (
    <div className="border-b bg-background/95 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {toolbar ? <div className="mt-3">{toolbar}</div> : null}
    </div>
  )

  const body = (
    <div className={cn('px-4 py-4 sm:px-6 lg:px-8', bodyClassName)}>{children}</div>
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
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
