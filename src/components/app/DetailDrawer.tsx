import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Standard 480px right-hand inspector. Slide-in animation is handled by shadcn Sheet.
// Header: badge cluster + title + optional subtitle.
// Body: scrollable.
// Footer: sticky, muted bg, primary action right-aligned.
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
      <SheetContent className={cn('flex w-full flex-col gap-0 p-0 sm:max-w-[480px]', className)}>
        <SheetTitle className="sr-only">
          {typeof title === 'string' ? title : 'Record detail'}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {typeof subtitle === 'string' ? subtitle : 'Record detail panel'}
        </SheetDescription>

        {/* Header */}
        <div className="shrink-0 border-b px-[18px] pb-[13px] pt-[16px] pr-[48px]">
          {status ? <div className="mb-[6px] flex flex-wrap items-center gap-[6px]">{status}</div> : null}
          <h2 className="text-[16px] font-[650] leading-tight tracking-[-0.01em] text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-[3px] text-[12px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {/* Scrollable body */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-[18px] py-[16px]">{children}</div>
        </ScrollArea>

        {/* Sticky footer */}
        {footer ? (
          <div className="flex shrink-0 items-center justify-end gap-[9px] border-t bg-muted px-[18px] py-[13px]">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

// Description list for record fields — 2-col grid inside the drawer.
export function DescriptionList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl className={cn('grid grid-template-cols-[116px_1fr] gap-x-[14px] gap-y-[9px]', className)}>
      {children}
    </dl>
  )
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
    <div className={cn('min-w-0', full && 'col-span-2')}>
      <dt className="text-[12px] text-muted-foreground">{term}</dt>
      <dd className="mt-0.5 break-words text-[12.5px] font-[500] text-foreground">{children}</dd>
    </div>
  )
}

export function DrawerSection({
  title,
  icon,
  children,
  className,
}: {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-[18px] first:mt-0', className)}>
      {title ? (
        <h3 className="mb-[9px] flex items-center gap-[7px] text-[11.5px] font-[650] tracking-[0.01em] text-foreground">
          {icon ? <span className="size-[14px] text-muted-foreground">{icon}</span> : null}
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  )
}
