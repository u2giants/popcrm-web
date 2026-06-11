import { relatedName } from '@/features/crm/format'
import { cn } from '@/lib/utils'

// Renders a Directus relation's display name (or an em dash), truncating long
// values. Muted when empty so unset relations recede visually.
export function RelationLabel({
  value,
  className,
  muted = true,
}: {
  value: Parameters<typeof relatedName>[0]
  className?: string
  muted?: boolean
}) {
  const name = relatedName(value)
  const empty = name === '—'
  return (
    <span className={cn('truncate', empty && muted && 'text-muted-foreground', className)}>
      {name}
    </span>
  )
}
