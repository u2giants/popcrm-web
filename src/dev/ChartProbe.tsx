// Dev-only visual probe for the three chart primitives. It renders them with
// fixture data at a fixed size so a Recharts upgrade can be verified in a real
// browser without any Supabase session. Not routed in production builds.
import { ChartAreaVolume } from '@/components/app/ChartAreaVolume'
import { ChartDonut } from '@/components/app/ChartDonut'
import { ChartHBar } from '@/components/app/ChartHBar'

const VOLUME = [
  { label: '5/28', ingested: 12, routed: 5 },
  { label: '6/4', ingested: 30, routed: 18 },
  { label: '6/11', ingested: 22, routed: 20 },
  { label: '6/18', ingested: 41, routed: 12 },
  { label: '6/25', ingested: 8, routed: 8 },
  { label: '7/2', ingested: 55, routed: 31 },
]

const SLICES = [
  { key: 'ROUTED', name: 'Routed', value: 120, color: 'var(--chart-3)' },
  { key: 'COMPANY_ONLY', name: 'Company only', value: 107, color: 'var(--chart-1)' },
  { key: 'COMPANY_DEPT', name: 'Company + dept', value: 70, color: 'var(--chart-2)' },
  { key: 'UNROUTED', name: 'Unrouted', value: 295, color: 'var(--chart-4)' },
]

const BARS = [
  { label: 'Directive received', value: 4 },
  { label: 'Design in progress', value: 9 },
  { label: 'Buyer review', value: 2 },
  { label: 'Closed', value: 0 },
]

export function ChartProbe() {
  return (
    <div className="space-y-5 p-6">
      <div className="rounded-[12px] border bg-card p-5">
        <p className="mb-3 text-[13px] font-[650]">Email volume</p>
        <ChartAreaVolume data={VOLUME} primaryKey="ingested" secondaryKey="routed" height={150} />
      </div>
      <div className="rounded-[12px] border bg-card p-5">
        <p className="mb-3 text-[13px] font-[650]">Routing health</p>
        <ChartDonut data={SLICES} centerLabel="20%" centerSub="routed" />
      </div>
      <div className="rounded-[12px] border bg-card p-5">
        <p className="mb-3 text-[13px] font-[650]">Pipeline distribution</p>
        <ChartHBar data={BARS} />
      </div>
    </div>
  )
}
