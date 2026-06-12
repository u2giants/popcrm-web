import { StatusBadge } from '@/components/app/StatusBadge'
import { Badge } from '@/components/ui/badge'
import {
  approvalTone,
  CHAIN_HUE,
  routingTone,
  stageChipClass,
  taskTone,
} from '@/features/crm/constants'
import { label } from '@/features/crm/format'
import { cn } from '@/lib/utils'

type Kind = 'routing' | 'task' | 'approval'

const TONE: Record<Kind, (status: string | null | undefined) => ReturnType<typeof routingTone>> = {
  routing: routingTone,
  task: taskTone,
  approval: approvalTone,
}

// CRM status → token-driven badge. `kind` selects the tone mapping.
export function CrmStatusBadge({
  kind,
  status,
  dot = true,
}: {
  kind: Kind
  status: string | null | undefined
  dot?: boolean
}) {
  return (
    <StatusBadge tone={TONE[kind](status)} dot={dot}>
      {label(status)}
    </StatusBadge>
  )
}

// Chain-type chip with a per-value OKLCH hue (soft tint background + readable
// foreground). Hues live in constants.CHAIN_HUE.
export function ChainBadge({ chain }: { chain: string | null | undefined }) {
  if (!chain) return <span className="text-muted-foreground">—</span>
  const h = CHAIN_HUE[chain] ?? 250
  return (
    <span
      className="inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: `color-mix(in oklch, oklch(0.68 0.15 ${h}) 18%, transparent)`,
        color: `oklch(0.48 0.13 ${h})`,
      }}
    >
      {label(chain)}
    </span>
  )
}

// Pipeline stage chip, colored from the shared stage tokens.
export function StageBadge({ stage }: { stage: string | null | undefined }) {
  return (
    <Badge
      variant="secondary"
      className={cn('border-transparent', stageChipClass(stage))}
    >
      {label(stage)}
    </Badge>
  )
}
