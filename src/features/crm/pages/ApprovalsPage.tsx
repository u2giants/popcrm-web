import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { ApprovalDrawer } from '@/features/crm/components/ApprovalDrawer'
import { formatDate, relatedName, textOf } from '@/features/crm/format'
import { listData, useApprovalsQuery } from '@/features/crm/queries'
import type { CrmLicensorApprovalThread } from '@/lib/types'

export function ApprovalsPage() {
  const approvalsQuery = useApprovalsQuery(-1)
  const approvals = listData(approvalsQuery.data)
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<CrmLicensorApprovalThread>('approval', approvals)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return approvals.filter(
      (a) => !q || textOf(a.name, a.property_name, a.licensor_comments, relatedName(a.opportunity)).includes(q),
    )
  }, [approvals, query])

  const columns: Column<CrmLicensorApprovalThread>[] = [
    {
      key: 'name',
      header: 'Approval',
      sortValue: (a) => (a.name || a.property_name || '').toLowerCase(),
      filterValue: (a) => a.name || a.property_name,
      className: 'w-full max-w-0',
      cell: (a) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{a.name || a.property_name || 'Approval'}</div>
          <div className="truncate text-xs text-muted-foreground">{a.licensor_comments}</div>
        </div>
      ),
    },
    {
      key: 'property_name',
      header: 'Licensor',
      hideBelow: 'md',
      sortValue: (a) => a.property_name ?? '',
      filterValue: (a) => a.property_name,
      cell: (a) => <span className="text-muted-foreground">{a.property_name || '—'}</span>,
    },
    {
      key: 'stage',
      header: 'Status',
      sortValue: (a) => a.stage ?? '',
      filterValue: (a) => a.stage,
      cell: (a) => <CrmStatusBadge kind="approval" status={a.stage} />,
    },
    {
      key: 'submitted_date',
      header: 'Submitted',
      hideBelow: 'lg',
      sortValue: (a) => a.submitted_date ?? '',
      filterValue: (a) => a.submitted_date,
      className: 'text-muted-foreground',
      cell: (a) => formatDate(a.submitted_date),
    },
    {
      key: 'opportunity',
      header: 'Program',
      hideBelow: 'xl',
      sortValue: (a) => relatedName(a.opportunity),
      filterValue: (a) => relatedName(a.opportunity),
      cell: (a) => <RelationLabel value={a.opportunity} />,
    },
    {
      key: 'licensor_comments',
      header: 'Latest comment',
      hideBelow: 'xl',
      sortValue: (a) => a.licensor_comments ?? '',
      filterValue: (a) => a.licensor_comments,
      className: 'max-w-[220px]',
      cell: (a) => (
        <span className="block truncate text-muted-foreground">
          {a.licensor_comments || '—'}
        </span>
      ),
    },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Approvals"
          subtitle="Licensor approval threads"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search name, property, comments…"
        />
      }
    >
      {approvalsQuery.isError ? (
        <ErrorState onRetry={() => void approvalsQuery.refetch()} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(a) => a.id}
          onRowClick={(a) => select(a)}
          loading={approvalsQuery.isPending}
          emptyIcon={<ShieldCheck className="size-5" />}
          emptyTitle="No approvals match"
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'submitted_date', dir: 'desc' }}
        />
      )}
      <ApprovalDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
