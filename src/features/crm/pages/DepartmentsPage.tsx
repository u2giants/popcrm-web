import { useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { AccountRelationLogo } from '@/features/crm/components/AccountRelationLogo'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { DepartmentDrawer } from '@/features/crm/components/DepartmentDrawer'
import { label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import { listData, useAccountSegmentQuery, useDepartmentsQuery } from '@/features/crm/queries'
import type { CrmDepartment } from '@/lib/types'

export function DepartmentsPage() {
  const departmentsQuery = useDepartmentsQuery(-1)
  const retailersQuery = useAccountSegmentQuery('all', -1)
  const departments = listData(departmentsQuery.data)
  const retailers = listData(retailersQuery.data)
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<CrmDepartment>('department', departments)
  const retailerById = useMemo(() => new Map(retailers.map((r) => [r.id, r])), [retailers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return departments
      .filter(
        (d) =>
          !q ||
          textOf(d.name, d.category, d.division, relatedName(d.retailer), relatedName(d.primary_buyer)).includes(q),
      )
      .sort((a, b) => {
        const customer = relatedName(a.retailer).localeCompare(relatedName(b.retailer))
        if (customer) return customer
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [departments, query])

  const columns: Column<CrmDepartment>[] = [
    {
      key: 'retailer',
      header: 'Customer',
      sortValue: (d) => relatedName(d.retailer),
      filterValue: (d) => relatedName(d.retailer),
      cell: (d) => <AccountRelationLogo value={d.retailer} accountById={retailerById} />,
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
          subtitle="Customer departments"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search department, customer, contact…"
        />
      }
    >
      {departmentsQuery.isError ? (
        <ErrorState onRetry={() => void departmentsQuery.refetch()} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(d) => d.id}
          onRowClick={(d) => select(d)}
          loading={departmentsQuery.isPending}
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
