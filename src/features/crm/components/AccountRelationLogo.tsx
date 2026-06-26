import { AccountLogo } from '@/components/app/AccountLogo'
import { relatedName } from '@/features/crm/format'
import type { Retailer } from '@/lib/types'
import { cn } from '@/lib/utils'

type RelationValue = Parameters<typeof relatedName>[0] | {
  id?: string
  name?: string | null
  title?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  domain?: string | null
}

function relationDomain(value: RelationValue): string | null {
  if (!value || typeof value === 'string' || !('domain' in value)) return null
  return (value.domain as string | null | undefined) ?? null
}

function relationId(value: RelationValue): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return 'id' in value ? value.id ?? '' : ''
}

export function AccountRelationLogo({
  value,
  accountById,
  size = 24,
  className,
}: {
  value: RelationValue
  accountById?: Map<string, Retailer>
  size?: number
  className?: string
}) {
  const account = accountById?.get(relationId(value))
  const name = relatedName(account ?? value)
  if (name === '—') {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }

  const domain = relationDomain(value) ?? account?.domain ?? null

  return (
    <span
      className={cn('inline-flex items-center align-middle', className)}
      title={name}
      aria-label={name}
    >
      <AccountLogo name={name} domain={domain} size={size} />
      <span className="sr-only">{name}</span>
    </span>
  )
}
