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
import { useCrmData } from '@/features/crm/CrmDataContext'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { OPPORTUNITY_STAGES, isApprovalResolved, needsRouting } from '@/features/crm/constants'
import { formatDate, label } from '@/features/crm/format'

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

// Build a 12-week rolling volume series from an array of ISO date strings.
function buildWeeklyVolume(
  emails: { received_at: string | null; routing_status: string | null }[],
): AreaSeries[] {
  const now = Date.now()
  const MS_WEEK = 7 * 24 * 3600 * 1000
  const weeks: { label: string; ingested: number; routed: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const weekStart = now - (i + 1) * MS_WEEK
    const weekEnd = now - i * MS_WEEK
    const inWeek = emails.filter((e) => {
      if (!e.received_at) return false
      const t = new Date(e.received_at).getTime()
      return t >= weekStart && t < weekEnd
    })
    const d = new Date(weekEnd)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    weeks.push({ label, ingested: inWeek.length, routed: inWeek.filter((e) => e.routing_status === 'ROUTED').length })
  }
  return weeks
}

export function OverviewPage() {
  const navigate = useNavigate()
  const { stats, emails, opportunities, meetings, tasks, approvals, loading, error, refresh, firefliesOk } =
    useCrmData()

  const routingSlices = useMemo<DonutSlice[]>(() => {
    const counts = new Map<string, number>()
    for (const e of emails) {
      const key = e.routing_status || 'UNROUTED'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Object.keys(ROUTING_COLORS)
      .map((key) => ({
        key,
        name: ROUTING_NAMES[key] ?? key,
        value: counts.get(key) ?? 0,
        color: ROUTING_COLORS[key],
      }))
      .filter((d) => d.value > 0)
  }, [emails])

  const stageBars = useMemo<HBarItem[]>(
    () =>
      OPPORTUNITY_STAGES.map((stage) => ({
        label: label(stage),
        value: opportunities.filter((o) => (o.stage || OPPORTUNITY_STAGES[0]) === stage).length,
      })),
    [opportunities],
  )

  const emailVolume = useMemo(() => buildWeeklyVolume(emails), [emails])

  const recentUnrouted = useMemo(
    () => emails.filter((e) => needsRouting(e.routing_status)).slice(0, 6),
    [emails],
  )
  const recentMeetings = useMemo(() => meetings.slice(0, 6), [meetings])
  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELED').slice(0, 6),
    [tasks],
  )
  const pendingApprovals = useMemo(
    () => approvals.filter((a) => !isApprovalResolved(a.stage)).slice(0, 6),
    [approvals],
  )

  if (error) {
    return (
      <AppPage title="Overview" description="Operational snapshot of POP CRM.">
        <ErrorState onRetry={refresh} />
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
      {loading ? (
        <div className="space-y-4">
          <CardGridSkeleton count={7} />
          <CardGridSkeleton count={2} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
            <MetricCard
              label="Accounts"
              value={stats.accounts.toLocaleString()}
              icon={<Building2 className="size-4" />}
              iconColor="oklch(0.60 0.15 200)"
              onClick={() => navigate('/accounts')}
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
              value={stats.needsRouting.toLocaleString()}
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
              <ChartAreaVolume
                data={emailVolume}
                primaryKey="ingested"
                secondaryKey="routed"
                height={150}
              />
            </div>
            <div className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
              <div className="mb-[12px] flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-[650] tracking-[-0.005em] text-foreground">
                    Routing health
                  </p>
                  <p className="mt-[1px] text-[11.5px] text-muted-foreground">
                    {stats.emails.toLocaleString()} messages
                  </p>
                </div>
                <button
                  onClick={() => navigate('/email')}
                  className="inline-flex items-center gap-[4px] text-[11.5px] font-[500] text-primary hover:underline"
                >
                  Open queue <ArrowRight className="size-[13px]" />
                </button>
              </div>
              {routingSlices.length ? (
                <ChartDonut
                  data={routingSlices}
                  centerLabel={`${Math.round((routingSlices.find(s => s.key === 'ROUTED')?.value ?? 0) / Math.max(stats.emails, 1) * 100)}%`}
                  centerSub="routed"
                />
              ) : (
                <p className="mt-6 text-[12px] text-muted-foreground">No email data yet.</p>
              )}
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
              <ChartHBar data={stageBars} />
            </div>
            <ActivityPanel
              title="Needs routing"
              icon={<MailWarning className="size-4" />}
              empty="Inbox zero — every message is routed."
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
              onView={() => navigate('/meetings')}
              items={recentMeetings.map((m) => ({
                id: m.id,
                primary: m.name || 'Meeting',
                secondary: <RelationLabel value={m.retailer} />,
                trailing: <span className="text-[11px] text-muted-foreground">{formatDate(m.date)}</span>,
                onClick: () => navigate(`/meetings?meeting=${m.id}`),
              }))}
            />
            <ActivityPanel
              title="Open tasks"
              icon={<ListTodo className="size-4" />}
              empty="No open tasks."
              onView={() => navigate('/tasks')}
              items={openTasks.map((t) => ({
                id: t.id,
                primary: t.title || 'Task',
                secondary: <RelationLabel value={t.opportunity} />,
                trailing: <CrmStatusBadge kind="task" status={t.status} dot={false} />,
                onClick: () => navigate(`/tasks?task=${t.id}`),
              }))}
            />
            <ActivityPanel
              title="Pending approvals"
              icon={<ShieldCheck className="size-4" />}
              empty="No pending approvals."
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
  onView,
}: {
  title: string
  icon: React.ReactNode
  items: ActivityItem[]
  empty: string
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
      {items.length ? (
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
