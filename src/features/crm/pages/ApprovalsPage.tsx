import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { AppPage } from '@/components/app/AppPage'
import { PageToolbar } from '@/components/app/PageToolbar'
import { FilterSelect } from '@/components/app/FilterSelect'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/app/states'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { ApprovalDrawer } from '@/features/crm/components/ApprovalDrawer'
import { formatDate, relatedName, textOf } from '@/features/crm/format'
import { uniqueValues } from '@/features/crm/pages/_shared'
import type { CrmLicensorApprovalThread } from '@/lib/types'

export function ApprovalsPage() {
  const { approvals, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [licensor, setLicensor] = useState('')
  const [selected, select] = useRecordSelection<CrmLicensorApprovalThread>('approval', approvals)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return approvals.filter(
      (a) =>
        (!q || textOf(a.name, a.licensor_name, a.latest_comment, relatedName(a.opportunity)).includes(q)) &&
        (!status || a.approval_status === status) &&
        (!licensor || a.licensor_name === licensor),
    )
  }, [approvals, query, status, licensor])

  const columns: Column<CrmLicensorApprovalThread>[] = [
    {
      key: 'name',
      header: 'Approval',
      sortValue: (a) => (a.name || a.licensor_name || '').toLowerCase(),
      className: 'w-full max-w-0',
      cell: (a) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{a.name || a.licensor_name || 'Approval'}</div>
          <div className="truncate text-xs text-muted-foreground">{a.latest_comment}</div>
        </div>
      ),
    },
    {
      key: 'licensor_name',
      header: 'Licensor',
      hideBelow: 'md',
      sortValue: (a) => a.licensor_name ?? '',
      cell: (a) => <span className="text-muted-foreground">{a.licensor_name || '—'}</span>,
    },
    {
      key: 'opportunity',
      header: 'Opportunity',
      hideBelow: 'lg',
      sortValue: (a) => relatedName(a.opportunity),
      cell: (a) => <RelationLabel value={a.opportunity} />,
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      hideBelow: 'xl',
      sortValue: (a) => a.submitted_at ?? '',
      className: 'text-muted-foreground',
      cell: (a) => formatDate(a.submitted_at),
    },
    {
      key: 'approval_status',
      header: 'Status',
      sortValue: (a) => a.approval_status ?? '',
      cell: (a) => <CrmStatusBadge kind="approval" status={a.approval_status} />,
    },
  ]

  return (
    <AppPage
      title="Approvals"
      description="Licensor approval threads and their status."
      actions={<Badge variant="outline">{filtered.length.toLocaleString()} shown</Badge>}
      toolbar={
        <PageToolbar
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search name, licensor, comment…"
          showClear={!!(status || licensor)}
          onClear={() => { setStatus(''); setLicensor('') }}
          filters={
            <>
              <FilterSelect
                value={status}
                onChange={setStatus}
                allLabel="All statuses"
                placeholder="Status"
                options={uniqueValues(approvals, (a) => a.approval_status)}
              />
              <FilterSelect
                value={licensor}
                onChange={setLicensor}
                allLabel="All licensors"
                placeholder="Licensor"
                options={uniqueValues(approvals, (a) => a.licensor_name)}
              />
            </>
          }
        />
      }
    >
      {error ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(a) => a.id}
          onRowClick={(a) => select(a)}
          loading={loading}
          emptyIcon={<ShieldCheck className="size-5" />}
          emptyTitle="No approvals match"
          emptyDescription="Adjust your search or filters."
          initialSort={{ key: 'submitted_at', dir: 'desc' }}
        />
      )}
      <ApprovalDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
