import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/app/states'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { CustomerDrawer } from '@/features/crm/components/CustomerDrawer'
import { MergeCustomersDialog } from '@/features/crm/components/MergeCustomersDialog'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import { ChainBadge } from '@/features/crm/components/CrmStatusBadge'
import { CHAIN_TYPES, CUSTOMER_STATUSES, customerStatusLabel, customerStatusTone } from '@/features/crm/constants'
import { formatDateTime, idOf, label, textOf } from '@/features/crm/format'
import {
  listData,
  useCustomerSegmentCountsQuery,
  useCustomerSegmentQuery,
  useIngestedDomainsQuery,
  useIngestedContactsQuery,
  useOpportunitiesQuery,
  useUpdateIngestedDomainMutation,
  useUpdateCustomerMutation,
} from '@/features/crm/queries'
import { isSelectableCustomer } from '@/features/crm/pages/_shared'
import { logError } from '@/lib/errors'
import type { CrmIngestedDomain, Retailer } from '@/lib/types'

const STATUS_OPTIONS: EditOption[] = CUSTOMER_STATUSES.map((v) => ({ value: v, label: customerStatusLabel(v) }))
const CHAIN_OPTIONS: EditOption[] = CHAIN_TYPES.map((v) => ({ value: v, label: label(v) }))
const DOMAIN_CLASSIFICATION_OPTIONS: EditOption[] = [
  { value: 'ACTIVE_CUSTOMER', label: 'Active Customer' },
  { value: 'POTENTIAL_CUSTOMER', label: 'Potential Customer' },
  { value: 'OTHER', label: 'Not a Customer' },
]

type Segment = 'active' | 'triage' | 'dismissed' | 'all'

// Normalize to the canonical bucket (empty/null == New Company / UNASSIGNED).
const statusOf = (r: Retailer) => r.customer_status || 'UNASSIGNED'
const potentialLabel = (value: boolean | null | undefined) =>
  value === true ? 'Potential' : value === false ? 'ERP confirmed' : 'Unknown'
const potentialTone = (value: boolean | null | undefined) =>
  value === true ? 'warning' : value === false ? 'success' : 'neutral'

export function CustomersPage() {
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('active')
  const activeCustomersQuery = useCustomerSegmentQuery('active')
  const triageDomainsQuery = useIngestedDomainsQuery(-1)
  const dismissedCustomersQuery = useCustomerSegmentQuery('dismissed', -1, segment === 'dismissed')
  const allCustomersQuery = useCustomerSegmentQuery('all', -1, segment === 'all')
  const countsQuery = useCustomerSegmentCountsQuery()
  const buyersQuery = useIngestedContactsQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const updateCustomerMutation = useUpdateCustomerMutation()
  const updateDomainMutation = useUpdateIngestedDomainMutation()
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(() => new Set())
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(() => new Set())
  const [mergePair, setMergePair] = useState<[Retailer, Retailer] | null>(null)
  const [bulkClassification, setBulkClassification] = useState('')
  const buyers = listData(buyersQuery.data)
  const opportunities = listData(opportunitiesQuery.data)
  const activeCustomers = listData(activeCustomersQuery.data)
  const triageDomains = listData(triageDomainsQuery.data)
  const dismissedCustomers = listData(dismissedCustomersQuery.data)
  const allCustomers = listData(allCustomersQuery.data)
  const customerRows =
    segment === 'all'
      ? allCustomers
      : segment === 'dismissed'
        ? dismissedCustomers
        : activeCustomers
  const visibleFetch =
    segment === 'all'
      ? allCustomersQuery
      : segment === 'dismissed'
        ? dismissedCustomersQuery
        : segment === 'triage'
          ? triageDomainsQuery
          : activeCustomersQuery
  const [selected, select] = useRecordSelection<Retailer>('retailer', customerRows)

  // Inline edit / drag-copy for the Status and Chain columns.
  async function editCell(row: Retailer, key: string, value: string) {
    try {
      await updateCustomerMutation.mutateAsync({ id: row.id, values: { [key]: value } as Partial<Retailer> })
    } catch (error) {
      toast.error('Could not save change', { description: logError('CustomersPage.editCell', error) })
    }
  }

  async function classifyDomain(row: CrmIngestedDomain, value: string) {
    try {
      await updateDomainMutation.mutateAsync({ id: row.id, values: { status: value } })
    } catch (error) {
      toast.error('Could not classify domain', { description: logError('CustomersPage.classifyDomain', error) })
    }
  }

  async function classifySelectedDomains() {
    if (!bulkClassification || !selectedDomains.size) return
    const rows = triageDomains.filter((row) => selectedDomains.has(row.id))
    try {
      await Promise.all(rows.map((row) => updateDomainMutation.mutateAsync({ id: row.id, values: { status: bulkClassification } })))
      setSelectedDomains(new Set())
      toast.success(`${rows.length} domain${rows.length === 1 ? '' : 's'} classified`)
    } catch (error) {
      toast.error('Could not classify every selected domain', {
        description: logError('CustomersPage.classifySelectedDomains', error),
      })
    }
  }

  const counts = useMemo(() => {
    const contacts = new Map<string, number>()
    const opps = new Map<string, number>()
    for (const b of buyers) {
      const id = idOf(b.retailer)
      if (id) contacts.set(id, (contacts.get(id) ?? 0) + 1)
    }
    for (const o of opportunities) {
      const id = idOf(o.retailer)
      if (id) opps.set(id, (opps.get(id) ?? 0) + 1)
    }
    return { contacts, opps }
  }, [buyers, opportunities])

  // Segment counts. Customer counts come from crm_customer_list; Triage counts
  // CRM-private ingested domains awaiting promotion/review.
  const segCounts = countsQuery.data ?? {
    active: activeCustomers.length,
    triage: triageDomains.length,
    dismissed: dismissedCustomers.length,
    all: allCustomers.length,
  }

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customerRows.filter((r) => {
      const s = statusOf(r)
      // Hub global status is authoritative: hide global-inactive from the
      // Customers tab even if legacy CRM customer_status still says ACTIVE.
      const hubOk = isSelectableCustomer(r.status)
      if (segment === 'active' && (s === 'OTHER' || s === 'UNASSIGNED' || !hubOk)) return false
      if (segment === 'dismissed' && s !== 'OTHER') return false
      if (q && !textOf(r.name, r.display_name, r.domain, r.routing_aliases, r.customer_status, r.chain_type, r.is_potential, r.status).includes(q)) return false
      return true
    })
  }, [customerRows, query, segment])

  const filteredDomains = useMemo(() => {
    const q = query.trim().toLowerCase()
    return triageDomains.filter((r) => {
      if (!q) return true
      return textOf(
        r.domain,
        r.display_name,
        r.status,
        r.last_sender,
        r.sample_subject,
      ).includes(q)
    })
  }, [triageDomains, query])

  const count = segment === 'triage' ? filteredDomains.length : filteredCustomers.length

  function toggleCustomer(id: string, checked: boolean) {
    setSelectedCustomers((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const customerColumns: Column<Retailer>[] = [
    {
      key: 'selected',
      header: (
        <input
          type="checkbox"
          aria-label="Clear customer selection"
          checked={selectedCustomers.size > 0}
          ref={(el) => { if (el) el.indeterminate = selectedCustomers.size > 0 }}
          onChange={() => setSelectedCustomers(new Set())}
          onClick={(event) => event.stopPropagation()}
          className="size-4 accent-primary"
        />
      ),
      width: 44,
      cell: (row) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.display_name || row.name}`}
          checked={selectedCustomers.has(row.id)}
          onChange={(event) => toggleCustomer(row.id, event.target.checked)}
          onClick={(event) => event.stopPropagation()}
          className="size-4 accent-primary"
        />
      ),
    },
    {
      key: 'name',
      header: 'Customer',
      opensDetail: true,
      sortValue: (r) => r.name?.toLowerCase(),
      filterValue: (r) => r.name,
      cell: (r) => <CustomerRelationLogo value={r} size={24} variant="token-name" />,
    },
    {
      key: 'customer_status',
      header: 'Status',
      sortValue: (r) => customerStatusLabel(r.customer_status),
      filterValue: (r) => customerStatusLabel(r.customer_status),
      editOptions: STATUS_OPTIONS,
      editValue: (r) => r.customer_status || 'UNASSIGNED',
      cell: (r) => (
        <StatusBadge tone={customerStatusTone(r.customer_status)} dot>
          {customerStatusLabel(r.customer_status)}
        </StatusBadge>
      ),
    },
    {
      key: 'potential',
      header: 'Source',
      hideBelow: 'lg',
      sortValue: (r) => potentialLabel(r.is_potential),
      filterValue: (r) => potentialLabel(r.is_potential),
      cell: (r) => (
        <StatusBadge tone={potentialTone(r.is_potential)} dot>
          {potentialLabel(r.is_potential)}
        </StatusBadge>
      ),
    },
    {
      key: 'chain_type',
      header: 'Chain',
      hideBelow: 'lg',
      sortValue: (r) => r.chain_type ?? '',
      filterValue: (r) => label(r.chain_type),
      editOptions: CHAIN_OPTIONS,
      editValue: (r) => r.chain_type,
      cell: (r) => <ChainBadge chain={r.chain_type} />,
    },
    {
      key: 'contacts',
      header: 'Contacts',
      hideBelow: 'lg',
      numeric: true,
      sortValue: (r) => counts.contacts.get(r.id) ?? 0,
      className: 'text-right tabular-nums',
      headClassName: 'text-right',
      cell: (r) => counts.contacts.get(r.id) ?? 0,
    },
    {
      key: 'opps',
      header: 'Programs',
      hideBelow: 'xl',
      numeric: true,
      sortValue: (r) => counts.opps.get(r.id) ?? 0,
      className: 'text-right tabular-nums',
      headClassName: 'text-right',
      cell: (r) => counts.opps.get(r.id) ?? 0,
    },
  ]

  const domainColumns: Column<CrmIngestedDomain>[] = [
    {
      key: 'selected',
      header: (
        <input
          type="checkbox"
          aria-label="Select all visible domains"
          checked={filteredDomains.length > 0 && filteredDomains.every((row) => selectedDomains.has(row.id))}
          onChange={(event) => {
            setSelectedDomains(event.target.checked ? new Set(filteredDomains.map((row) => row.id)) : new Set())
          }}
          onClick={(event) => event.stopPropagation()}
          className="size-4 accent-primary"
        />
      ),
      width: 44,
      cell: (row) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.domain}`}
          checked={selectedDomains.has(row.id)}
          onChange={(event) => {
            setSelectedDomains((current) => {
              const next = new Set(current)
              if (event.target.checked) next.add(row.id)
              else next.delete(row.id)
              return next
            })
          }}
          onClick={(event) => event.stopPropagation()}
          className="size-4 accent-primary"
        />
      ),
    },
    {
      key: 'domain',
      header: 'Domain',
      sortValue: (r) => r.domain,
      filterValue: (r) => r.domain,
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-[500] text-foreground">{r.domain}</div>
          {r.display_name ? (
            <div className="truncate text-[11px] text-muted-foreground">{r.display_name}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'email_count',
      header: 'Emails',
      numeric: true,
      sortValue: (r) => r.email_count ?? 0,
      className: 'text-right tabular-nums',
      headClassName: 'text-right',
      cell: (r) => r.email_count ?? 0,
    },
    {
      key: 'last_seen_at',
      header: 'Last seen',
      hideBelow: 'md',
      sortValue: (r) => r.last_seen_at,
      filterValue: (r) => formatDateTime(r.last_seen_at),
      cell: (r) => formatDateTime(r.last_seen_at),
    },
    {
      key: 'last_sender',
      header: 'Sender',
      hideBelow: 'lg',
      sortValue: (r) => r.last_sender ?? '',
      filterValue: (r) => r.last_sender ?? '',
      cell: (r) => <span className="truncate text-muted-foreground">{r.last_sender || '—'}</span>,
    },
    {
      key: 'sample_subject',
      header: 'Sample subject',
      hideBelow: 'xl',
      sortValue: (r) => r.sample_subject ?? '',
      filterValue: (r) => r.sample_subject ?? '',
      cell: (r) => <span className="truncate text-muted-foreground">{r.sample_subject || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Classification',
      sortValue: (r) => customerStatusLabel(r.status),
      filterValue: (r) => customerStatusLabel(r.status),
      editOptions: DOMAIN_CLASSIFICATION_OPTIONS,
      editValue: (r) => r.status ?? 'new',
      cell: (r) => (
        <StatusBadge tone={customerStatusTone(r.status)} dot>
          {customerStatusLabel(r.status)}
        </StatusBadge>
      ),
    },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Customers"
          subtitle="Retailer customers"
          count={count}
          search={query}
          onSearch={setQuery}
          searchPlaceholder={segment === 'triage' ? 'Search domain, sender, subject…' : 'Search name, domain, aliases…'}
          segments={
            <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
              <TabsList>
                {([
                  { id: 'active', label: 'Customers', count: segCounts.active },
                  { id: 'triage', label: 'Triage', count: segCounts.triage },
                  { id: 'dismissed', label: 'Not a customer', count: segCounts.dismissed },
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
      {visibleFetch.isError ? (
        <ErrorState onRetry={() => void visibleFetch.refetch()} />
      ) : segment === 'triage' ? (
        <div className="space-y-2">
          {selectedDomains.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[10px] border bg-card px-3 py-2">
              <span className="text-[12.5px] font-[600]">{selectedDomains.size} selected</span>
              <Select value={bulkClassification} onValueChange={setBulkClassification}>
                <SelectTrigger size="sm" className="w-48"><SelectValue placeholder="Choose classification" /></SelectTrigger>
                <SelectContent>
                  {DOMAIN_CLASSIFICATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => void classifySelectedDomains()} disabled={!bulkClassification || updateDomainMutation.isPending}>
                Apply to selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedDomains(new Set())}>Clear selection</Button>
            </div>
          ) : null}
          <DataTable
            key="customer-triage-table"
            rows={filteredDomains}
            columns={domainColumns}
            getRowId={(r) => r.id}
            onCellEdit={(row, _key, value) => classifyDomain(row, value)}
            loading={visibleFetch.isPending}
            emptyIcon={<Building2 className="size-5" />}
            emptyTitle="Triage queue is clear"
            emptyDescription="No ingested domains awaiting review."
            initialSort={{ key: 'last_seen_at', dir: 'desc' }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {selectedCustomers.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[10px] border bg-card px-3 py-2">
              <span className="text-[12.5px] font-[600]">{selectedCustomers.size} selected</span>
              <Button
                size="sm"
                disabled={selectedCustomers.size !== 2}
                onClick={() => {
                  const picked = customerRows.filter((r) => selectedCustomers.has(r.id))
                  if (picked.length === 2) setMergePair([picked[0], picked[1]])
                }}
              >
                Merge…
              </Button>
              <span className="text-[11.5px] text-muted-foreground">
                {selectedCustomers.size === 2 ? 'Ready to merge' : 'Select exactly two customers to merge'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setSelectedCustomers(new Set())}>Clear selection</Button>
            </div>
          ) : null}
          <DataTable
          key="customer-list-table"
          rows={filteredCustomers}
          columns={customerColumns}
          getRowId={(r) => r.id}
          onRowClick={(r) => select(r)}
          onCellEdit={editCell}
          loading={visibleFetch.isPending}
          emptyIcon={<Building2 className="size-5" />}
          emptyTitle="No customers match"
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'name', dir: 'asc' }}
          />
        </div>
      )}
      <CustomerDrawer row={selected} onClose={() => select(null)} />
      <MergeCustomersDialog
        key={mergePair ? `${mergePair[0].id}-${mergePair[1].id}` : 'no-merge'}
        pair={mergePair}
        onClose={() => setMergePair(null)}
        onMerged={() => setSelectedCustomers(new Set())}
      />
    </AppPage>
  )
}
