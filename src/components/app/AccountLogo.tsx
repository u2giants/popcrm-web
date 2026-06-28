import { useState } from 'react'
import { NameAvatar } from '@/components/app/NameAvatar'

// Brand mark for a customer. Compact token marks are fetched from logo.dev keyed
// on the customer's domain; full-width logos use a stored logoUrl when the API
// exposes one. Falls back to the name-initials avatar when no usable image exists.
//
// The token is a logo.dev *publishable* key (client-safe by design), supplied
// at build time via VITE_LOGODEV_TOKEN. When unset, every customer simply shows
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
  logoUrl,
  size = 24,
  variant = 'token',
  width = 92,
  height = 24,
  className,
}: {
  name: string | null | undefined
  domain: string | null | undefined
  logoUrl?: string | null | undefined
  size?: number
  variant?: 'token' | 'full'
  width?: number
  height?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const host = rootDomain(domain)
  const storedLogo = logoUrl?.trim()

  if (variant === 'full') {
    if (!storedLogo || failed) {
      return <NameAvatar name={name} size={Math.min(height, size)} className={className} />
    }

    return (
      <img
        src={storedLogo}
        alt=""
        aria-hidden
        width={width}
        height={height}
        onError={() => setFailed(true)}
        className={className}
        style={{
          width,
          height,
          maxWidth: '100%',
          objectFit: 'contain',
          objectPosition: 'left center',
          flexShrink: 0,
        }}
      />
    )
  }

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
