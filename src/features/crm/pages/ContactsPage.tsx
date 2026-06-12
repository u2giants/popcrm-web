import { useMemo, useState } from 'react'
import { Contact } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { FilterSelect } from '@/components/app/FilterSelect'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { ContactDrawer } from '@/features/crm/components/ContactDrawer'
import { idOf, label, relatedName, textOf } from '@/features/crm/format'
import { uniqueValues } from '@/features/crm/pages/_shared'
import { StatusBadge } from '@/components/app/StatusBadge'
import type { Buyer } from '@/lib/types'

export function ContactsPage() {
  const { buyers, retailers, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [scope, setScope] = useState('')
  const [retailer, setRetailer] = useState('')
  const [selected, select] = useRecordSelection<Buyer>('contact', buyers)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return buyers.filter(
      (b) =>
        (!q || textOf(b.name, b.email, b.job_title, relatedName(b.retailer), relatedName(b.department)).includes(q)) &&
        (!type || b.contact_type === type) &&
        (!scope || b.scope === scope) &&
        (!retailer || idOf(b.retailer) === retailer),
    )
  }, [buyers, query, type, scope, retailer])

  const columns: Column<Buyer>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (b) => b.name?.toLowerCase(),
      filterValue: (b) => b.name,
      cell: (b) => <span className="font-medium text-foreground">{b.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      hideBelow: 'md',
      sortValue: (b) => b.email ?? '',
      cell: (b) => <span className="text-muted-foreground">{b.email || '—'}</span>,
    },
    {
      key: 'retailer',
      header: 'Account',
      sortValue: (b) => relatedName(b.retailer),
      cell: (b) => <RelationLabel value={b.retailer} />,
    },
    {
      key: 'job_title',
      header: 'Title',
      hideBelow: 'lg',
      sortValue: (b) => b.job_title ?? '',
      cell: (b) => <span className="text-muted-foreground">{b.job_title || '—'}</span>,
    },
    {
      key: 'contact_type',
      header: 'Type',
      hideBelow: 'lg',
      sortValue: (b) => b.contact_type ?? '',
      cell: (b) => b.contact_type ? <StatusBadge tone="neutral" dot={false}>{label(b.contact_type)}</StatusBadge> : '—',
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
          showClear={!!(type || scope || retailer)}
          onClear={() => { setType(''); setScope(''); setRetailer('') }}
          filters={
            <>
              <FilterSelect
                value={retailer}
                onChange={setRetailer}
                allLabel="All accounts"
                placeholder="Account"
                options={retailers.map((r) => ({ value: r.id, label: r.name }))}
              />
              <FilterSelect
                value={type}
                onChange={setType}
                allLabel="All types"
                placeholder="Type"
                options={uniqueValues(buyers, (b) => b.contact_type)}
              />
              <FilterSelect
                value={scope}
                onChange={setScope}
                allLabel="All scopes"
                placeholder="Scope"
                options={uniqueValues(buyers, (b) => b.scope)}
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
          getRowId={(b) => b.id}
          onRowClick={(b) => select(b)}
          loading={loading}
          emptyIcon={<Contact className="size-5" />}
          emptyTitle="No contacts match"
          emptyDescription="Adjust your search or filters."
          initialSort={{ key: 'name', dir: 'asc' }}
        />
      )}
      <ContactDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
