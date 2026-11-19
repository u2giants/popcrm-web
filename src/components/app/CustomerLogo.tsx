import { useState } from 'react'
import { NameAvatar } from '@/components/app/NameAvatar'

// Brand mark for a customer. Compact token marks are fetched from logo.dev keyed
// on the customer's domain; full-width logos use a stored logoUrl when the API
// exposes one. Falls back to the name-initials avatar when no usable image exists.
//
// The token is a logo.dev *publishable* key (client-safe by design), supplied
// at build time via VITE_LOGODEV_TOKEN. When unset, every customer simply shows
// the initials avatar — nothing breaks.
export const LOGODEV_TOKEN = import.meta.env.VITE_LOGODEV_TOKEN as string | undefined

export function rootDomain(domain: string | null | undefined): string | null {
  if (!domain) return null
  const d = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
  return d.includes('.') ? d : null
}

export function logoDevImageUrl(
  value: string | null | undefined,
  {
    mode = 'domain',
    size,
    width,
    height,
    format = 'png',
    theme,
    fallback = '404',
  }: {
    mode?: 'domain' | 'name'
    size?: number
    width?: number
    height?: number
    format?: 'png' | 'jpg' | 'webp'
    theme?: 'light' | 'dark' | 'auto'
    fallback?: '404' | 'monogram'
  } = {},
): string | null {
  const raw = value?.trim()
  if (!LOGODEV_TOKEN || !raw) return null
  const target = mode === 'domain' ? rootDomain(raw) : raw
  if (!target) return null
  const params = new URLSearchParams({ token: LOGODEV_TOKEN, format, fallback })
  if (size) params.set('size', String(size))
  if (width) params.set('width', String(width))
  if (height) params.set('height', String(height))
  if (theme) params.set('theme', theme)
  const path = mode === 'name' ? `name/${encodeURIComponent(target)}` : encodeURIComponent(target)
  return `https://img.logo.dev/${path}?${params.toString()}`
}

export function CustomerLogo({
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
  // A failed load only rules out the URL that failed: a new domain or a newly
  // stored logo is a different URL and gets a fresh attempt (#59). Keying the
  // failure on the source URL is what resets it when the record changes.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const host = rootDomain(domain)
  const storedLogo = logoUrl?.trim()

  if (variant === 'full') {
    if (!storedLogo || failedSrc === storedLogo) {
      return <NameAvatar name={name} size={Math.min(height, size)} className={className} />
    }

    return (
      <img
        src={storedLogo}
        alt=""
        aria-hidden
        width={width}
        height={height}
        onError={() => setFailedSrc(storedLogo)}
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

  // An uploaded logo is an explicit human override, so it wins over whatever
  // logo.dev returns for the domain (and covers brands logo.dev doesn't know).
  const src = storedLogo || (LOGODEV_TOKEN && host
      ? logoDevImageUrl(host, { size: size * 2, format: 'png', fallback: '404' })
      : null)
  if (!src || failedSrc === src) {
    return <NameAvatar name={name} size={size} className={className} />
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      onError={() => setFailedSrc(src)}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        // Stored logos are wordmarks: contain them so they aren't cropped.
        objectFit: storedLogo ? 'contain' : 'cover',
        flexShrink: 0,
        background: 'var(--muted)',
        // Hairline ring so white logos stay visible on white cards.
        boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--border) 70%, transparent)',
      }}
    />
  )
}
