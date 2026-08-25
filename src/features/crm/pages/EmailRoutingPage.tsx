import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MailWarning, Plus } from 'lucide-react'
import { AppPage, ListBar, SectionHeader } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption } from '@/components/app/DataTable'
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
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { EmailDrawer } from '@/features/crm/components/EmailDrawer'
import { MATCH_TYPES, ROUTING_STATUSES, WORKER_CADENCE, needsRouting } from '@/features/crm/constants'
import { formatDateTime, idOf, label, relatedName, textOf } from '@/features/crm/format'
import { customerEditOptions, withCurrentCustomer, buildRetailerById } from '@/features/crm/pages/_shared'
import { useAuth } from '@/auth/auth'
import {
  listData,
  useCreateIgnoreRuleMutation,
  useDepartmentsQuery,
  useEmailsQuery,
  useEmailSegmentCountsQuery,
  useFirefliesHealth,
  useIgnoreRulesQuery,
  useCustomerPickerQuery,
  useOpportunitiesQuery,
  useUpdateEmailMutation,
} from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import type { CrmEmailMessage } from '@/lib/types'

type Segment = 'company' | 'department' | 'program' | 'triage' | 'all'
const EMAIL_ROUTE_LIMIT = 500

const METHOD_LABEL: Record<string, string> = {
  DETERMINISTIC: 'Rule match',
  AI: 'AI classify',
  MANUAL: 'Manual',
}

function MethodChip({ method }: { method: string | null | undefined }) {
  if (!method) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center rounded-full border px-[8px] py-[2px] text-[11px] font-[550] text-muted-foreground">
      {METHOD_LABEL[method] ?? label(method)}
    </span>
  )
}

export function EmailRoutingPage() {
  const emailsQuery = useEmailsQuery(EMAIL_ROUTE_LIMIT)
  const countsQuery = useEmailSegmentCountsQuery()
  const ignoreRulesQuery = useIgnoreRulesQuery()
  const retailersQuery = useCustomerPickerQuery(-1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const fireflies = useFirefliesHealth()
  const updateEmailMutation = useUpdateEmailMutation()
  const createIgnoreRuleMutation = useCreateIgnoreRuleMutation()
  const emails = listData(emailsQuery.data)
  const ignoreRules = listData(ignoreRulesQuery.data)
  const retailers = listData(retailersQuery.data)
  const departments = listData(departmentsQuery.data)
  const opportunities = listData(opportunitiesQuery.data)
  const firefliesOk = fireflies.data ?? null
  const loading = emailsQuery.isPending || retailersQuery.isPending || departmentsQuery.isPending || opportunitiesQuery.isPending
  const error = emailsQuery.isError
  const { user } = useAuth()
  const roleText = `${user?.role?.name ?? ''} ${user?.role?.id ?? ''}`.toLowerCase()
  const canSeeAll = /admin/.test(roleText)
  const [segment, setSegment] = useState<Segment>('triage')
  const [query, setQuery] = useState('')
  const [selected, select] = useRecordSelection<CrmEmailMessage>('message', emails)
  const retailerById = useMemo(
    () => buildRetailerById(retailers, emails.map((e) => (typeof e.retailer === 'object' ? e.retailer : null))),
    [retailers, emails],
  )
  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments])
  const opportunityById = useMemo(() => new Map(opportunities.map((o) => [o.id, o])), [opportunities])
  const customerOptions = useMemo<EditOption[]>(
    () => customerEditOptions(retailers),
    [retailers],
  )
  const departmentOptions = useMemo<EditOption[]>(
    () => [{ value: '', label: 'Unassigned' }, ...departments.map((d) => ({ value: d.id, label: d.name }))],
    [departments],
  )
  const programOptions = useMemo<EditOption[]>(
    () => [
      { value: '', label: 'Unassigned' },
      ...opportunities.map((o) => ({ value: o.id, label: o.name || 'Untitled program' })),
    ],
    [opportunities],
  )
  const statusOptions = useMemo<EditOption[]>(
    () => ROUTING_STATUSES.map((v) => ({ value: v, label: label(v) })),
    [],
  )

  function emailBucket(e: CrmEmailMessage): Exclude<Segment, 'all'> {
    if (needsRouting(e.routing_status)) return 'triage'
    if (idOf(e.opportunity)) return 'program'
    if (idOf(e.department)) return 'department'
    if (idOf(e.retailer)) return 'company'
    return 'triage'
  }

  async function editCell(row: CrmEmailMessage, key: string, value: string) {
    const nextValue = value || null
    const expanded =
      key === 'retailer'
        ? retailerById.get(value) ?? null
        : key === 'department'
          ? departmentById.get(value) ?? null
          : key === 'opportunity'
            ? opportunityById.get(value) ?? null
            : nextValue
    try {
      await updateEmailMutation.mutateAsync({ id: row.id, values: { [key]: expanded ?? nextValue } as Partial<CrmEmailMessage> })
    } catch (error) {
      toast.error('Could not save change', { description: logError('EmailRoutingPage.editCell', error) })
    }
  }

  const localSegCounts = useMemo(() => {
    const counts = { company: 0, department: 0, program: 0, triage: 0, all: emails.length }
    for (const e of emails) counts[emailBucket(e)]++
    return counts
  }, [emails])
  const segCounts = countsQuery.data ?? localSegCounts

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emails.filter((e) => {
      if (segment !== 'all' && emailBucket(e) !== segment) return false
      if (
        q &&
        !textOf(
          e.subject,
          e.sender,
          e.recipients,
          relatedName(e.retailer),
          relatedName(e.department),
          relatedName(e.opportunity),
        ).includes(q)
      ) return false
      return true
    })
  }, [emails, segment, query])

  const columns: Column<CrmEmailMessage>[] = [
    {
      key: 'received_at',
      header: 'Date',
      opensDetail: true,
      hideBelow: 'md',
      sortValue: (e) => e.received_at ?? '',
      className: 'text-muted-foreground',
      cell: (e) => formatDateTime(e.received_at),
    },
    {
      key: 'subject',
      header: 'Subject',
      opensDetail: true,
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
      header: 'Customer',
      hideBelow: 'lg',
      sortValue: (e) => relatedName(e.retailer),
      filterValue: (e) => relatedName(e.retailer),
      editOptions: (e) => withCurrentCustomer(customerOptions, idOf(e.retailer), retailerById),
      editValue: (e) => idOf(e.retailer),
      cell: (e) => <CustomerRelationLogo value={e.retailer} customerById={retailerById} />,
    },
    {
      key: 'department',
      header: 'Dept.',
      hideBelow: 'lg',
      sortValue: (e) => relatedName(e.department),
      filterValue: (e) => relatedName(e.department),
      editOptions: departmentOptions,
      editValue: (e) => idOf(e.department),
      cell: (e) => <RelationLabel value={e.department} />,
    },
    {
      key: 'opportunity',
      header: 'Program',
      hideBelow: 'xl',
      sortValue: (e) => relatedName(e.opportunity),
      filterValue: (e) => relatedName(e.opportunity),
      editOptions: programOptions,
      editValue: (e) => idOf(e.opportunity),
      cell: (e) => <RelationLabel value={e.opportunity} />,
    },
    {
      key: 'routing_method',
      header: 'Method',
      opensDetail: true,
      hideBelow: 'lg',
      sortValue: (e) => e.routing_method ?? '',
      filterValue: (e) => e.routing_method,
      filterLabel: (v) => METHOD_LABEL[v] ?? label(v),
      cell: (e) => <MethodChip method={e.routing_method} />,
    },
    {
      key: 'routing_status',
      header: 'Status',
      sortValue: (e) => e.routing_status ?? '',
      filterValue: (e) => e.routing_status,
      filterLabel: (v) => label(v),
      editOptions: statusOptions,
      editValue: (e) => e.routing_status,
      cell: (e) => <CrmStatusBadge kind="routing" status={e.routing_status} />,
    },
  ]

  const segments: { id: Segment; label: string; count: number }[] = [
    { id: 'company', label: 'Company', count: segCounts.company },
    { id: 'department', label: 'Dept.', count: segCounts.department },
    { id: 'program', label: 'Program', count: segCounts.program },
    { id: 'triage', label: 'Triage', count: segCounts.triage },
    ...(canSeeAll ? [{ id: 'all' as const, label: 'All', count: segCounts.all }] : []),
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
          segments={
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
        <ErrorState onRetry={() => void emailsQuery.refetch()} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <DataTable
            rows={filtered}
            columns={columns}
            getRowId={(e) => e.id}
            onRowClick={(e) => select(e)}
            onCellEdit={editCell}
            loading={loading}
            emptyIcon={<MailWarning className="size-5" />}
            emptyTitle={segment === 'triage' ? 'Inbox zero on routing' : 'No messages match'}
            emptyDescription={
              segment === 'triage'
                ? 'Every message has a CRM routing decision.'
                : 'Adjust your search or segment.'
            }
            initialSort={{ key: 'received_at', dir: 'desc' }}
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
    const [pattern, setPattern] = useState('')
    const [ruleType, setRuleType] = useState<string>('SUBJECT')
    const [matchType, setMatchType] = useState<string>('CONTAINS')
    const [busy, setBusy] = useState(false)

    async function add() {
      const value = pattern.trim()
      if (!value) return
      setBusy(true)
      try {
        await createIgnoreRuleMutation.mutateAsync({
          name: value,
          pattern: value,
          rule_type: ruleType,
          match_type: ruleType === 'SUBJECT' ? matchType : 'EXACT',
          emails_skipped: 0,
        })
        setPattern('')
        toast.success('Ignore rule added')
      } catch (error) {
        toast.error('Could not add ignore rule', { description: logError('EmailRoutingPage.addIgnoreRule', error) })
      } finally {
        setBusy(false)
      }
    }

    return (
      <section className="rounded-[12px] border bg-card p-4 shadow-[var(--shadow-xs)]">
        <SectionHeader
          title="Not-customer rules"
          description="Address rules skip only when no Customer domain is present"
        />
        <div className="mt-3 grid gap-2">
          <Select value={ruleType} onValueChange={setRuleType}>
            <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SUBJECT">Subject pattern</SelectItem>
              <SelectItem value="DOMAIN">Email domain</SelectItem>
              <SelectItem value="EMAIL_ADDRESS">Exact email address</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={ruleType === 'DOMAIN' ? 'example.com' : ruleType === 'EMAIL_ADDRESS' ? 'person@example.com' : 'Subject pattern'}
            onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          />
          {ruleType === 'SUBJECT' ? <Select value={matchType} onValueChange={setMatchType}>
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
          </Select> : null}
          <Button size="icon-sm" onClick={add} disabled={busy} title="Add ignore rule">
            <Plus className="size-4" />
          </Button>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {ignoreRules.slice(0, 12).map((rule) => (
            <li key={rule.id} className="rounded-[8px] border bg-muted/30 p-2">
              <div className="truncate text-[12.5px] font-medium">{rule.pattern}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {label(rule.rule_type || 'SUBJECT')} · {label(rule.match_type)} · {rule.emails_skipped || 0} skipped
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
