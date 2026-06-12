// Circular avatar derived purely from a name — no external images needed.
// Hue is derived from a simple hash of the name string so the same name
// always gets the same color across renders and sessions.
function nameHue(name: string | null | undefined): number {
  if (!name) return 220
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) & 0xffff
  }
  return h % 360
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function NameAvatar({
  name,
  size = 24,
  className,
}: {
  name: string | null | undefined
  size?: number
  className?: string
}) {
  const hue = nameHue(name)
  const bg = `oklch(0.88 0.07 ${hue})`
  const color = `oklch(0.42 0.14 ${hue})`
  const fontSize = Math.round(size * 0.42)

  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color,
        fontSize,
        fontWeight: 650,
        flexShrink: 0,
        letterSpacing: '-0.01em',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {initials(name)}
    </span>
  )
}
