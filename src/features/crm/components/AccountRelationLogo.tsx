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
  logo_url?: string | null
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

function relationLogoUrl(value: RelationValue): string | null {
  if (!value || typeof value === 'string' || !('logo_url' in value)) return null
  return (value.logo_url as string | null | undefined) ?? null
}

export function AccountRelationLogo({
  value,
  accountById,
  size = 24,
  variant = 'full',
  width = 92,
  height = 24,
  className,
}: {
  value: RelationValue
  accountById?: Map<string, Retailer>
  size?: number
  variant?: 'full' | 'token' | 'token-name'
  width?: number
  height?: number
  className?: string
}) {
  const account = accountById?.get(relationId(value))
  const name = relatedName(account ?? value)
  if (name === '—') {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }

  const domain = relationDomain(value) ?? account?.domain ?? null
  const logoUrl = relationLogoUrl(value) ?? account?.logo_url ?? null
  const logoVariant = variant === 'full' && logoUrl ? 'full' : 'token'

  return (
    <span
      className={cn('inline-flex min-w-0 items-center align-middle', variant === 'token-name' && 'gap-2', className)}
      title={name}
      aria-label={name}
    >
      <AccountLogo
        name={name}
        domain={domain}
        logoUrl={logoUrl}
        size={size}
        variant={logoVariant}
        width={width}
        height={height}
      />
      {variant === 'token-name' ? (
        <span className="min-w-0 truncate font-[500] text-foreground">{name}</span>
      ) : (
        <span className="sr-only">{name}</span>
      )}
    </span>
  )
}
