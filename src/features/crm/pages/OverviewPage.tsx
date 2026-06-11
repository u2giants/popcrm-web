import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
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
import { AppPage, SectionHeader } from '@/components/app/AppPage'
import { MetricCard } from '@/components/app/MetricCard'
import { CardGridSkeleton, ErrorState } from '@/components/app/states'
import { StatusBadge } from '@/components/app/StatusBadge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { OPPORTUNITY_STAGES, needsRouting } from '@/features/crm/constants'
import { formatDate, label } from '@/features/crm/format'

const ROUTING_CHART: ChartConfig = {
  ROUTED: { label: 'Routed', color: 'var(--chart-3)' },
  COMPANY_ONLY: { label: 'Company only', color: 'var(--chart-1)' },
  COMPANY_DEPT: { label: 'Company + dept', color: 'var(--chart-2)' },
  UNROUTED: { label: 'Unrouted', color: 'var(--chart-4)' },
  CUSTOMER_EMAIL_NO_COMPANY: { label: 'No company', color: 'var(--chart-5)' },
  SKIPPED: { label: 'Skipped', color: 'var(--muted-foreground)' },
}

const STAGE_CHART: ChartConfig = { count: { label: 'Programs', color: 'var(--chart-1)' } }

export function OverviewPage() {
  const navigate = useNavigate()
  const { stats, emails, opportunities, meetings, tasks, approvals, loading, error, refresh, firefliesOk } =
    useCrmData()

  const routingData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of emails) {
      const key = e.routing_status || 'UNROUTED'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Object.keys(ROUTING_CHART)
      .map((key) => ({ key, name: String(ROUTING_CHART[key].label), value: counts.get(key) ?? 0 }))
      .filter((d) => d.value > 0)
  }, [emails])

  const stageData = useMemo(
    () =>
      OPPORTUNITY_STAGES.map((stage) => ({
        stage: label(stage),
        count: opportunities.filter((o) => (o.stage || OPPORTUNITY_STAGES[0]) === stage).length,
      })),
    [opportunities],
  )

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
    () => approvals.filter((a) => a.approval_status !== 'APPROVED' && a.approval_status !== 'REJECTED').slice(0, 6),
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
      title="Overview"
      description="Operational snapshot of accounts, routing and pipeline."
      actions={
        <StatusBadge tone={firefliesOk === false ? 'danger' : firefliesOk ? 'success' : 'neutral'}>
          Fireflies {firefliesOk === null ? '…' : firefliesOk ? 'online' : 'offline'}
        </StatusBadge>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <CardGridSkeleton count={7} />
          <CardGridSkeleton count={2} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
            <MetricCard label="Accounts" value={stats.accounts.toLocaleString()} icon={<Building2 className="size-4" />} onClick={() => navigate('/accounts')} />
            <MetricCard label="Contacts" value={stats.contacts.toLocaleString()} icon={<Contact className="size-4" />} onClick={() => navigate('/contacts')} />
            <MetricCard label="Open programs" value={stats.openOpportunities.toLocaleString()} icon={<Route className="size-4" />} tone="accent" onClick={() => navigate('/pipeline')} />
            <MetricCard label="Needs routing" value={stats.needsRouting.toLocaleString()} icon={<MailWarning className="size-4" />} tone={stats.needsRouting ? 'danger' : 'default'} onClick={() => navigate('/email')} />
            <MetricCard label="Meetings" value={stats.meetings.toLocaleString()} icon={<CalendarDays className="size-4" />} onClick={() => navigate('/meetings')} />
            <MetricCard label="Open tasks" value={stats.openTasks.toLocaleString()} icon={<ListTodo className="size-4" />} onClick={() => navigate('/tasks')} />
            <MetricCard label="Approvals" value={stats.pendingApprovals.toLocaleString()} icon={<ShieldCheck className="size-4" />} onClick={() => navigate('/approvals')} />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-5">
              <SectionHeader title="Email routing health" description={`${stats.emails.toLocaleString()} messages ingested`} />
              {routingData.length ? (
                <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
                  <ChartContainer config={ROUTING_CHART} className="aspect-square h-48">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie data={routingData} dataKey="value" nameKey="name" innerRadius={48} strokeWidth={2}>
                        {routingData.map((d) => (
                          <Cell key={d.key} fill={`var(--color-${d.key})`} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <ul className="flex-1 space-y-1.5">
                    {routingData.map((d) => (
                      <li key={d.key} className="flex items-center gap-2 text-sm">
                        <span className="size-2.5 rounded-[3px]" style={{ background: `var(--color-${d.key})` }} />
                        <span className="flex-1 text-muted-foreground">{d.name}</span>
                        <span className="font-medium tabular-nums">{d.value.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">No email data yet.</p>
              )}
            </div>

            <div className="rounded-lg border bg-card p-5">
              <SectionHeader title="Pipeline distribution" description="Opportunities by stage" />
              <ChartContainer config={STAGE_CHART} className="mt-2 aspect-auto h-48 w-full">
                <BarChart data={stageData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Activity panels */}
          <div className="grid gap-4 lg:grid-cols-2">
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
            <ActivityPanel
              title="Recent meetings"
              icon={<CalendarDays className="size-4" />}
              empty="No meetings imported yet."
              onView={() => navigate('/meetings')}
              items={recentMeetings.map((m) => ({
                id: m.id,
                primary: m.name || 'Meeting',
                secondary: <RelationLabel value={m.retailer} />,
                trailing: <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>,
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
                primary: a.name || a.licensor_name || 'Approval',
                secondary: <RelationLabel value={a.opportunity} />,
                trailing: <CrmStatusBadge kind="approval" status={a.approval_status} dot={false} />,
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
    <section className="flex flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </div>
        <button
          onClick={onView}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all <ArrowRight className="size-3.5" />
        </button>
      </div>
      {items.length ? (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={item.onClick}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{item.primary}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.secondary}</div>
                </div>
                {item.trailing ? <div className="shrink-0">{item.trailing}</div> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}
