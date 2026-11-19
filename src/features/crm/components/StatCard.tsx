import type { ReactNode } from 'react'

/**
 * The one drawer stat tile (#55): icon chip + count + label. Extracted from
 * the CustomerDrawer and DepartmentDrawer copies so they cannot drift apart.
 */
export function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: ReactNode
  iconColor: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-[10px] rounded-[9px] border bg-muted/30 px-[12px] py-[10px]">
      <span
        className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px]"
        style={{
          background: `color-mix(in oklch, ${iconColor} 15%, transparent)`,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <div>
        <div className="text-[18px] font-[700] leading-none tabular-nums text-foreground">{value}</div>
        <div className="mt-[2px] text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
