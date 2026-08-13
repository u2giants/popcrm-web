import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  Contact,
  ListTodo,
  MailWarning,
  Route,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { AppPage, ListBar, SectionHeader } from '@/components/app/AppPage'
import { MetricCard } from '@/components/app/MetricCard'
import { CardGridSkeleton, ErrorState } from '@/components/app/states'
import { StatusBadge } from '@/components/app/StatusBadge'
import { ChartDonut, type DonutSlice } from '@/components/app/ChartDonut'
import { ChartHBar, type HBarItem } from '@/components/app/ChartHBar'
import { ChartAreaVolume, type AreaSeries } from '@/components/app/ChartAreaVolume'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { formatDate, label } from '@/features/crm/format'
import {
  listData,
  useFirefliesHealth,
  useOverviewCountsQuery,
  useOverviewEmailCountsQuery,
  useOverviewEmailVolumeQuery,
  useOverviewPendingApprovalsQuery,
  useOverviewPipelineQuery,
  useOverviewRecentMeetingsQuery,
  useOverviewRecentUnroutedQuery,
} from '@/features/crm/queries'

const ROUTING_COLORS: Record<string, string> = {
  ROUTED: 'var(--chart-3)',
  COMPANY_ONLY: 'var(--chart-1)',
  COMPANY_DEPT: 'var(--chart-2)',
  UNROUTED: 'var(--chart-4)',
  CUSTOMER_EMAIL_NO_COMPANY: 'var(--chart-5)',
  SKIPPED: 'var(--muted-foreground)',
}
const ROUTING_NAMES: Record<string, string> = {
  ROUTED: 'Routed',
  COMPANY_ONLY: 'Company only',
  COMPANY_DEPT: 'Company + dept',
  UNROUTED: 'Unrouted',
  CUSTOMER_EMAIL_NO_COMPANY: 'No company',
  SKIPPED: 'Skipped',
}

// The server returns each bucket's START date as a plain YYYY-MM-DD string; the
// chart labels every bucket by its END date (start + 7 days), which is what the
// old client-side series did. Parse the parts by hand: `new Date('2026-05-21')`
// is parsed as UTC midnight and then read back in local time, which shifts the
// label a day for every user west of UTC.
function volumeLabel(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  if (!year || !month || !day) return weekStart
  const end = new Date(year, month - 1, day + 7)
  return `${end.getMonth() + 1}/${end.getDate()}`
}

export function OverviewPage() {
  const navigate = useNavigate()
  // One query per failure group. A degraded email domain leaves the people,
  // pipeline and work numbers intact instead of blanking the whole page.
  const countsQuery = useOverviewCountsQuery()
  const emailCountsQuery = useOverviewEmailCountsQuery()
  const pipelineQuery = useOverviewPipelineQuery()
  const volumeQuery = useOverviewEmailVolumeQuery(12)
  const unroutedQuery = useOverviewRecentUnroutedQuery(6)
  const meetingsQuery = useOverviewRecentMeetingsQuery(6)
  const approvalsQuery = useOverviewPendingApprovalsQuery(6)
  const fireflies = useFirefliesHealth()
  const firefliesOk = fireflies.data ?? null

  const counts = countsQuery.data
  const emailCounts = emailCountsQuery.data
  const recentUnrouted = listData(unroutedQuery.data)
  const recentMeetings = listData(meetingsQuery.data)
  const pendingApprovals = listData(approvalsQuery.data)

  const stats = {
    customers: counts?.customers ?? 0,
    contacts: counts?.contacts ?? 0,
    openOpportunities: counts?.openOpportunities ?? 0,
    emails: emailCounts?.total ?? 0,
    needsRouting: emailCounts?.needsRouting ?? 0,
    meetings: counts?.meetings ?? 0,
    openTasks: counts?.openTasks ?? 0,
    pendingApprovals: counts?.pendingApprovals ?? 0,
  }

  const routingSlices = useMemo<DonutSlice[]>(() => {
    if (!emailCounts) return []
    const byKey: Record<string, number> = {
      ROUTED: emailCounts.routed,
      COMPANY_ONLY: emailCounts.companyOnly,
      COMPANY_DEPT: emailCounts.companyDept,
      UNROUTED: emailCounts.unrouted,
      CUSTOMER_EMAIL_NO_COMPANY: emailCounts.noCompany,
      SKIPPED: emailCounts.skipped,
    }
    return Object.keys(ROUTING_COLORS)
      .map((key) => ({
        key,
        name: ROUTING_NAMES[key] ?? key,
        value: byKey[key] ?? 0,
        color: ROUTING_COLORS[key],
      }))
      .filter((d) => d.value > 0)
  }, [emailCounts])

  const stageBars = useMemo<HBarItem[]>(
    () => listData(pipelineQuery.data).map((row) => ({ label: label(row.stage), value: row.count })),
    [pipelineQuery.data],
  )

  const emailVolume = useMemo<AreaSeries[]>(
    () =>
      listData(volumeQuery.data).map((week) => ({
        label: volumeLabel(week.weekStart),
        ingested: week.ingested,
        routed: week.routed,
      })),
    [volumeQuery.data],
  )

  // Only a failed KPI query is fatal for the page; the panels and charts each
  // degrade on their own.
  const isPending = countsQuery.isPending
  if (countsQuery.isError) {
    return (
      <AppPage title="Overview" description="Operational snapshot of POP CRM.">
        <ErrorState onRetry={() => void countsQuery.refetch()} />
      </AppPage>
    )
  }

  return (
    <AppPage
      listBar={
        <ListBar
          title="Overview"
          subtitle="Operational snapshot"
          actions={
            <StatusBadge tone={firefliesOk === false ? 'danger' : firefliesOk ? 'success' : 'neutral'}>
              Fireflies {firefliesOk === null ? '…' : firefliesOk ? 'online' : 'offline'}
            </StatusBadge>
          }
        />
      }
    >
      {isPending ? (
        <div className="space-y-4">
          <CardGridSkeleton count={7} />
          <CardGridSkeleton count={2} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
            <MetricCard
              label="Customers"
              value={stats.customers.toLocaleString()}
              icon={<Building2 className="size-4" />}
              iconColor="oklch(0.60 0.15 200)"
              onClick={() => navigate('/customers')}
            />
            <MetricCard
              label="Contacts"
              value={stats.contacts.toLocaleString()}
              icon={<Contact className="size-4" />}
              iconColor="oklch(0.62 0.15 165)"
              onClick={() => navigate('/contacts')}
            />
            <MetricCard
              label="Open programs"
              value={stats.openOpportunities.toLocaleString()}
              icon={<Route className="size-4" />}
              iconColor="oklch(0.62 0.17 300)"
              tone="accent"
              onClick={() => navigate('/pipeline')}
            />
            <MetricCard
              label="Needs routing"
              value={emailCounts ? stats.needsRouting.toLocaleString() : '…'}
              icon={<MailWarning className="size-4" />}
              iconColor="oklch(0.62 0.16 25)"
              tone={stats.needsRouting ? 'danger' : 'default'}
              onClick={() => navigate('/email')}
            />
            <MetricCard
              label="Meetings"
              value={stats.meetings.toLocaleString()}
              icon={<CalendarDays className="size-4" />}
              iconColor="oklch(0.66 0.15 60)"
              onClick={() => navigate('/meetings')}
            />
            <MetricCard
              label="Open tasks"
              value={stats.openTasks.toLocaleString()}
              icon={<ListTodo className="size-4" />}
              iconColor="oklch(0.64 0.16 95)"
              onClick={() => navigate('/tasks')}
            />
            <MetricCard
              label="Approvals"
              value={stats.pendingApprovals.toLocaleString()}
              icon={<ShieldCheck className="size-4" />}
              iconColor="oklch(0.60 0.16 340)"
              onClick={() => navigate('/approvals')}
            />
          </div>

          {/* Row 1: Email volume (wider) + Routing health */}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
              <SectionHeader
                title="Email volume"
                description="12-week ingest vs. auto-routed"
                className="mb-[12px]"
              />
              <CardState query={volumeQuery} empty={emailVolume.length === 0} emptyText="No email data yet.">
                <ChartAreaVolume
                  data={emailVolume}
                  primaryKey="ingested"
                  secondaryKey="routed"
                  height={150}
                />
              </CardState>
            </div>
            <div className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
              <div className="mb-[12px] flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-[650] tracking-[-0.005em] text-foreground">
                    Routing health
                  </p>
                  <p className="mt-[1px] text-[11.5px] text-muted-foreground">
                    {emailCounts ? `${stats.emails.toLocaleString()} messages` : '…'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/email')}
                  className="inline-flex items-center gap-[4px] text-[11.5px] font-[500] text-primary hover:underline"
                >
                  Open queue <ArrowRight className="size-[13px]" />
                </button>
              </div>
              <CardState
                query={emailCountsQuery}
                empty={routingSlices.length === 0}
                emptyText="No email data yet."
              >
                <ChartDonut
                  data={routingSlices}
                  centerLabel={`${Math.round((routingSlices.find(s => s.key === 'ROUTED')?.value ?? 0) / Math.max(stats.emails, 1) * 100)}%`}
                  centerSub="routed"
                />
              </CardState>
            </div>
          </div>

          {/* Row 2: Pipeline distribution (wider) + Needs routing activity */}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
              <div className="mb-[14px]">
                <p className="text-[13px] font-[650] tracking-[-0.005em] text-foreground">
                  Pipeline distribution
                </p>
                <p className="mt-[1px] text-[11.5px] text-muted-foreground">
                  Opportunities by stage
                </p>
              </div>
              <CardState
                query={pipelineQuery}
                empty={stageBars.length === 0}
                emptyText="No opportunities yet."
              >
                <ChartHBar data={stageBars} />
              </CardState>
            </div>
            <ActivityPanel
              title="Needs routing"
              icon={<MailWarning className="size-4" />}
              empty="Inbox zero — every message is routed."
              query={unroutedQuery}
              onView={() => navigate('/email')}
              items={recentUnrouted.map((e) => ({
                id: e.id,
                primary: e.subject || '(no subject)',
                secondary: e.sender || '',
                trailing: <CrmStatusBadge kind="routing" status={e.routing_status} dot={false} />,
                onClick: () => navigate(`/email?message=${e.id}`),
              }))}
            />
          </div>

          {/* Row 3: Recent meetings + Pending approvals */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ActivityPanel
              title="Recent meetings"
              icon={<CalendarDays className="size-4" />}
              empty="No meetings imported yet."
              query={meetingsQuery}
              onView={() => navigate('/meetings')}
              items={recentMeetings.map((m) => ({
                id: m.id,
                primary: m.name || 'Meeting',
                secondary: <RelationLabel value={m.company} />,
                trailing: <span className="text-[11px] text-muted-foreground">{formatDate(m.date)}</span>,
                onClick: () => navigate(`/meetings?meeting=${m.id}`),
              }))}
            />
            <ActivityPanel
              title="Pending approvals"
              icon={<ShieldCheck className="size-4" />}
              empty="No pending approvals."
              query={approvalsQuery}
              onView={() => navigate('/approvals')}
              items={pendingApprovals.map((a) => ({
                id: a.id,
                primary: a.name || a.property_name || 'Approval',
                secondary: <RelationLabel value={a.opportunity} />,
                trailing: <CrmStatusBadge kind="approval" status={a.stage} dot={false} />,
                onClick: () => navigate(`/approvals?approval=${a.id}`),
              }))}
            />
          </div>
        </div>
      )}
    </AppPage>
  )
}

// Each Overview card owns its own loading/error/empty state now that the seven
// aggregates load independently. Without this the page prints an affirmative
// empty ("Inbox zero", "No email data yet") while a slower query is still in
// flight, or forever during an email outage — a wrong answer dressed as a good
// one, which is exactly what the failure isolation is supposed to prevent.
type CardQuery = { isPending: boolean; isError: boolean; data?: unknown; refetch: () => unknown }

function CardState({
  query,
  empty,
  emptyText,
  children,
}: {
  query: CardQuery
  empty: boolean
  emptyText: string
  children: React.ReactNode
}) {
  if (query.isPending) return <p className="mt-6 text-[12px] text-muted-foreground">Loading…</p>
  // Charts prefer stale data over an error: react-query keeps `isError` true
  // after a failed background refetch even when the last good result is still
  // cached, and a 90-second-old chart beats "Could not load". The recent-row
  // panels below deliberately do NOT do this — stale "recent" rows mislead.
  if (query.isError && query.data === undefined) {
    return (
      <div className="mt-6 flex items-center gap-2 text-[12px] text-destructive">
        <span>Could not load.</span>
        <button onClick={() => void query.refetch()} className="font-[500] underline">
          Retry
        </button>
      </div>
    )
  }
  if (empty) return <p className="mt-6 text-[12px] text-muted-foreground">{emptyText}</p>
  return <>{children}</>
}

interface ActivityItem {
  id: string
  primary: React.ReactNode
  secondary: React.ReactNode
  trailing?: React.ReactNode
  onClick?: () => void
}

function ActivityPanel({
  title,
  icon,
  items,
  empty,
  query,
  onView,
}: {
  title: string
  icon: React.ReactNode
  items: ActivityItem[]
  empty: string
  query: CardQuery
  onView: () => void
}) {
  return (
    <section className="flex flex-col rounded-[12px] border bg-card shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between border-b px-[14px] py-[11px]">
        <div className="flex items-center gap-[7px] text-[13px] font-[650] tracking-[-0.005em] text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </div>
        <button
          onClick={onView}
          className="inline-flex items-center gap-[4px] text-[11.5px] font-[500] text-primary hover:underline"
        >
          View all <ArrowRight className="size-[13px]" />
        </button>
      </div>
      {query.isPending ? (
        <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">Loading…</p>
      ) : query.isError ? (
        <p className="px-4 py-8 text-center text-[12px] text-destructive">
          Could not load.{' '}
          <button onClick={() => void query.refetch()} className="font-[500] underline">
            Retry
          </button>
        </p>
      ) : items.length ? (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={item.onClick}
                className="flex w-full items-center gap-3 px-[14px] py-[9px] text-left transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-[500] text-foreground">{item.primary}</div>
                  <div className="truncate text-[11.5px] text-muted-foreground">{item.secondary}</div>
                </div>
                {item.trailing ? <div className="shrink-0">{item.trailing}</div> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}
