import { useMemo, useState } from 'react'
import { Contact } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { ContactDrawer } from '@/features/crm/components/ContactDrawer'
import { idOf, label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import { NameAvatar } from '@/components/app/NameAvatar'
import type { Buyer } from '@/lib/types'

type Segment = 'customer' | 'department' | 'triage' | 'all'

export function ContactsPage() {
  const { buyers, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('customer')
  const [selected, select] = useRecordSelection<Buyer>('contact', buyers)

  const segCounts = useMemo(() => {
    let customer = 0
    let department = 0
    let triage = 0
    for (const b of buyers) {
      const hasDepartment = Boolean(idOf(b.department))
      const hasRetailer = Boolean(idOf(b.retailer))
      if (hasDepartment) department++
      else if (hasRetailer) customer++
      else triage++
    }
    return { customer, department, triage, all: buyers.length }
  }, [buyers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return buyers.filter((b) => {
      const hasDepartment = Boolean(idOf(b.department))
      const hasRetailer = Boolean(idOf(b.retailer))
      if (segment === 'customer' && (!hasRetailer || hasDepartment)) return false
      if (segment === 'department' && !hasDepartment) return false
      if (segment === 'triage' && (hasRetailer || hasDepartment)) return false
      if (q && !textOf(b.name, b.email, b.job_title, relatedName(b.retailer), relatedName(b.department)).includes(q)) return false
      return true
    })
  }, [buyers, query, segment])

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
