import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MailWarning } from 'lucide-react'
import { AppPage, ListBar, SectionHeader } from '@/components/app/AppPage'
import { DataTable, type Column, type EditOption, type CellEditContext } from '@/components/app/DataTable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/app/states'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { EmailDrawer } from '@/features/crm/components/EmailDrawer'
import { ROUTING_STATUSES, WORKER_CADENCE } from '@/features/crm/constants'
import { formatDateTime, idOf, label, relatedName, textOf } from '@/features/crm/format'
import { customerEditOptions, withCurrentCustomer, buildRetailerById } from '@/features/crm/pages/_shared'
import { useAuth } from '@/auth/auth'
import {
  listData,
  useDepartmentsQuery,
  useEmailsQuery,
  useEmailSegmentCountsQuery,
  useFirefliesHealth,
  useCustomerPickerQuery,
  useOpportunitiesQuery,
  useUpdateEmailMutation,
  useCustomerDisplayName,
} from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import type { CrmEmailMessage } from '@/lib/types'

// Every message is routed in three levels: company -> department -> program.
// A message's stage is the first level it is still missing.
type Stage = 'needs_company' | 'needs_department' | 'needs_program' | 'routed' | 'skipped'
type Segment = Stage | 'all'
// Largest window the server's fast recent-messages feed returns. Counts and
// lists are both computed from this same window so they always agree.
const EMAIL_ROUTE_LIMIT = 1000

const STAGES: { id: Stage; label: string; hint: string; empty: string }[] = [
  { id: 'needs_company', label: 'Needs company', hint: 'Step 1 — pick the customer', empty: 'Every message has a company.' },
  { id: 'needs_department', label: 'Needs department', hint: 'Step 2 — pick the department', empty: 'Every message with a company has a department.' },
  { id: 'needs_program', label: 'Needs program', hint: 'Step 3 — pick the program', empty: 'Every message with a department has a program.' },
  { id: 'routed', label: 'Fully routed', hint: 'Company, department and program set', empty: 'No fully routed messages yet.' },
  { id: 'skipped', label: 'Skipped', hint: 'Not customer business', empty: 'No skipped messages.' },
]

function stageOf(e: Pick<CrmEmailMessage, 'routing_status' | 'retailer' | 'department' | 'opportunity'>): Stage {
  if (idOf(e.opportunity)) return 'routed'
  if (e.routing_status === 'SKIPPED') return 'skipped'
  if (!idOf(e.retailer)) return 'needs_company'
  if (!idOf(e.department)) return 'needs_department'
  return 'needs_program'
}

// Status that matches what has been assigned, so the backend label never
// contradicts the routing levels shown on screen.
function statusFor(company: string | null, department: string | null, program: string | null) {
  if (program) return 'ROUTED'
  if (department) return 'COMPANY_DEPT'
  if (company) return 'COMPANY_ONLY'
  return 'UNROUTED'
}

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
  const customerName = useCustomerDisplayName()
  const emailsQuery = useEmailsQuery(EMAIL_ROUTE_LIMIT)
  const countsQuery = useEmailSegmentCountsQuery()
  const retailersQuery = useCustomerPickerQuery(-1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const fireflies = useFirefliesHealth()
  const updateEmailMutation = useUpdateEmailMutation()
  const emails = listData(emailsQuery.data)
  const retailers = listData(retailersQuery.data)
  const departments = listData(departmentsQuery.data)
  const opportunities = listData(opportunitiesQuery.data)
  const firefliesOk = fireflies.data ?? null
  const loading = emailsQuery.isPending || retailersQuery.isPending || departmentsQuery.isPending || opportunitiesQuery.isPending
  const error = emailsQuery.isError
  const { user } = useAuth()
  const roleText = `${user?.role?.name ?? ''} ${user?.role?.id ?? ''}`.toLowerCase()
  const canSeeAll = /admin/.test(roleText)
  const [segment, setSegment] = useState<Segment>('needs_company')
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
  // Each level only offers choices that belong to the level above it.
  function departmentOptionsFor(e: CrmEmailMessage): EditOption[] {
    const company = idOf(e.retailer)
    const pool = company ? departments.filter((d) => idOf(d.retailer) === company) : []
    return [{ value: '', label: company ? 'Unassigned' : 'Pick a company first' }, ...pool.map((d) => ({ value: d.id, label: d.name }))]
  }
  function programOptionsFor(e: CrmEmailMessage): EditOption[] {
    const dept = idOf(e.department)
    const pool = dept ? opportunities.filter((o) => idOf(o.department) === dept) : []
    return [
      { value: '', label: dept ? 'Unassigned' : 'Pick a department first' },
      ...pool.map((o) => ({ value: o.id, label: o.name || 'Untitled program' })),
    ]
  }
  const statusOptions = useMemo<EditOption[]>(
    () => ROUTING_STATUSES.map((v) => ({ value: v, label: label(v) })),
    [],
  )

  async function editCell(row: CrmEmailMessage, key: string, value: string, edit?: CellEditContext) {
    const v = value || null
    let values: Partial<CrmEmailMessage>
    if (key === 'retailer' || key === 'department' || key === 'opportunity') {
      // Changing a level clears the levels below it (they belonged to the old choice).
      let company = idOf(row.retailer) || null
      let dept = idOf(row.department) || null
      let program = idOf(row.opportunity) || null
      if (key === 'retailer') { company = v; dept = null; program = null }
      if (key === 'department') { dept = v; program = null }
      if (key === 'opportunity') program = v
      values = {
        retailer: company ? retailerById.get(company) ?? company : null,
        department: dept ? departmentById.get(dept) ?? dept : null,
        opportunity: program ? opportunityById.get(program) ?? program : null,
        routing_status: statusFor(company, dept, program),
        routing_method: 'MANUAL',
      } as Partial<CrmEmailMessage>
    } else {
      values = { [key]: v } as Partial<CrmEmailMessage>
    }
    try {
      await updateEmailMutation.mutateAsync({ id: row.id, values })
    } catch (error) {
      // A bulk edit reports failures once, as a summary, so let the table count them.
      if (edit?.bulk) throw error
      toast.error('Could not save change', { description: logError('EmailRoutingPage.editCell', error) })
    }
  }

  const stageCounts = useMemo(() => {
    const counts: Record<Segment, number> = { needs_company: 0, needs_department: 0, needs_program: 0, routed: 0, skipped: 0, all: emails.length }
    for (const e of emails) counts[stageOf(e)]++
    return counts
  }, [emails])
  const totalMessages = countsQuery.data?.all ?? null
  const oldest = emails.reduce<string | null>((min, e) => (e.received_at && (!min || e.received_at < min) ? e.received_at : min), null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emails.filter((e) => {
      if (segment !== 'all' && stageOf(e) !== segment) return false
      if (
        q &&
        !textOf(
          e.subject,
          e.sender,
          e.recipients,
          customerName(e.retailer),
          relatedName(e.department),
          relatedName(e.opportunity),
        ).includes(q)
      ) return false
      return true
    })
  }, [emails, segment, query, customerName])

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
      sortValue: (e) => customerName(e.retailer),
      filterValue: (e) => customerName(e.retailer),
      editOptions: (e) => withCurrentCustomer(customerOptions, idOf(e.retailer), retailerById),
      editValue: (e) => idOf(e.retailer),
      cell: (e) => <CustomerRelationLogo value={e.retailer} customerById={retailerById} size={24} variant="token-name" />,
    },
    {
      key: 'department',
      header: 'Department',
      hideBelow: 'lg',
      sortValue: (e) => relatedName(e.department),
      filterValue: (e) => relatedName(e.department),
      editOptions: departmentOptionsFor,
      editValue: (e) => idOf(e.department),
      cell: (e) => <RelationLabel value={e.department} />,
    },
    {
      key: 'opportunity',
      header: 'Program',
      hideBelow: 'xl',
      sortValue: (e) => relatedName(e.opportunity),
      filterValue: (e) => relatedName(e.opportunity),
      editOptions: programOptionsFor,
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
    ...STAGES.map((s) => ({ id: s.id as Segment, label: s.label, count: stageCounts[s.id] })),
    ...(canSeeAll ? [{ id: 'all' as const, label: 'All', count: stageCounts.all }] : []),
  ]
  const activeStage = STAGES.find((s) => s.id === segment)
  const windowNote =
    emails.length > 0
      ? `Latest ${emails.length.toLocaleString()}${totalMessages ? ` of ${totalMessages.toLocaleString()}` : ''} messages${oldest ? ` (since ${formatDateTime(oldest)})` : ''}`
      : 'Outlook-ingested messages'

  return (
    <AppPage
      listBar={
        <ListBar
          title="Email Routing"
          subtitle={windowNote}
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
                {segments.map((s, i) => (
                  <TabsTrigger key={s.id} value={s.id} className="gap-1.5" title={STAGES.find((x) => x.id === s.id)?.hint}>
                    {i < 3 ? <span className="text-muted-foreground">{i + 1}.</span> : null}
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
          <div className="min-w-0 space-y-2">
          {activeStage ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{activeStage.hint}.</span>{' '}
              Every message is routed in three steps: company → department → program. Set the missing level in its column and the message moves to the next step.
            </p>
          ) : null}
          <DataTable
            rows={filtered}
            columns={columns}
            getRowId={(e) => e.id}
            onRowClick={(e) => select(e)}
            onCellEdit={editCell}
            selectable
            loading={loading}
            emptyIcon={<MailWarning className="size-5" />}
            emptyTitle={query ? 'No messages match your search' : 'Nothing here'}
            emptyDescription={query ? 'Adjust your search.' : activeStage?.empty ?? 'No messages yet.'}
            initialSort={{ key: 'received_at', dir: 'desc' }}
          />
          </div>
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
      </aside>
    )
  }
}
