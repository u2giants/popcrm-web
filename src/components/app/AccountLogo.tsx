import { useState } from 'react'
import { NameAvatar } from '@/components/app/NameAvatar'

// Brand logo for an account, fetched from logo.dev keyed on the account's
// domain (the same domain-derived approach Twenty used). Falls back to the
// name-initials avatar when there is no domain, no API token, or the image
// fails to load.
//
// The token is a logo.dev *publishable* key (client-safe by design), supplied
// at build time via VITE_LOGODEV_TOKEN. When unset, every account simply shows
// the initials avatar — nothing breaks.
const LOGODEV_TOKEN = import.meta.env.VITE_LOGODEV_TOKEN as string | undefined

function rootDomain(domain: string | null | undefined): string | null {
  if (!domain) return null
  const d = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
  return d.includes('.') ? d : null
}

export function AccountLogo({
  name,
  domain,
  size = 24,
  className,
}: {
  name: string | null | undefined
  domain: string | null | undefined
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const host = rootDomain(domain)

  if (!LOGODEV_TOKEN || !host || failed) {
    return <NameAvatar name={name} size={size} className={className} />
  }

  const src = `https://img.logo.dev/${host}?token=${LOGODEV_TOKEN}&size=${size * 2}&format=png&retries=0`

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        background: 'var(--muted)',
        // Hairline ring so white logos stay visible on white cards.
        boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--border) 70%, transparent)',
      }}
    />
  )
}
