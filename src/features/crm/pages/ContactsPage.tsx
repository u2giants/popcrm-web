import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Contact } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/app/states'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { ContactDrawer } from '@/features/crm/components/ContactDrawer'
import { customerLabel, idOf, label, relatedName, textOf } from '@/features/crm/format'
import { buildRetailerById, isSelectableCustomer, withCurrentCustomer } from '@/features/crm/pages/_shared'
import { StatusBadge } from '@/components/app/StatusBadge'
import { NameAvatar } from '@/components/app/NameAvatar'
import {
  crmKeys,
  listData,
  useAllContactsQuery,
  useContactSegmentCountsQuery,
  useContactSegmentQuery,
  useDepartmentsQuery,
  useCustomerPickerQuery,
  useUpdateContactMutation,
} from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import type { Buyer } from '@/lib/types'

type Segment = 'customer' | 'department' | 'triage' | 'all'

function isCustomerStatus(status: string | null | undefined) {
  return status === 'ACTIVE_CUSTOMER' || status === 'POTENTIAL_CUSTOMER'
}

export function ContactsPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('customer')
  const activeSegment = segment === 'all' ? 'customer' : segment
  const segmentQuery = useContactSegmentQuery(activeSegment, -1, segment !== 'all')
  const allContactsQuery = useAllContactsQuery(-1, segment === 'all')
  const countsQuery = useContactSegmentCountsQuery()
  const retailersQuery = useCustomerPickerQuery(-1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const updateContactMutation = useUpdateContactMutation()
  const activeContactsQuery = segment === 'all' ? allContactsQuery : segmentQuery
  const buyers = listData(activeContactsQuery.data)
  const retailers = listData(retailersQuery.data)
  const departments = listData(departmentsQuery.data)
  const [selected, select] = useRecordSelection<Buyer>('contact', buyers)
  const retailerById = useMemo(
    () => buildRetailerById(retailers, buyers.map((b) => (typeof b.retailer === 'object' ? b.retailer : null))),
    [retailers, buyers],
  )
  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments])
  const customerOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'Unassigned' },
      ...retailers
        .filter((r) => isSelectableCustomer(r.status))
        .map((r) => ({ value: r.id, label: customerLabel(r) })),
    ],
    [retailers],
  )
  // Triage rows also offer reviewed not-a-customer companies (hub status is
  // inactive for those, so they need an explicit carve-out) for classification.
  const triageCustomerOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'Unassigned' },
      ...retailers
        .filter((r) => isSelectableCustomer(r.status) || r.customer_status === 'OTHER')
        .map((r) => ({
          value: r.id,
          label: r.customer_status === 'OTHER' ? `${customerLabel(r)} (Not a customer)` : customerLabel(r),
        })),
    ],
    [retailers],
  )
  const departmentOptionsFor = useMemo(
    () => (b: Buyer): EditOption[] => {
      const customerId = idOf(b.retailer)
      return [
        { value: '', label: 'Unassigned' },
        ...departments
          .filter((d) => !customerId || idOf(d.retailer) === customerId)
          .map((d) => ({ value: d.id, label: d.name })),
      ]
    },
    [departments],
  )
  const typeOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'Unspecified' },
      ...Array.from(new Set(buyers.map((b) => b.contact_type).filter(Boolean) as string[]))
        .sort((a, b) => label(a).localeCompare(label(b)))
        .map((v) => ({ value: v, label: label(v) })),
    ],
    [buyers],
  )
  const titleOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'No title' },
      ...Array.from(new Set(buyers.map((b) => b.job_title?.trim()).filter(Boolean) as string[]))
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ value: v, label: v })),
    ],
    [buyers],
  )

  async function editCell(row: Buyer, key: string, value: string) {
    const prev = (row as unknown as Record<string, unknown>)[key]
    const nextValue = value || null
    const expanded =
      key === 'retailer'
        ? retailerById.get(value) ?? null
        : key === 'department'
          ? departmentById.get(value) ?? null
          : nextValue
    const inferredRetailer =
      key === 'department' && value && !idOf(row.retailer)
        ? departmentById.get(value)?.retailer ?? row.retailer
        : row.retailer
    // When the customer changes, drop any department that no longer belongs to it.
    const clearStaleDepartment =
      key === 'retailer' &&
      idOf(row.department) !== '' &&
      idOf(departmentById.get(idOf(row.department))?.retailer) !== value
    const relationshipField = key === 'department' || key === 'contact_type'
    const patch: Partial<Buyer> = clearStaleDepartment
      ? ({ [key]: nextValue, department: null } as Partial<Buyer>)
      : ({ [key]: nextValue } as Partial<Buyer>)
    if (relationshipField) {
      patch.retailer = inferredRetailer
    }
    const optimistic = (rows: Buyer[] = []) =>
      rows.map((b) =>
        b.id === row.id
          ? {
              ...b,
              [key]: expanded,
              ...(relationshipField && inferredRetailer !== row.retailer ? { retailer: inferredRetailer } : {}),
              ...(clearStaleDepartment ? { department: null } : {}),
            }
          : b,
      )
    queryClient.setQueriesData<Buyer[]>({ queryKey: [...crmKeys.all, 'contactSegment'] }, optimistic)
    queryClient.setQueriesData<Buyer[]>({ queryKey: [...crmKeys.all, 'allContacts'] }, optimistic)
    queryClient.setQueriesData<Buyer[]>({ queryKey: [...crmKeys.all, 'ingestedContacts'] }, optimistic)
    try {
      await updateContactMutation.mutateAsync({ id: row.id, values: patch })
    } catch (error) {
      const rollback = (rows: Buyer[] = []) =>
        rows.map((b) =>
          b.id === row.id
            ? { ...b, [key]: prev, ...(clearStaleDepartment ? { department: row.department } : {}) }
            : b,
        )
      queryClient.setQueriesData<Buyer[]>({ queryKey: [...crmKeys.all, 'contactSegment'] }, rollback)
      queryClient.setQueriesData<Buyer[]>({ queryKey: [...crmKeys.all, 'allContacts'] }, rollback)
      queryClient.setQueriesData<Buyer[]>({ queryKey: [...crmKeys.all, 'ingestedContacts'] }, rollback)
      toast.error('Could not save change', { description: logError('ContactsPage.editCell', error) })
    }
  }

  function isCustomerContact(b: Buyer) {
    const r = b.retailer
    if (!r || typeof r === 'string') return false
    return isCustomerStatus(r.customer_status)
  }

  const segCounts = countsQuery.data ?? {
    customer: segment === 'customer' ? buyers.length : 0,
    department: segment === 'department' ? buyers.length : 0,
    triage: segment === 'triage' ? buyers.length : 0,
    all: segment === 'all' ? buyers.length : 0,
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return buyers.filter((b) => {
      if (q && !textOf(b.name, b.email, b.job_title, relatedName(b.retailer), relatedName(b.department)).includes(q)) return false
      return true
    })
  }, [buyers, query])

  const columns: Column<Buyer>[] = [
    {
      key: 'name',
      header: 'Contact',
      opensDetail: true,
      sortValue: (b) => b.name?.toLowerCase(),
      filterValue: (b) => b.name,
      cell: (b) => (
        <div className="flex items-center gap-[9px]">
          <NameAvatar name={b.last_name || b.name} size={24} />
          <div className="min-w-0">
            <div className="truncate font-[500] text-foreground">{b.name}</div>
            {b.email ? (
              <div className="truncate text-[11px] text-muted-foreground">{b.email}</div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'job_title',
      header: 'Title',
      hideBelow: 'md',
      sortValue: (b) => b.job_title ?? '',
      filterValue: (b) => b.job_title,
      editOptions: titleOptions,
      editValue: (b) => b.job_title,
      allowCustomEditValue: true,
      customEditLabel: 'Create title',
      cell: (b) => <span className="text-muted-foreground">{b.job_title || '—'}</span>,
    },
    {
      key: 'retailer',
      header: 'Customer',
      sortValue: (b) => relatedName(b.retailer),
      filterValue: (b) => relatedName(b.retailer),
      editOptions: (b) => withCurrentCustomer(isCustomerContact(b) ? customerOptions : triageCustomerOptions, idOf(b.retailer), retailerById),
      editValue: (b) => idOf(b.retailer),
      cell: (b) => <CustomerRelationLogo value={b.retailer} customerById={retailerById} />,
    },
    {
      key: 'department',
      header: 'Department',
      hideBelow: 'lg',
      sortValue: (b) => relatedName(b.department),
      filterValue: (b) => relatedName(b.department),
      editOptions: departmentOptionsFor,
      editValue: (b) => idOf(b.department),
      cell: (b) => <span className="text-muted-foreground">{relatedName(b.department)}</span>,
    },
    {
      key: 'contact_type',
      header: 'Type',
      hideBelow: 'lg',
      sortValue: (b) => b.contact_type ?? '',
      filterValue: (b) => label(b.contact_type),
      editOptions: typeOptions,
      editValue: (b) => b.contact_type,
      cell: (b) => b.contact_type ? <StatusBadge tone="info" dot={false}>{label(b.contact_type)}</StatusBadge> : '—',
    },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Contacts"
          subtitle="Buyers across all customers"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search name, email, title…"
          segments={
            <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
              <TabsList>
                {([
                  { id: 'customer', label: 'Cust Contacts', count: segCounts.customer },
                  { id: 'department', label: 'Dept. Contacts', count: segCounts.department },
                  { id: 'triage', label: 'Triage', count: segCounts.triage },
                  { id: 'all', label: 'All', count: segCounts.all },
                ] as { id: Segment; label: string; count: number }[]).map((s) => (
                  <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                    {s.label}
                    <span className="rounded-full bg-muted-foreground/15 px-1.5 text-[11px] tabular-nums">
                      {s.count.toLocaleString()}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        />
      }
    >
      {activeContactsQuery.isError ? (
        <ErrorState onRetry={() => void activeContactsQuery.refetch()} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(b) => b.id}
          onRowClick={(b) => select(b)}
          onCellEdit={editCell}
          selectable
          loading={activeContactsQuery.isPending || retailersQuery.isPending || departmentsQuery.isPending}
          emptyIcon={<Contact className="size-5" />}
          emptyTitle={segment === 'triage' ? 'Triage queue is clear' : 'No contacts match'}
          emptyDescription={
            segment === 'triage'
              ? 'No contacts are missing customer and department links.'
              : 'Adjust your search or column filters.'
          }
          initialSort={{ key: 'name', dir: 'asc' }}
        />
      )}
      <ContactDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
