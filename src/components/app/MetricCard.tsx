import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Token-themed KPI card. Compact, dense, no nested cards. Optionally clickable
// to navigate to the relevant page.
export function MetricCard({
  label,
  value,
  icon,
  hint,
  tone = 'default',
  onClick,
  className,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: string
  tone?: 'default' | 'accent' | 'danger'
  onClick?: () => void
  className?: string
}) {
  const interactive = !!onClick
  const Comp = interactive ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors',
        interactive && 'hover:border-primary/40 hover:bg-accent/40',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon ? (
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-md',
              tone === 'danger'
                ? 'bg-destructive/12 text-destructive'
                : tone === 'accent'
                  ? 'bg-primary/12 text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            'text-2xl font-semibold tracking-tight tabular-nums',
            tone === 'danger' ? 'text-destructive' : 'text-foreground',
          )}
        >
          {value}
        </span>
        {interactive ? (
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </div>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </Comp>
  )
}
