import { useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { DepartmentDrawer } from '@/features/crm/components/DepartmentDrawer'
import { label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import type { CrmDepartment } from '@/lib/types'

export function DepartmentsPage() {
  const { departments, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<CrmDepartment>('department', departments)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return departments
      .filter(
        (d) =>
          !q ||
          textOf(d.name, d.category, d.division, relatedName(d.retailer), relatedName(d.primary_buyer)).includes(q),
      )
      .sort((a, b) => {
        const account = relatedName(a.retailer).localeCompare(relatedName(b.retailer))
        if (account) return account
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [departments, query])

  const columns: Column<CrmDepartment>[] = [
    {
      key: 'retailer',
      header: 'Account',
      sortValue: (d) => relatedName(d.retailer),
      filterValue: (d) => relatedName(d.retailer),
      cell: (d) => <RelationLabel value={d.retailer} />,
    },
    {
      key: 'name',
      header: 'Department',
      opensDetail: true,
      sortValue: (d) => d.name?.toLowerCase() ?? '',
      filterValue: (d) => d.name,
      className: 'w-full max-w-0',
      cell: (d) => <span className="font-[500] text-foreground">{d.name || 'Untitled department'}</span>,
    },
    {
      key: 'primary_buyer',
      header: 'Primary contact',
      hideBelow: 'lg',
      sortValue: (d) => relatedName(d.primary_buyer),
      filterValue: (d) => relatedName(d.primary_buyer),
      cell: (d) => <RelationLabel value={d.primary_buyer} />,
    },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'lg',
      sortValue: (d) => d.category ?? '',
      filterValue: (d) => label(d.category),
      cell: (d) => d.category ? <StatusBadge tone="neutral" dot={false}>{label(d.category)}</StatusBadge> : '—',
    },
    {
      key: 'division',
      header: 'Division',
      hideBelow: 'xl',
      sortValue: (d) => d.division ?? '',
      filterValue: (d) => label(d.division),
      cell: (d) => d.division ? label(d.division) : '—',
    },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Departments"
          subtitle="Account departments"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search department, account, contact…"
        />
      }
    >
      {error ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(d) => d.id}
          onRowClick={(d) => select(d)}
          loading={loading}
          groupBy={(d) => relatedName(d.retailer)}
          emptyIcon={<Building2 className="size-5" />}
          emptyTitle="No departments match"
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'retailer', dir: 'asc' }}
        />
      )}
      <DepartmentDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
