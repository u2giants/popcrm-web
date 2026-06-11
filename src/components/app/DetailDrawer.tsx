import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Standard slide-over for record detail: header (title/subtitle/status),
// scrollable body, optional sticky footer for save/secondary actions.
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  status,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  status?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        className={cn('flex w-full flex-col gap-0 p-0 sm:max-w-xl', className)}
      >
        <SheetTitle className="sr-only">{typeof title === 'string' ? title : 'Record detail'}</SheetTitle>
        <SheetDescription className="sr-only">
          {typeof subtitle === 'string' ? subtitle : 'Record detail panel'}
        </SheetDescription>
        <div className="border-b px-6 pt-6 pb-4 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base leading-tight font-semibold text-foreground">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {status ? <div className="shrink-0">{status}</div> : null}
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-6 py-5">{children}</div>
        </ScrollArea>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t bg-background px-6 py-3">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

// Compact description list for record fields. Two-column on wider drawers.
export function DescriptionList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2', className)}>{children}</dl>
}

export function DescriptionItem({
  term,
  children,
  full,
}: {
  term: string
  children: ReactNode
  full?: boolean
}) {
  return (
    <div className={cn('min-w-0', full && 'sm:col-span-2')}>
      <dt className="text-xs font-medium text-muted-foreground">{term}</dt>
      <dd className="mt-0.5 text-sm break-words text-foreground">{children}</dd>
    </div>
  )
}

export function DrawerSection({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-6 first:mt-0', className)}>
      {title ? (
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  )
}
