import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { MeetingDrawer } from '@/features/crm/components/MeetingDrawer'
import { formatDate, label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import type { CrmMeetingNote, Retailer } from '@/lib/types'

type Segment = 'customers' | 'triage' | 'dismissed' | 'all'

// Derive the linked account's customer_status for segment filtering.
// No linked account → treat as triage (system unsure).
function acctStatusOf(m: CrmMeetingNote): string {
  const r = m.retailer
  if (!r || typeof r === 'string') return 'UNASSIGNED'
  return (r as Retailer).customer_status || 'UNASSIGNED'
}

export function MeetingsPage() {
  const { meetings, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('customers')
  const [selected, select] = useRecordSelection<CrmMeetingNote>('meeting', meetings)

  const segCounts = useMemo(() => {
    let customers = 0
    let triage = 0
    let dismissed = 0
    for (const m of meetings) {
      const s = acctStatusOf(m)
      if (s === 'OTHER') dismissed++
      else if (s === 'UNASSIGNED') triage++
      else customers++
    }
    return { customers, triage, dismissed, all: meetings.length }
  }, [meetings])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return meetings.filter((m) => {
      const s = acctStatusOf(m)
      if (segment === 'customers' && (s === 'OTHER' || s === 'UNASSIGNED')) return false
      if (segment === 'triage' && s !== 'UNASSIGNED') return false
      if (segment === 'dismissed' && s !== 'OTHER') return false
      if (q && !textOf(m.name, m.participants, m.summary, relatedName(m.retailer), relatedName(m.contact)).includes(q)) return false
      return true
    })
  }, [meetings, query, segment])

  const columns: Column<CrmMeetingNote>[] = [
    {
      key: 'date',
      header: 'Date',
      sortValue: (m) => m.date ?? '',
      filterValue: (m) => m.date,
      className: 'text-muted-foreground',
      cell: (m) => formatDate(m.date),
    },
    {
      key: 'name',
      header: 'Meeting',
      sortValue: (m) => m.name?.toLowerCase() ?? '',
      filterValue: (m) => m.name,
      className: 'w-full max-w-0',
      cell: (m) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{m.name || 'Meeting'}</div>
          <div className="truncate text-xs text-muted-foreground">{m.summary || m.participants}</div>
        </div>
      ),
    },
    {
      key: 'retailer',
      header: 'Account',
      hideBelow: 'md',
      sortValue: (m) => relatedName(m.retailer),
      filterValue: (m) => relatedName(m.retailer),
      cell: (m) => <RelationLabel value={m.retailer} />,
    },
    {
      key: 'contact',
      header: 'Contact',
      hideBelow: 'lg',
      sortValue: (m) => relatedName(m.contact),
      filterValue: (m) => relatedName(m.contact),
      cell: (m) => <RelationLabel value={m.contact} />,
    },
    {
      key: 'source',
      header: 'Source',
      hideBelow: 'lg',
      sortValue: (m) => m.source ?? '',
      filterValue: (m) => label(m.source),
      cell: (m) => m.source ? <StatusBadge tone="neutral" dot={false}>{label(m.source)}</StatusBadge> : '—',
    },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Meetings"
          subtitle="Fireflies and imported meeting notes"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search title, participants, summary…"
          extra={
            <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
              <TabsList>
                {([
                  { id: 'customers', label: 'Customers', count: segCounts.customers },
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
          getRowId={(m) => m.id}
          onRowClick={(m) => select(m)}
          loading={loading}
          emptyIcon={<CalendarDays className="size-5" />}
          emptyTitle={segment === 'triage' ? 'Triage queue is clear' : 'No meetings match'}
          emptyDescription={
            segment === 'triage'
              ? 'No meetings linked to unclassified accounts.'
              : 'Adjust your search or column filters.'
          }
          initialSort={{ key: 'date', dir: 'desc' }}
        />
      )}
      <MeetingDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
