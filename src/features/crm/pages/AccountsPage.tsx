import { useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StatusBadge } from '@/components/app/StatusBadge'
import { ErrorState } from '@/components/app/states'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { AccountDrawer } from '@/features/crm/components/AccountDrawer'
import { idOf, label, textOf } from '@/features/crm/format'
import { NameAvatar } from '@/components/app/NameAvatar'
import type { Retailer } from '@/lib/types'

export function AccountsPage() {
  const { retailers, buyers, opportunities, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<Retailer>('retailer', retailers)

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return retailers.filter(
      (r) => !q || textOf(r.name, r.domain, r.routing_aliases, r.customer_status, r.chain_type).includes(q),
    )
  }, [retailers, query])

  const STATUS_TONE: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
    ACTIVE: 'success',
    PROSPECT: 'info',
    AT_RISK: 'warning',
  }

  const columns: Column<Retailer>[] = [
    {
      key: 'name',
      header: 'Account',
      sortValue: (r) => r.name?.toLowerCase(),
      filterValue: (r) => r.name,
      cell: (r) => (
        <div className="flex items-center gap-[9px]">
          <NameAvatar name={r.name} size={20} />
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
      sortValue: (r) => r.customer_status ?? '',
      filterValue: (r) => label(r.customer_status),
      cell: (r) => (
        <StatusBadge tone={STATUS_TONE[r.customer_status ?? ''] ?? 'neutral'} dot>
          {label(r.customer_status)}
        </StatusBadge>
      ),
    },
    {
      key: 'chain_type',
      header: 'Chain',
      hideBelow: 'lg',
      sortValue: (r) => r.chain_type ?? '',
      filterValue: (r) => label(r.chain_type),
      cell: (r) => <span className="text-muted-foreground">{label(r.chain_type)}</span>,
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
          loading={loading}
          emptyIcon={<Building2 className="size-5" />}
          emptyTitle="No accounts match"
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'name', dir: 'asc' }}
        />
      )}
      <AccountDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
