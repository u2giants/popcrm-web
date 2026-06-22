import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { MeetingDrawer } from '@/features/crm/components/MeetingDrawer'
import { formatDate, idOf, label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import {
  crmKeys,
  listData,
  useDepartmentsQuery,
  useIngestedContactsQuery,
  useIngestedDomainsQuery,
  useMeetingsQuery,
  useUpdateMeetingMutation,
} from '@/features/crm/queries'
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
  const queryClient = useQueryClient()
  const meetingsQuery = useMeetingsQuery(50)
  const retailersQuery = useIngestedDomainsQuery(100)
  const departmentsQuery = useDepartmentsQuery(300)
  const buyersQuery = useIngestedContactsQuery(100)
  const updateMeetingMutation = useUpdateMeetingMutation()
  const meetings = listData(meetingsQuery.data)
  const retailers = listData(retailersQuery.data)
  const departments = listData(departmentsQuery.data)
  const buyers = listData(buyersQuery.data)
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('customers')
  const [selected, select] = useRecordSelection<CrmMeetingNote>('meeting', meetings)
  const retailerById = useMemo(() => new Map(retailers.map((r) => [r.id, r])), [retailers])
  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments])
  const buyerById = useMemo(() => new Map(buyers.map((b) => [b.id, b])), [buyers])
  const accountOptions = useMemo<EditOption[]>(
    () => [{ value: '', label: 'Unassigned' }, ...retailers.map((r) => ({ value: r.id, label: r.name }))],
    [retailers],
  )
  const departmentOptions = useMemo<EditOption[]>(
    () => [{ value: '', label: 'Unassigned' }, ...departments.map((d) => ({ value: d.id, label: d.name }))],
    [departments],
  )
  const contactOptions = useMemo<EditOption[]>(
    () => [{ value: '', label: 'Unassigned' }, ...buyers.map((b) => ({ value: b.id, label: b.name }))],
    [buyers],
  )
  const sourceOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'Unspecified' },
      ...Array.from(new Set(meetings.map((m) => m.source).filter(Boolean) as string[]))
        .sort((a, b) => label(a).localeCompare(label(b)))
        .map((v) => ({ value: v, label: label(v) })),
    ],
    [meetings],
  )

  async function editCell(row: CrmMeetingNote, key: string, value: string) {
    const prev = (row as unknown as Record<string, unknown>)[key]
    const nextValue = value || null
    const expanded =
      key === 'retailer'
        ? retailerById.get(value) ?? null
        : key === 'department'
          ? departmentById.get(value) ?? null
          : key === 'contact'
            ? buyerById.get(value) ?? null
            : nextValue
    queryClient.setQueryData<CrmMeetingNote[]>(crmKeys.meetings(50), (rows = []) =>
      rows.map((m) => (m.id === row.id ? { ...m, [key]: expanded } : m)),
    )
    try {
      await updateMeetingMutation.mutateAsync({ id: row.id, values: { [key]: nextValue } as Partial<CrmMeetingNote> })
    } catch {
      queryClient.setQueryData<CrmMeetingNote[]>(crmKeys.meetings(50), (rows = []) =>
        rows.map((m) => (m.id === row.id ? { ...m, [key]: prev } : m)),
      )
      toast.error('Could not save change')
    }
  }

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
      opensDetail: true,
      sortValue: (m) => m.date ?? '',
      filterValue: (m) => m.date,
      className: 'text-muted-foreground',
      cell: (m) => formatDate(m.date),
    },
    {
      key: 'name',
      header: 'Meeting',
      opensDetail: true,
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
      editOptions: accountOptions,
      editValue: (m) => idOf(m.retailer),
      cell: (m) => <RelationLabel value={m.retailer} />,
    },
    {
      key: 'contact',
      header: 'Contact',
      hideBelow: 'lg',
      sortValue: (m) => relatedName(m.contact),
      filterValue: (m) => relatedName(m.contact),
      editOptions: contactOptions,
      editValue: (m) => idOf(m.contact),
      cell: (m) => <RelationLabel value={m.contact} />,
    },
    {
      key: 'department',
      header: 'Department',
      hideBelow: 'lg',
      sortValue: (m) => relatedName(m.department),
      filterValue: (m) => relatedName(m.department),
      editOptions: departmentOptions,
      editValue: (m) => idOf(m.department),
      cell: (m) => <RelationLabel value={m.department} />,
    },
    {
      key: 'source',
      header: 'Source',
      hideBelow: 'lg',
      sortValue: (m) => m.source ?? '',
      filterValue: (m) => label(m.source),
      editOptions: sourceOptions,
      editValue: (m) => m.source,
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
          segments={
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
      {meetingsQuery.isError ? (
        <ErrorState onRetry={() => void meetingsQuery.refetch()} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(m) => m.id}
          onRowClick={(m) => select(m)}
          onCellEdit={editCell}
          loading={meetingsQuery.isPending || retailersQuery.isPending || departmentsQuery.isPending || buyersQuery.isPending}
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
