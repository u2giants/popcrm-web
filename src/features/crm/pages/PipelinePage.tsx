import { useMemo, useState } from 'react'
import { LayoutGrid, List, Route, Sparkles } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { FilterSelect } from '@/components/app/FilterSelect'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ErrorState, CardGridSkeleton } from '@/components/app/states'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import { OpportunityModal } from '@/features/crm/components/OpportunityModal'
import { StageBadge } from '@/features/crm/components/CrmStatusBadge'
import { OPPORTUNITY_STAGES, stageChipClass } from '@/features/crm/constants'
import { idOf, label, relatedName, textOf, formatDate } from '@/features/crm/format'
import { uniqueValues, customerPickerOptions, buildRetailerById } from '@/features/crm/pages/_shared'
import { cn } from '@/lib/utils'
import { listData, useOpportunitiesQuery, useCustomerPickerQuery } from '@/features/crm/queries'
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
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const retailersQuery = useCustomerPickerQuery(-1)
  const opportunities = listData(opportunitiesQuery.data)
  const retailers = listData(retailersQuery.data)
  const [query, setQuery] = useState('')
  const [retailer, setRetailer] = useState('')
  const [program, setProgram] = useState('')
  const [division, setDivision] = useState('')
  const [view, setView] = useState<'board' | 'list'>('board')
  const [selected, select] = useRecordSelection<CrmOpportunity>('opportunity', opportunities)
  const retailerById = useMemo(() => buildRetailerById(retailers), [retailers])

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

  const listColumns: Column<CrmOpportunity>[] = [
    {
      key: 'name',
      header: 'Program',
      sortValue: (o) => o.name?.toLowerCase() ?? '',
      filterValue: (o) => o.name,
      className: 'w-full max-w-0',
      cell: (o) => (
        <div className="flex min-w-0 items-center gap-[8px]">
          <div className="min-w-0">
            <div className="truncate font-[500] text-foreground">{o.name || 'Untitled program'}</div>
            {o.season_year ? (
              <div className="truncate text-[11px] text-muted-foreground">{o.season_year}</div>
            ) : null}
          </div>
          {o.ai_summary ? <Sparkles className="size-[12px] shrink-0 text-primary" /> : null}
        </div>
      ),
    },
    {
      key: 'retailer',
      header: 'Customer',
      hideBelow: 'md',
      sortValue: (o) => relatedName(o.retailer),
      filterValue: (o) => relatedName(o.retailer),
      cell: (o) => <CustomerRelationLogo value={o.retailer} customerById={retailerById} size={24} variant="token-name" />,
    },
    {
      key: 'stage',
      header: 'Stage',
      sortValue: (o) => o.stage ?? '',
      filterValue: (o) => label(o.stage),
      cell: (o) => <StageBadge stage={o.stage} />,
    },
    {
      key: 'amount',
      header: 'Est. value',
      hideBelow: 'lg',
      sortValue: (o) => {
        const n = typeof o.amount === 'string' ? parseFloat(o.amount.replace(/[^0-9.-]/g, '')) : Number(o.amount ?? 0)
        return isFinite(n) ? n : 0
      },
      filterValue: (o) => fmtAmount(o.amount) ?? '',
      className: 'text-right tabular-nums font-[650]',
      cell: (o) => fmtAmount(o.amount) ?? '—',
    },
    {
      key: 'close_date',
      header: 'Close',
      hideBelow: 'xl',
      sortValue: (o) => o.close_date ?? '',
      filterValue: (o) => o.close_date,
      className: 'text-muted-foreground',
      cell: (o) => formatDate(o.close_date),
    },
  ]

  const viewToggle = (
    <div className="flex h-[32px] overflow-hidden rounded-[8px] border">
      <button
        type="button"
        onClick={() => setView('board')}
        className={cn(
          'flex items-center gap-[5px] px-[9px] text-[12px] transition-colors',
          view === 'board' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent',
        )}
      >
        <LayoutGrid className="size-[13px]" /> Board
      </button>
      <button
        type="button"
        onClick={() => setView('list')}
        className={cn(
          'flex items-center gap-[5px] border-l px-[9px] text-[12px] transition-colors',
          view === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent',
        )}
      >
        <List className="size-[13px]" /> List
      </button>
    </div>
  )

  return (
    <AppPage
      scroll={view === 'list'}
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
                allLabel="All customers"
                placeholder="Customer"
                options={customerPickerOptions(retailers, retailer)}
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
          actions={viewToggle}
        />
      }
    >
      {opportunitiesQuery.isError ? (
        <div className="p-6">
          <ErrorState onRetry={() => void opportunitiesQuery.refetch()} />
        </div>
      ) : opportunitiesQuery.isPending || retailersQuery.isPending ? (
        <div className="p-6">
          <CardGridSkeleton count={8} />
        </div>
      ) : view === 'list' ? (
        <DataTable
          rows={filtered}
          columns={listColumns}
          getRowId={(o) => o.id}
          onRowClick={(o) => select(o)}
          emptyIcon={<Route className="size-5" />}
          emptyTitle="No programs match"
          emptyDescription="Adjust your search or filters."
          initialSort={{ key: 'stage', dir: 'asc' }}
        />
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
