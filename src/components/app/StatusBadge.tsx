import { cn } from '@/lib/utils'
import type { StatusTone } from '@/features/crm/constants'

// Tone → token-driven classes. Status uses both color and text (a11y: color is
// never the only signal). Tones map onto the shared design tokens.
const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-stage-dev text-stage-dev-fg',
  success: 'bg-stage-approved text-stage-approved-fg',
  warning: 'bg-stage-onhold text-stage-onhold-fg',
  danger: 'bg-destructive/12 text-destructive',
}

export function StatusBadge({
  tone = 'neutral',
  children,
  className,
  dot = true,
}: {
  tone?: StatusTone
  children: React.ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  )
}
