import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MailWarning, Plus } from 'lucide-react'
import { AppPage, ListBar, SectionHeader } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState } from '@/components/app/states'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { EmailDrawer } from '@/features/crm/components/EmailDrawer'
import { createIgnoreRule } from '@/features/crm/api'
import { MATCH_TYPES, WORKER_CADENCE, needsRouting } from '@/features/crm/constants'
import { formatDateTime, label, relatedName, textOf } from '@/features/crm/format'
import type { CrmEmailMessage } from '@/lib/types'

type Segment = 'needs' | 'routed' | 'skipped' | 'all'

export function EmailRoutingPage() {
  const { emails, ignoreRules, loading, error, refresh, firefliesOk, stats } = useCrmData()
  const [segment, setSegment] = useState<Segment>('needs')
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<CrmEmailMessage>('message', emails)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emails.filter((e) => {
      if (segment === 'needs' && !needsRouting(e.routing_status)) return false
      if (segment === 'routed' && e.routing_status !== 'ROUTED') return false
      if (segment === 'skipped' && e.routing_status !== 'SKIPPED') return false
      if (q && !textOf(e.subject, e.sender, e.recipients, relatedName(e.retailer), relatedName(e.department)).includes(q)) return false
      return true
    })
  }, [emails, segment, query])

  const columns: Column<CrmEmailMessage>[] = [
    {
      key: 'received_at',
      header: 'Date',
      hideBelow: 'md',
      sortValue: (e) => e.received_at ?? '',
      className: 'text-muted-foreground',
      cell: (e) => formatDateTime(e.received_at),
    },
    {
      key: 'subject',
      header: 'Subject',
      sortValue: (e) => e.subject?.toLowerCase() ?? '',
      filterValue: (e) => e.subject,
      className: 'w-full max-w-0',
      cell: (e) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{e.subject || '(no subject)'}</div>
          <div className="truncate text-xs text-muted-foreground">{e.sender}</div>
        </div>
      ),
    },
    {
      key: 'retailer',
      header: 'Account',
      hideBelow: 'lg',
      sortValue: (e) => relatedName(e.retailer),
      cell: (e) => <RelationLabel value={e.retailer} />,
    },
    {
      key: 'department',
      header: 'Department',
      hideBelow: 'xl',
      sortValue: (e) => relatedName(e.department),
      cell: (e) => <RelationLabel value={e.department} />,
    },
    {
      key: 'routing_status',
      header: 'Status',
      sortValue: (e) => e.routing_status ?? '',
      cell: (e) => <CrmStatusBadge kind="routing" status={e.routing_status} />,
    },
  ]

  const segments: { id: Segment; label: string; count: number }[] = [
    { id: 'needs', label: 'Needs routing', count: stats.needsRouting },
    { id: 'routed', label: 'Routed', count: stats.routed },
    { id: 'skipped', label: 'Skipped', count: stats.skipped },
    { id: 'all', label: 'All', count: emails.length },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Email Routing"
          subtitle="Outlook-ingested messages"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search subject, sender, recipient…"
          actions={
            <CrmStatusBadge kind="routing" status={firefliesOk ? 'ROUTED' : undefined} dot={false} />
          }
          extra={
            <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
              <TabsList>
                {segments.map((s) => (
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
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <DataTable
            rows={filtered}
            columns={columns}
            getRowId={(e) => e.id}
            onRowClick={(e) => select(e)}
            loading={loading}
            emptyIcon={<MailWarning className="size-5" />}
            emptyTitle={segment === 'needs' ? 'Inbox zero on routing' : 'No messages match'}
            emptyDescription={
              segment === 'needs'
                ? 'Every message has been routed or skipped.'
                : 'Adjust your search or segment.'
            }
          />
          <RoutingSidebar />
        </div>
      )}

      <EmailDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )

  function RoutingSidebar() {
    return (
      <aside className="space-y-4">
        <section className="rounded-[12px] border bg-card p-4 shadow-[var(--shadow-xs)]">
          <SectionHeader title="Worker cadence" description="Backend automation schedule" />
          <dl className="mt-3 space-y-2 text-sm">
            {WORKER_CADENCE.map((w) => (
              <div key={w.label} className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{w.label}</dt>
                <dd>
                  <Badge variant="outline">{w.cadence}</Badge>
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 border-t pt-2">
              <dt className="text-muted-foreground">Fireflies webhook</dt>
              <dd>
                <CrmStatusBadge
                  kind="routing"
                  status={firefliesOk === false ? 'UNROUTED' : firefliesOk ? 'ROUTED' : 'SKIPPED'}
                  dot
                />
              </dd>
            </div>
          </dl>
        </section>
        <IgnoreRulesPanel />
      </aside>
    )
  }

  function IgnoreRulesPanel() {
    const { setIgnoreRules } = useCrmData()
    const [pattern, setPattern] = useState('')
    const [matchType, setMatchType] = useState<string>('CONTAINS')
    const [busy, setBusy] = useState(false)

    async function add() {
      const value = pattern.trim()
      if (!value) return
      setBusy(true)
      try {
        const rule = await createIgnoreRule({ name: value, pattern: value, match_type: matchType, emails_skipped: 0 })
        setIgnoreRules((rows) => [rule, ...rows])
        setPattern('')
        toast.success('Ignore rule added')
      } catch {
        toast.error('Could not add ignore rule')
      } finally {
        setBusy(false)
      }
    }

    return (
      <section className="rounded-[12px] border bg-card p-4 shadow-[var(--shadow-xs)]">
        <SectionHeader title="Ignore rules" description={`${ignoreRules.length} active`} />
        <div className="mt-3 flex gap-2">
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Subject pattern"
            onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          />
          <Select value={matchType} onValueChange={setMatchType}>
            <SelectTrigger size="sm" className="shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_TYPES.map((m) => (
                <SelectItem key={m} value={m}>
                  {label(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon-sm" onClick={add} disabled={busy} title="Add ignore rule">
            <Plus className="size-4" />
          </Button>
        </div>
        <ul className="mt-3 space-y-2">
          {ignoreRules.slice(0, 12).map((rule) => (
            <li key={rule.id} className="rounded-[8px] border bg-muted/30 p-2">
              <div className="truncate text-[12.5px] font-medium">{rule.pattern}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {label(rule.match_type)} · {rule.emails_skipped || 0} skipped
              </div>
            </li>
          ))}
          {!ignoreRules.length ? (
            <li className="rounded-[8px] border border-dashed p-3 text-center text-[11.5px] text-muted-foreground">
              No ignore rules yet.
            </li>
          ) : null}
        </ul>
      </section>
    )
  }
}
