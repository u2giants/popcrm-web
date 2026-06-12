import { useMemo, useState } from 'react'
import { Contact } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { ContactDrawer } from '@/features/crm/components/ContactDrawer'
import { label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import { NameAvatar } from '@/components/app/NameAvatar'
import type { Buyer } from '@/lib/types'

export function ContactsPage() {
  const { buyers, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<Buyer>('contact', buyers)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return buyers.filter(
      (b) => !q || textOf(b.name, b.email, b.job_title, relatedName(b.retailer), relatedName(b.department)).includes(q),
    )
  }, [buyers, query])

  const columns: Column<Buyer>[] = [
    {
      key: 'name',
      header: 'Contact',
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
      cell: (b) => <span className="text-muted-foreground">{b.job_title || '—'}</span>,
    },
    {
      key: 'retailer',
      header: 'Account',
      sortValue: (b) => relatedName(b.retailer),
      filterValue: (b) => relatedName(b.retailer),
      cell: (b) => <RelationLabel value={b.retailer} />,
    },
    {
      key: 'department',
      header: 'Department',
      hideBelow: 'lg',
      sortValue: (b) => relatedName(b.department),
      filterValue: (b) => relatedName(b.department),
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
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'name', dir: 'asc' }}
        />
      )}
      <ContactDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
