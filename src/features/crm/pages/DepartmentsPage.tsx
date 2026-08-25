import { useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { DepartmentDrawer } from '@/features/crm/components/DepartmentDrawer'
import { idOf, label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import { listData, useCustomerPickerQuery, useDepartmentsQuery, useIngestedContactsQuery, useUpdateDepartmentMutation,
  useCustomerDisplayName,
} from '@/features/crm/queries'
import { buildRetailerById, customerEditOptions } from '@/features/crm/pages/_shared'
import { logError } from '@/lib/errors'
import type { CrmDepartment } from '@/lib/types'

export function DepartmentsPage() {
  const customerName = useCustomerDisplayName()
  const departmentsQuery = useDepartmentsQuery(-1)
  const retailersQuery = useCustomerPickerQuery(-1)
  const departments = listData(departmentsQuery.data)
  const retailers = listData(retailersQuery.data)
  const buyers = listData(useIngestedContactsQuery(-1).data)
  const updateDepartment = useUpdateDepartmentMutation()
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<CrmDepartment>('department', departments)
  const retailerById = useMemo(() => buildRetailerById(retailers), [retailers])
  const customerOptions = useMemo<EditOption[]>(() => customerEditOptions(retailers), [retailers])
  const categoryOptions = useMemo<EditOption[]>(() => distinctEditOptions(departments.map((d) => d.category)), [departments])
  const divisionOptions = useMemo<EditOption[]>(() => distinctEditOptions(departments.map((d) => d.division)), [departments])

  function contactOptionsFor(row: CrmDepartment): EditOption[] {
    const customerId = idOf(row.retailer)
    return [
      { value: '', label: 'Unassigned' },
      ...buyers
        .filter((buyer) => idOf(buyer.retailer) === customerId)
        .map((buyer) => ({ value: buyer.id, label: buyer.name || buyer.email || 'Unnamed contact' }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ]
  }

  async function editCell(row: CrmDepartment, key: string, value: string) {
    const values: Partial<CrmDepartment> = { [key]: value || null }
    if (key === 'retailer') {
      const currentBuyer = buyers.find((buyer) => buyer.id === idOf(row.primary_buyer))
      if (currentBuyer && idOf(currentBuyer.retailer) !== value) values.primary_buyer = null
    }
    try {
      await updateDepartment.mutateAsync({ id: row.id, values })
    } catch (error) {
      toast.error('Could not update department', { description: logError('DepartmentsPage.editCell', error) })
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return departments
      .filter(
        (d) =>
          !q ||
          textOf(d.name, d.category, d.division, customerName(d.retailer), relatedName(d.primary_buyer)).includes(q),
      )
      .sort((a, b) => {
        const customer = customerName(a.retailer).localeCompare(customerName(b.retailer))
        if (customer) return customer
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [departments, query, customerName])

  const columns: Column<CrmDepartment>[] = [
    {
      key: 'retailer',
      header: 'Customer',
      sortValue: (d) => customerName(d.retailer),
      filterValue: (d) => customerName(d.retailer),
      editOptions: customerOptions,
      editValue: (d) => idOf(d.retailer),
      cell: (d) => <CustomerRelationLogo value={d.retailer} customerById={retailerById} size={24} variant="token-name" />,
    },
    {
      key: 'name',
      header: 'Department',
      opensDetail: true,
      sortValue: (d) => d.name?.toLowerCase() ?? '',
      filterValue: (d) => d.name,
      editOptions: [],
      editValue: (d) => d.name,
      allowCustomEditValue: true,
      customEditLabel: 'Rename to',
      className: 'w-full max-w-0',
      cell: (d) => <span className="font-[500] text-foreground">{d.name || 'Untitled department'}</span>,
    },
    {
      key: 'primary_buyer',
      header: 'Primary contact',
      hideBelow: 'lg',
      sortValue: (d) => relatedName(d.primary_buyer),
      filterValue: (d) => relatedName(d.primary_buyer),
      editOptions: contactOptionsFor,
      editValue: (d) => idOf(d.primary_buyer),
      cell: (d) => <RelationLabel value={d.primary_buyer} />,
    },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'lg',
      sortValue: (d) => d.category ?? '',
      filterValue: (d) => label(d.category),
      editOptions: categoryOptions,
      editValue: (d) => d.category ?? '',
      allowCustomEditValue: true,
      customEditLabel: 'Add category',
      cell: (d) => d.category ? <StatusBadge tone="neutral" dot={false}>{label(d.category)}</StatusBadge> : '—',
    },
    {
      key: 'division',
      header: 'Division',
      hideBelow: 'xl',
      sortValue: (d) => d.division ?? '',
      filterValue: (d) => label(d.division),
      editOptions: divisionOptions,
      editValue: (d) => d.division ?? '',
      allowCustomEditValue: true,
      customEditLabel: 'Add division',
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
          onCellEdit={editCell}
          selectable
          loading={departmentsQuery.isPending}
          groupBy={(d) => customerName(d.retailer)}
          emptyIcon={<Building2 className="size-5" />}
          emptyTitle="No departments match"
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'retailer', dir: 'asc' }}
        />
      )}
      <DepartmentDrawer row={selected} departments={departments} onClose={() => select(null)} />
    </AppPage>
  )
}

function distinctEditOptions(values: (string | null)[]): EditOption[] {
  const valuesOnly = Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
    .sort((a, b) => label(a).localeCompare(label(b)))
    .map((value) => ({ value, label: label(value) }))
  return [{ value: '', label: 'Unassigned' }, ...valuesOnly]
}
