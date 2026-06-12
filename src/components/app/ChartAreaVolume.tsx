import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface AreaSeries {
  label: string
  [key: string]: string | number
}

// Two-line area chart for volume over time (e.g. total vs routed email volume).
// Renders a gradient-filled primary area + a dashed secondary line.
export function ChartAreaVolume({
  data,
  primaryKey,
  secondaryKey,
  height = 150,
}: {
  data: AreaSeries[]
  primaryKey: string
  secondaryKey?: string
  height?: number
}) {
  const id = `area-${useId().replace(/:/g, '')}`

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: 6 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="2 4"
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            fontSize: 12,
            boxShadow: 'var(--shadow-md)',
          }}
          labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
          itemStyle={{ color: 'var(--muted-foreground)' }}
        />
        <Area
          type="monotone"
          dataKey={primaryKey}
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill={`url(#${id})`}
          dot={false}
          activeDot={{ r: 3, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
        />
        {secondaryKey && (
          <Area
            type="monotone"
            dataKey={secondaryKey}
            stroke="var(--chart-3)"
            strokeWidth={2}
            strokeDasharray="4 3"
            fill="none"
            dot={false}
            activeDot={{ r: 3, fill: 'var(--chart-3)', stroke: 'var(--card)', strokeWidth: 2 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
