import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/app/states'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { AccountDrawer } from '@/features/crm/components/AccountDrawer'
import { ChainBadge } from '@/features/crm/components/CrmStatusBadge'
import { updateRetailer } from '@/features/crm/api'
import { CHAIN_TYPES, CUSTOMER_STATUSES, customerStatusLabel, customerStatusTone } from '@/features/crm/constants'
import { idOf, label, textOf } from '@/features/crm/format'
import { AccountLogo } from '@/components/app/AccountLogo'
import type { Retailer } from '@/lib/types'

const STATUS_OPTIONS: EditOption[] = CUSTOMER_STATUSES.map((v) => ({ value: v, label: customerStatusLabel(v) }))
const CHAIN_OPTIONS: EditOption[] = CHAIN_TYPES.map((v) => ({ value: v, label: label(v) }))

type Segment = 'active' | 'triage' | 'dismissed' | 'all'

// Normalize to the canonical bucket (empty/null == New Company / UNASSIGNED).
const statusOf = (r: Retailer) => r.customer_status || 'UNASSIGNED'

export function AccountsPage() {
  const { retailers, setRetailers, buyers, opportunities, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('active')
  const [selected, select] = useRecordSelection<Retailer>('retailer', retailers)

  // Inline edit / drag-copy for the Status and Chain columns.
  async function editCell(row: Retailer, key: string, value: string) {
    const prev = (row as unknown as Record<string, unknown>)[key]
    setRetailers((rows) => rows.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)))
    try {
      await updateRetailer(row.id, { [key]: value } as Partial<Retailer>)
    } catch {
      setRetailers((rows) => rows.map((r) => (r.id === row.id ? { ...r, [key]: prev } : r)))
      toast.error('Could not save change')
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

  // Segment counts. "active" hides Not-a-Customer (OTHER); "triage" = New
  // Companies (UNASSIGNED) awaiting review.
  const segCounts = useMemo(() => {
    let active = 0
    let triage = 0
    let dismissed = 0
    for (const r of retailers) {
      const s = statusOf(r)
      if (s === 'OTHER') dismissed++
      else active++
      if (s === 'UNASSIGNED') triage++
    }
    return { active, triage, dismissed, all: retailers.length }
  }, [retailers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return retailers.filter((r) => {
      const s = statusOf(r)
      if (segment === 'active' && s === 'OTHER') return false
      if (segment === 'triage' && s !== 'UNASSIGNED') return false
      if (segment === 'dismissed' && s !== 'OTHER') return false
      if (q && !textOf(r.name, r.domain, r.routing_aliases, r.customer_status, r.chain_type).includes(q)) return false
      return true
    })
  }, [retailers, query, segment])

  const columns: Column<Retailer>[] = [
    {
      key: 'name',
      header: 'Account',
      sortValue: (r) => r.name?.toLowerCase(),
      filterValue: (r) => r.name,
      cell: (r) => (
        <div className="flex items-center gap-[9px]">
          <AccountLogo name={r.name} domain={r.domain} size={20} />
          <div className="min-w-0">
            <div className="truncate font-[500] text-foreground">{r.name}</div>
            {r.domain ? (
              <div className="truncate text-[11px] text-muted-foreground">{r.domain}</div>
            ) : null}
          </div>
        </div>
      ),
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

  return (
    <AppPage
      listBar={
        <ListBar
          title="Accounts"
          subtitle="Retailer accounts"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search name, domain, aliases…"
          extra={
            <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
              <TabsList>
                {([
                  { id: 'active', label: 'Accounts', count: segCounts.active },
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
      {error ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          onRowClick={(r) => select(r)}
          onCellEdit={editCell}
          loading={loading}
          emptyIcon={<Building2 className="size-5" />}
          emptyTitle={segment === 'triage' ? 'Triage queue is clear' : 'No accounts match'}
          emptyDescription={
            segment === 'triage'
              ? 'No new companies awaiting review.'
              : 'Adjust your search or column filters.'
          }
          initialSort={{ key: 'name', dir: 'asc' }}
        />
      )}
      <AccountDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
