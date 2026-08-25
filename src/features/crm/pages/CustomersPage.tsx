import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/app/states'
import { effectiveCustomerStatus } from '@/features/crm/pages/_shared'
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
import { logError } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { CrmIngestedDomain, Retailer } from '@/lib/types'

const STATUS_OPTIONS: EditOption[] = CUSTOMER_STATUSES.map((v) => ({ value: v, label: customerStatusLabel(v) }))
const CHAIN_OPTIONS: EditOption[] = CHAIN_TYPES.map((v) => ({ value: v, label: label(v) }))
const DOMAIN_CLASSIFICATION_OPTIONS: EditOption[] = [
  { value: 'ACTIVE_CUSTOMER', label: 'Active Customer' },
  { value: 'POTENTIAL_CUSTOMER', label: 'Potential Customer' },
  { value: 'OTHER', label: 'Not a Customer' },
]

type Segment = 'active' | 'unclassified' | 'triage' | 'dismissed' | 'all'

const statusOf = (r: Retailer): string => effectiveCustomerStatus(r)

// Single segment rule, used for both the rows and the tab counts so they can
// never disagree. Every company falls in exactly one of these buckets.
const segmentOf = (r: Retailer): Exclude<Segment, 'triage' | 'all'> => {
  const s = statusOf(r)
  if (s === 'OTHER') return 'dismissed'
  if (s === 'UNASSIGNED') return 'unclassified'
  return 'active'
}
// Hub prospect flag. "In ERP" says the company has an ERP record — a ship-to,
// a 2006-era buyer and a live customer all look the same there — never that it
// is a confirmed customer. Only customer_status carries that judgement.
const potentialLabel = (value: boolean | null | undefined) =>
  value === true ? 'Potential' : value === false ? 'In ERP' : 'Unknown'
const potentialTone = (value: boolean | null | undefined) =>
  value === true ? 'warning' : value === false ? 'success' : 'neutral'

export function CustomersPage() {
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('active')
  // One fetch feeds every company segment, so counts and rows share a source.
  const allCustomersQuery = useCustomerSegmentQuery('all')
  const triageDomainsQuery = useIngestedDomainsQuery(-1)
  const countsQuery = useCustomerSegmentCountsQuery()
  const buyersQuery = useIngestedContactsQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const updateCustomerMutation = useUpdateCustomerMutation()
  const updateDomainMutation = useUpdateIngestedDomainMutation()
  const [mergeSelection, setMergeSelection] = useState<Retailer[] | null>(null)
  const buyers = listData(buyersQuery.data)
  const opportunities = listData(opportunitiesQuery.data)
  const triageDomains = listData(triageDomainsQuery.data)
  const allCustomers = listData(allCustomersQuery.data)
  const buckets = useMemo(() => {
    const out = { active: [] as Retailer[], unclassified: [] as Retailer[], dismissed: [] as Retailer[] }
    for (const r of allCustomers) out[segmentOf(r)].push(r)
    return out
  }, [allCustomers])
  const customerRows = segment === 'all' ? allCustomers : buckets[segment as keyof typeof buckets] ?? allCustomers
  const visibleFetch = segment === 'triage' ? triageDomainsQuery : allCustomersQuery
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

  // Segment counts are the bucket sizes themselves, so a tab count is always
  // exactly the number of rows that tab shows. Only the Triage count (email
  // domains, not company records) comes from the server.
  const segCounts = {
    active: buckets.active.length,
    unclassified: buckets.unclassified.length,
    dismissed: buckets.dismissed.length,
    all: allCustomers.length,
    triage: countsQuery.data?.triage ?? triageDomains.length,
  }

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customerRows.filter((r) => {
      if (q && !textOf(r.name, r.display_name, r.domain, r.routing_aliases, r.customer_status, r.chain_type, r.is_potential, r.status).includes(q)) return false
      return true
    })
  }, [customerRows, query])

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

  const customerColumns: Column<Retailer>[] = [
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
      sortValue: (r) => customerStatusLabel(statusOf(r)),
      filterValue: (r) => customerStatusLabel(statusOf(r)),
      editOptions: STATUS_OPTIONS,
      editValue: (r) => statusOf(r),
      cell: (r) => (
        <StatusBadge tone={customerStatusTone(statusOf(r))} dot>
          {customerStatusLabel(statusOf(r))}
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
      cell: (r) => <span className="block truncate text-muted-foreground">{r.sample_subject || '—'}</span>,
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
                  { id: 'active', label: 'Customers', count: segCounts.active, hint: 'Active and potential customers' },
                  {
                    id: 'unclassified',
                    label: 'Unclassified',
                    count: segCounts.unclassified,
                    hint: 'Companies nobody has marked as a customer or not yet',
                  },
                  { id: 'dismissed', label: 'Not a customer', count: segCounts.dismissed, hint: 'Companies marked as not a customer' },
                  { id: 'all', label: 'All companies', count: segCounts.all, hint: 'Every company record' },
                  {
                    id: 'triage',
                    label: 'New email domains',
                    count: segCounts.triage,
                    hint: 'Email domains seen in the inbox that belong to no company yet — not company records',
                  },
                ] as { id: Segment; label: string; count: number; hint: string }[]).map((s) => (
                  <TabsTrigger key={s.id} value={s.id} title={s.hint} className={cn('gap-1.5', s.id === 'triage' && 'ml-2 border-l pl-3')}>
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
          <p className="px-1 text-[12px] text-muted-foreground">
            Email domains seen in the inbox that belong to no company yet. These are not company records —
            classifying one here only says how to treat its mail.
          </p>
          <DataTable
            key="customer-triage-table"
            rows={filteredDomains}
            columns={domainColumns}
            getRowId={(r) => r.id}
            onCellEdit={(row, _key, value) => classifyDomain(row, value)}
            selectable
            loading={visibleFetch.isPending}
            emptyIcon={<Building2 className="size-5" />}
            emptyTitle="Triage queue is clear"
            emptyDescription="No ingested domains awaiting review."
            initialSort={{ key: 'last_seen_at', dir: 'desc' }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <DataTable
          key="customer-list-table"
          rows={filteredCustomers}
          columns={customerColumns}
          getRowId={(r) => r.id}
          onRowClick={(r) => select(r)}
          onCellEdit={editCell}
          selectable
          selectionActions={(rows) => (
            <>
              <Button
                size="sm"
                className="h-[28px] px-[10px] text-[12px]"
                variant="outline"
                disabled={rows.length < 2}
                onClick={() => { if (rows.length >= 2) setMergeSelection(rows) }}
              >
                Merge…
              </Button>
              {rows.length < 2 ? (
                <span className="text-[11.5px] text-muted-foreground">Select at least two to merge</span>
              ) : null}
            </>
          )}
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
        key={mergeSelection ? mergeSelection.map((r) => r.id).join('-') : 'no-merge'}
        records={mergeSelection}
        onClose={() => setMergeSelection(null)}
        onMerged={() => setMergeSelection(null)}
      />
    </AppPage>
  )
}
