import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'

export interface DonutSlice {
  key: string
  name: string
  value: number
  color: string
}

// Donut chart with centered label and a simple legend list.
// size: diameter of the chart in px (default 132).
export function ChartDonut({
  data,
  centerLabel,
  centerSub,
  size = 132,
}: {
  data: DonutSlice[]
  centerLabel?: string
  centerSub?: string
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const inner = Math.round(size * 0.44)
  const outer = Math.round(size * 0.5)

  return (
    <div className="flex items-center gap-4">
      <div style={{ width: size, height: size, flexShrink: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={inner}
              outerRadius={outer}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centered label */}
        {centerLabel && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          >
            <span className="text-[18px] font-[700] tabular-nums leading-none text-foreground">
              {centerLabel}
            </span>
            {centerSub && (
              <span className="mt-[2px] text-[10px] text-muted-foreground">{centerSub}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex min-w-0 flex-col gap-[7px]">
        {data.map((slice) => (
          <div key={slice.key} className="flex items-center gap-[8px] text-[12px]">
            <span
              className="size-[9px] shrink-0 rounded-[3px]"
              style={{ background: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
            <span className="font-[650] tabular-nums text-foreground">
              {((slice.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
