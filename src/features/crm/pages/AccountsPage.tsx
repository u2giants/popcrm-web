import { useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { AppPage } from '@/components/app/AppPage'
import { PageToolbar } from '@/components/app/PageToolbar'
import { FilterSelect } from '@/components/app/FilterSelect'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/app/states'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { AccountDrawer } from '@/features/crm/components/AccountDrawer'
import { idOf, label, textOf } from '@/features/crm/format'
import { uniqueValues } from '@/features/crm/pages/_shared'
import type { Retailer } from '@/lib/types'

export function AccountsPage() {
  const { retailers, buyers, opportunities, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [chain, setChain] = useState('')
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
      (r) =>
        (!q || textOf(r.name, r.domain, r.routing_aliases, r.customer_status, r.chain_type).includes(q)) &&
        (!status || r.customer_status === status) &&
        (!chain || r.chain_type === chain),
    )
  }, [retailers, query, status, chain])

  const columns: Column<Retailer>[] = [
    {
      key: 'name',
      header: 'Account',
      sortValue: (r) => r.name?.toLowerCase(),
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    {
      key: 'domain',
      header: 'Domain',
      hideBelow: 'md',
      sortValue: (r) => r.domain ?? '',
      cell: (r) => <span className="text-muted-foreground">{r.domain || '—'}</span>,
    },
    {
      key: 'customer_status',
      header: 'Status',
      sortValue: (r) => r.customer_status ?? '',
      cell: (r) => <StatusBadge tone="info" dot={false}>{label(r.customer_status)}</StatusBadge>,
    },
    {
      key: 'chain_type',
      header: 'Chain type',
      hideBelow: 'lg',
      sortValue: (r) => r.chain_type ?? '',
      cell: (r) => <span className="text-muted-foreground">{label(r.chain_type)}</span>,
    },
    {
      key: 'contacts',
      header: 'Contacts',
      hideBelow: 'lg',
      sortValue: (r) => counts.contacts.get(r.id) ?? 0,
      className: 'text-right tabular-nums',
      headClassName: 'text-right',
      cell: (r) => counts.contacts.get(r.id) ?? 0,
    },
    {
      key: 'opps',
      header: 'Opportunities',
      hideBelow: 'xl',
      sortValue: (r) => counts.opps.get(r.id) ?? 0,
      className: 'text-right tabular-nums',
      headClassName: 'text-right',
      cell: (r) => counts.opps.get(r.id) ?? 0,
    },
  ]

  return (
    <AppPage
      title="Accounts"
      description="Retailers and accounts across the customer base."
      actions={<Badge variant="outline">{filtered.length.toLocaleString()} shown</Badge>}
      toolbar={
        <PageToolbar
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search name, domain, aliases…"
          showClear={!!(status || chain)}
          onClear={() => { setStatus(''); setChain('') }}
          filters={
            <>
              <FilterSelect
                value={status}
                onChange={setStatus}
                allLabel="All statuses"
                placeholder="Status"
                options={uniqueValues(retailers, (r) => r.customer_status)}
              />
              <FilterSelect
                value={chain}
                onChange={setChain}
                allLabel="All chain types"
                placeholder="Chain type"
                options={uniqueValues(retailers, (r) => r.chain_type)}
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
          getRowId={(r) => r.id}
          onRowClick={(r) => select(r)}
          loading={loading}
          emptyIcon={<Building2 className="size-5" />}
          emptyTitle="No accounts match"
          emptyDescription="Adjust your search or filters."
          initialSort={{ key: 'name', dir: 'asc' }}
        />
      )}
      <AccountDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
