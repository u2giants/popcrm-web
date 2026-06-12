// Horizontal bar chart — pipeline by stage, routing distribution, etc.
// Pure CSS/flex: no Recharts overhead for a simple ranked list.
export interface HBarItem {
  label: string
  value: number
  color?: string
}

export function ChartHBar({ data, max }: { data: HBarItem[]; max?: number }) {
  const m = max ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex flex-col gap-[9px]">
      {data.map((item, i) => (
        <div
          key={i}
          className="grid items-center gap-[10px]"
          style={{ gridTemplateColumns: '128px 1fr 34px' }}
        >
          <span className="truncate text-[11.5px] text-muted-foreground">{item.label}</span>
          <div className="h-[9px] overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${(item.value / m) * 100}%`,
                background: item.color ?? 'var(--chart-1)',
                transitionTimingFunction: 'cubic-bezier(.22,.61,.36,1)',
              }}
            />
          </div>
          <span className="text-right text-[12px] font-[650] tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
