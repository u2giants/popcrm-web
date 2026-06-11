import { StatusBadge } from '@/components/app/StatusBadge'
import { Badge } from '@/components/ui/badge'
import {
  approvalTone,
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
