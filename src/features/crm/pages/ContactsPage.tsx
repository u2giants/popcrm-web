import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Contact } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { ContactDrawer } from '@/features/crm/components/ContactDrawer'
import { idOf, label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import { NameAvatar } from '@/components/app/NameAvatar'
import {
  crmKeys,
  listData,
  useDepartmentsQuery,
  useIngestedContactsQuery,
  useIngestedDomainsQuery,
  useUpdateContactMutation,
} from '@/features/crm/queries'
import type { Buyer } from '@/lib/types'

type Segment = 'customer' | 'department' | 'triage' | 'all'

function isCustomerAccount(status: string | null | undefined) {
  return status === 'ACTIVE_CUSTOMER' || status === 'POTENTIAL_CUSTOMER'
}

function isTriageAccount(status: string | null | undefined) {
  return isCustomerAccount(status) || status === 'OTHER'
}

export function ContactsPage() {
  const queryClient = useQueryClient()
  const buyersQuery = useIngestedContactsQuery(100)
  const retailersQuery = useIngestedDomainsQuery(100)
  const departmentsQuery = useDepartmentsQuery(300)
  const updateContactMutation = useUpdateContactMutation()
  const buyers = listData(buyersQuery.data)
  const retailers = listData(retailersQuery.data)
  const departments = listData(departmentsQuery.data)
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('customer')
  const [selected, select] = useRecordSelection<Buyer>('contact', buyers)
  const retailerById = useMemo(() => new Map(retailers.map((r) => [r.id, r])), [retailers])
  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments])
  const customerAccountOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'Unassigned' },
      ...retailers
        .filter((r) => isCustomerAccount(r.customer_status))
        .map((r) => ({ value: r.id, label: r.name })),
    ],
    [retailers],
  )
  const triageAccountOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'Unassigned' },
      ...retailers
        .filter((r) => isTriageAccount(r.customer_status))
        .map((r) => ({
          value: r.id,
          label: r.customer_status === 'OTHER' ? `${r.name} (Not a customer)` : r.name,
        })),
    ],
    [retailers],
  )
  const departmentOptionsFor = useMemo(
    () => (b: Buyer): EditOption[] => {
      const accountId = idOf(b.retailer)
      return [
        { value: '', label: 'Unassigned' },
        ...departments
          .filter((d) => !accountId || idOf(d.retailer) === accountId)
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

  async function editCell(row: Buyer, key: string, value: string) {
    const prev = (row as unknown as Record<string, unknown>)[key]
    const nextValue = value || null
    const expanded =
      key === 'retailer'
        ? retailerById.get(value) ?? null
        : key === 'department'
          ? departmentById.get(value) ?? null
          : nextValue
    // When the account changes, drop any department that no longer belongs to it.
    const clearStaleDepartment =
      key === 'retailer' &&
      idOf(row.department) !== '' &&
      idOf(departmentById.get(idOf(row.department))?.retailer) !== value
    const patch: Partial<Buyer> = clearStaleDepartment
      ? ({ [key]: nextValue, department: null } as Partial<Buyer>)
      : ({ [key]: nextValue } as Partial<Buyer>)
    queryClient.setQueryData<Buyer[]>(crmKeys.ingestedContacts(100), (rows = []) =>
      rows.map((b) =>
        b.id === row.id
          ? { ...b, [key]: expanded, ...(clearStaleDepartment ? { department: null } : {}) }
          : b,
      ),
    )
    try {
      await updateContactMutation.mutateAsync({ id: row.id, values: patch })
    } catch {
      queryClient.setQueryData<Buyer[]>(crmKeys.ingestedContacts(100), (rows = []) =>
        rows.map((b) =>
          b.id === row.id
            ? { ...b, [key]: prev, ...(clearStaleDepartment ? { department: row.department } : {}) }
            : b,
        ),
      )
      toast.error('Could not save change')
    }
  }

  function isCustomerContact(b: Buyer) {
    const r = b.retailer
    if (!r || typeof r === 'string') return false
    return isCustomerAccount(r.customer_status)
  }

  const segCounts = useMemo(() => {
    let customer = 0
    let department = 0
    let triage = 0
    for (const b of buyers) {
      const hasDepartment = Boolean(idOf(b.department))
      const isCustomer = isCustomerContact(b)
      if (!isCustomer) triage++
      else if (hasDepartment) department++
      else customer++
    }
    return { customer, department, triage, all: buyers.length }
  }, [buyers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return buyers.filter((b) => {
      const hasDepartment = Boolean(idOf(b.department))
      const isCustomer = isCustomerContact(b)
      if (segment === 'customer' && (!isCustomer || hasDepartment)) return false
      if (segment === 'department' && (!isCustomer || !hasDepartment)) return false
      if (segment === 'triage' && isCustomer) return false
      if (q && !textOf(b.name, b.email, b.job_title, relatedName(b.retailer), relatedName(b.department)).includes(q)) return false
      return true
    })
  }, [buyers, query, segment])

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
      editOptions: typeOptions,
      editValue: (b) => b.job_title,
      cell: (b) => <span className="text-muted-foreground">{b.job_title || '—'}</span>,
    },
    {
      key: 'retailer',
      header: 'Account',
      sortValue: (b) => relatedName(b.retailer),
      filterValue: (b) => relatedName(b.retailer),
      editOptions: (b) => (isCustomerContact(b) ? customerAccountOptions : triageAccountOptions),
      editValue: (b) => idOf(b.retailer),
      cell: (b) => <RelationLabel value={b.retailer} />,
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
      cell: (b) => b.contact_type ? <StatusBadge tone="info" dot={false}>{label(b.contact_type)}</StatusBadge> : '—',
    },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Contacts"
          subtitle="Buyers across all accounts"
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
      {buyersQuery.isError ? (
        <ErrorState onRetry={() => void buyersQuery.refetch()} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(b) => b.id}
          onRowClick={(b) => select(b)}
          onCellEdit={editCell}
          loading={buyersQuery.isPending || retailersQuery.isPending || departmentsQuery.isPending}
          emptyIcon={<Contact className="size-5" />}
          emptyTitle={segment === 'triage' ? 'Triage queue is clear' : 'No contacts match'}
          emptyDescription={
            segment === 'triage'
              ? 'No contacts are missing account and department links.'
              : 'Adjust your search or column filters.'
          }
          initialSort={{ key: 'name', dir: 'asc' }}
        />
      )}
      <ContactDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
