import { useId, type ReactNode } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Tiny inline sparkline – absolutely positioned bottom-right corner of the card.
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const id = `spk-${useId().replace(/:/g, '')}`
  if (points.length < 2) return null
  const w = 74, h = 30
  const min = Math.min(...points)
  const max = Math.max(...points)
  const rng = max - min || 1
  const x = (i: number) => (i / (points.length - 1)) * w
  const y = (v: number) => h - 3 - ((v - min) / rng) * (h - 6)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ')
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="pointer-events-none absolute right-0 bottom-0 opacity-55"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const DELTA_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

export function MetricCard({
  label,
  value,
  icon,
  hint,
  tone = 'default',
  onClick,
  className,
  delta,
  deltaDir = 'flat',
  spark,
  iconColor,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: string
  tone?: 'default' | 'accent' | 'danger'
  onClick?: () => void
  className?: string
  delta?: string
  deltaDir?: 'up' | 'down' | 'flat'
  spark?: number[]
  iconColor?: string
}) {
  const interactive = !!onClick
  const Comp = interactive ? 'button' : 'div'

  // Sparkline + delta chip color: danger tone uses destructive hue, accent uses primary, else chart-1
  const sparkColor =
    tone === 'danger'
      ? 'var(--destructive)'
      : iconColor ?? (tone === 'accent' ? 'var(--primary)' : 'var(--chart-1)')

  const DeltaIcon = DELTA_ICON[deltaDir]

  return (
    <Comp
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-[6px] overflow-hidden rounded-[12px] border bg-card p-[11px_13px] text-left transition-all duration-[120ms]',
        interactive && 'hover:border-primary/40 hover:shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {/* Top row: label + icon tile */}
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-[550] text-muted-foreground">{label}</span>
        {icon ? (
          <span
            className={cn(
              'flex size-[26px] items-center justify-center rounded-[7px]',
              !iconColor &&
                (tone === 'danger'
                  ? 'bg-destructive/12 text-destructive'
                  : tone === 'accent'
                    ? 'bg-primary/12 text-primary'
                    : 'bg-muted text-muted-foreground'),
            )}
            style={
              iconColor
                ? {
                    background: `color-mix(in oklch, ${iconColor} 15%, transparent)`,
                    color: iconColor,
                  }
                : undefined
            }
          >
            {icon}
          </span>
        ) : null}
      </div>

      {/* Value */}
      <div
        className={cn(
          'text-[23px] font-[680] leading-none tracking-[-0.025em] tabular-nums',
          tone === 'danger' ? 'text-destructive' : 'text-foreground',
        )}
      >
        {value}
      </div>

      {/* Footer: delta chip + hint */}
      <div className="flex items-center gap-[6px] text-[11px] text-muted-foreground">
        {delta != null && (
          <span
            className={cn(
              'inline-flex items-center gap-[2px] rounded-[5px] px-[5px] py-[1px] text-[11px] font-[650]',
              deltaDir === 'up' && 'bg-chip-success text-chip-success-fg',
              deltaDir === 'down' && 'bg-chip-danger text-chip-danger-fg',
              deltaDir === 'flat' && 'bg-muted text-muted-foreground',
            )}
          >
            <DeltaIcon className="size-[11px]" />
            {delta}
          </span>
        )}
        {hint ? <span>{hint}</span> : null}
      </div>

      {/* Sparkline */}
      {spark && spark.length >= 2 ? <Sparkline points={spark} color={sparkColor} /> : null}
    </Comp>
  )
}
