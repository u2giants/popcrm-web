import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { FilterSelect } from '@/components/app/FilterSelect'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { MeetingDrawer } from '@/features/crm/components/MeetingDrawer'
import { idOf, formatDate, label, relatedName, textOf } from '@/features/crm/format'
import { uniqueValues } from '@/features/crm/pages/_shared'
import { StatusBadge } from '@/components/app/StatusBadge'
import type { CrmMeetingNote } from '@/lib/types'

export function MeetingsPage() {
  const { meetings, retailers, loading, error, refresh } = useCrmData()
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('')
  const [retailer, setRetailer] = useState('')
  const [selected, select] = useRecordSelection<CrmMeetingNote>('meeting', meetings)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return meetings.filter(
      (m) =>
        (!q || textOf(m.name, m.participants, m.summary, relatedName(m.retailer), relatedName(m.contact)).includes(q)) &&
        (!source || m.source === source) &&
        (!retailer || idOf(m.retailer) === retailer),
    )
  }, [meetings, query, source, retailer])

  const columns: Column<CrmMeetingNote>[] = [
    {
      key: 'date',
      header: 'Date',
      sortValue: (m) => m.date ?? '',
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
      cell: (m) => <RelationLabel value={m.retailer} />,
    },
    {
      key: 'contact',
      header: 'Contact',
      hideBelow: 'lg',
      sortValue: (m) => relatedName(m.contact),
      cell: (m) => <RelationLabel value={m.contact} />,
    },
    {
      key: 'source',
      header: 'Source',
      hideBelow: 'lg',
      sortValue: (m) => m.source ?? '',
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
          showClear={!!(source || retailer)}
          onClear={() => { setSource(''); setRetailer('') }}
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
                value={source}
                onChange={setSource}
                allLabel="All sources"
                placeholder="Source"
                options={uniqueValues(meetings, (m) => m.source)}
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
          getRowId={(m) => m.id}
          onRowClick={(m) => select(m)}
          loading={loading}
          emptyIcon={<CalendarDays className="size-5" />}
          emptyTitle="No meetings match"
          emptyDescription="Adjust your search or filters."
          initialSort={{ key: 'date', dir: 'desc' }}
        />
      )}
      <MeetingDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
