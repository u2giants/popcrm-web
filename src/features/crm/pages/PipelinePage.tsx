import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { FilterSelect } from '@/components/app/FilterSelect'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ErrorState, CardGridSkeleton } from '@/components/app/states'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { OpportunityModal } from '@/features/crm/components/OpportunityModal'
import { OPPORTUNITY_STAGES, stageChipClass } from '@/features/crm/constants'
import { idOf, label, relatedName, textOf, formatDate } from '@/features/crm/format'
import { uniqueValues } from '@/features/crm/pages/_shared'
import { cn } from '@/lib/utils'
import type { CrmOpportunity } from '@/lib/types'

function fmtAmount(val: string | number | null | undefined): string | null {
  if (val == null || val === '') return null
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return null
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

export function PipelinePage() {
  const { opportunities, retailers, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [retailer, setRetailer] = useState('')
  const [program, setProgram] = useState('')
  const [division, setDivision] = useState('')
  const [selected, select] = useRecordSelection<CrmOpportunity>('opportunity', opportunities)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return opportunities.filter(
      (o) =>
        (!q || textOf(o.name, relatedName(o.retailer), relatedName(o.department), o.production_po_number, o.sales_order_number).includes(q)) &&
        (!retailer || idOf(o.retailer) === retailer) &&
        (!program || o.program_type === program) &&
        (!division || o.division === division),
    )
  }, [opportunities, query, retailer, program, division])

  const grouped = useMemo(
    () =>
      OPPORTUNITY_STAGES.map((stage) => ({
        stage,
        rows: filtered.filter((o) => (o.stage || OPPORTUNITY_STAGES[0]) === stage),
      })),
    [filtered],
  )

  return (
    <AppPage
      scroll={false}
      listBar={
        <ListBar
          title="Pipeline"
          subtitle="Program opportunities by stage"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search name, retailer, PO, SO…"
          showClear={!!(retailer || program || division)}
          onClear={() => { setRetailer(''); setProgram(''); setDivision('') }}
          filters={
            <>
              <FilterSelect
                value={retailer}
                onChange={setRetailer}
                allLabel="All accounts"
                placeholder="Account"
                options={retailers.map((r) => ({ value: r.id, label: r.name }))}
              />
              <FilterSelect
                value={program}
                onChange={setProgram}
                allLabel="All program types"
                placeholder="Program"
                options={uniqueValues(opportunities, (o) => o.program_type)}
              />
              <FilterSelect
                value={division}
                onChange={setDivision}
                allLabel="All divisions"
                placeholder="Division"
                options={uniqueValues(opportunities, (o) => o.division)}
              />
            </>
          }
        />
      }
    >
      {error ? (
        <div className="p-6">
          <ErrorState onRetry={refresh} />
        </div>
      ) : loading ? (
        <div className="p-6">
          <CardGridSkeleton count={8} />
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="flex h-full gap-3 p-4 sm:px-6 lg:px-8">
            {grouped.map((group) => (
              <section
                key={group.stage}
                className="flex w-[272px] shrink-0 flex-col rounded-[12px] border bg-muted/30"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-[12px] border-b bg-card/95 px-[12px] py-[10px] backdrop-blur">
                  <span className={cn('rounded-full px-[8px] py-[3px] text-[11px] font-[600]', stageChipClass(group.stage))}>
                    {label(group.stage)}
                  </span>
                  <span className="rounded-full bg-muted px-[7px] py-[1.5px] text-[11px] tabular-nums text-muted-foreground">
                    {group.rows.length}
                  </span>
                </div>
                <div className="flex flex-col gap-[7px] p-[8px]">
                  {group.rows.length === 0 ? (
                    <div className="rounded-[8px] border border-dashed p-3 text-center text-[11.5px] text-muted-foreground">
                      No programs
                    </div>
                  ) : null}
                  {group.rows.map((opp) => (
                    <OppCard key={opp.id} opp={opp} onClick={() => select(opp)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      )}

      <OpportunityModal row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}

function OppCard({ opp, onClick }: { opp: CrmOpportunity; onClick: () => void }) {
  const amount = fmtAmount(opp.amount)
  const closeDate = formatDate(opp.close_date)
  const hasFooter = !!(amount || closeDate)

  return (
    <button
      onClick={onClick}
      className="rounded-[9px] border bg-card text-left shadow-[var(--shadow-xs)] transition-all hover:border-primary/30 hover:shadow-[var(--shadow-sm)]"
    >
      <div className="p-[11px]">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-[12.5px] font-[500] text-foreground">
            {opp.name || 'Untitled program'}
          </span>
          {opp.ai_summary ? (
            <Sparkles className="mt-0.5 size-[13px] shrink-0 text-primary" />
          ) : null}
        </div>
        <div className="mt-[7px] space-y-[3px] text-[11.5px] text-muted-foreground">
          <div className="truncate">{relatedName(opp.retailer)}</div>
          {relatedName(opp.department) !== '—' ? (
            <div className="truncate">{relatedName(opp.department)}</div>
          ) : null}
          {opp.production_po_number || opp.sales_order_number ? (
            <div className="truncate font-mono text-[11px] text-foreground/50">
              {opp.production_po_number || opp.sales_order_number}
            </div>
          ) : null}
        </div>
      </div>
      {hasFooter ? (
        <div className="flex items-center justify-between gap-2 border-t px-[11px] py-[7px]">
          {amount ? (
            <span className="text-[12px] font-[650] tabular-nums text-foreground">{amount}</span>
          ) : <span />}
          {closeDate ? (
            <span className="text-[10.5px] text-muted-foreground">{closeDate}</span>
          ) : null}
        </div>
      ) : null}
    </button>
  )
}
