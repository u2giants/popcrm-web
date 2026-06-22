import { useMemo, useState } from 'react'
import { Route } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { OpportunityModal } from '@/features/crm/components/OpportunityModal'
import { StageBadge } from '@/features/crm/components/CrmStatusBadge'
import { formatDate, label, relatedName, textOf } from '@/features/crm/format'
import { listData, useOpportunitiesQuery } from '@/features/crm/queries'
import type { CrmOpportunity } from '@/lib/types'

function fmtAmount(val: string | number | null | undefined): string | null {
  if (val == null || val === '') return null
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return null
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

export function ProgramsPage() {
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const opportunities = listData(opportunitiesQuery.data)
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<CrmOpportunity>('opportunity', opportunities)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return opportunities.filter(
      (o) =>
        !q ||
        textOf(
          o.name,
          o.program_type,
          o.division,
          o.production_po_number,
          o.sales_order_number,
          relatedName(o.retailer),
          relatedName(o.department),
        ).includes(q),
    )
  }, [opportunities, query])

  const columns: Column<CrmOpportunity>[] = [
    {
      key: 'name',
      header: 'Program',
      opensDetail: true,
      sortValue: (o) => o.name?.toLowerCase() ?? '',
      filterValue: (o) => o.name,
      className: 'w-full max-w-0',
      cell: (o) => (
        <div className="min-w-0">
          <div className="truncate font-[500] text-foreground">{o.name || 'Untitled program'}</div>
          {o.program_type ? (
            <div className="truncate text-[11px] text-muted-foreground">{label(o.program_type)}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'retailer',
      header: 'Account',
      sortValue: (o) => relatedName(o.retailer),
      filterValue: (o) => relatedName(o.retailer),
      cell: (o) => <RelationLabel value={o.retailer} />,
    },
    {
      key: 'department',
      header: 'Department',
      hideBelow: 'lg',
      sortValue: (o) => relatedName(o.department),
      filterValue: (o) => relatedName(o.department),
      cell: (o) => <RelationLabel value={o.department} />,
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

  return (
    <AppPage
      listBar={
        <ListBar
          title="Programs"
          subtitle="Customer programs"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search name, account, PO, SO…"
        />
      }
    >
      {opportunitiesQuery.isError ? (
        <ErrorState onRetry={() => void opportunitiesQuery.refetch()} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(o) => o.id}
          onRowClick={(o) => select(o)}
          loading={opportunitiesQuery.isPending}
          emptyIcon={<Route className="size-5" />}
          emptyTitle="No programs match"
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'stage', dir: 'asc' }}
        />
      )}
      <OpportunityModal row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
