import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Building2,
  Check,
  ChevronDown,
  CornerUpLeft,
  Inbox,
  Route as RouteIcon,
  SkipForward,
  Sparkles,
  X,
} from 'lucide-react'
import { AppPage } from '@/components/app/AppPage'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { ErrorState, LoadingState } from '@/components/app/states'
import { needsRouting } from '@/features/crm/constants'
import { idOf, label } from '@/features/crm/format'
import {
  listData,
  useCustomerSegmentQuery,
  useDepartmentsQuery,
  useEmailsQuery,
  useOpportunitiesQuery,
  useUpdateEmailMutation,
} from '@/features/crm/queries'
import { cn } from '@/lib/utils'
import type { CrmDepartment, CrmEmailMessage } from '@/lib/types'

const TRIAGE_LIMIT = 500
// Past this horizontal drag (px) a release commits the swipe action.
const SWIPE_COMMIT = 96

const METHOD_LABEL: Record<string, string> = {
  DETERMINISTIC: 'Rule match',
  AI: 'AI classify',
  MANUAL: 'Manual',
}

function MethodChip({ method }: { method: string | null | undefined }) {
  if (!method) return <span className="text-[11px] text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center rounded-full border px-[8px] py-[2px] text-[11px] font-[550] text-muted-foreground">
      {METHOD_LABEL[method] ?? label(method)}
    </span>
  )
}

// Compact "3m / 2h / 4d ago" stamp — denser than the full date/time used on desktop.
function relativeTime(value: string | null | undefined): string {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function TriagePage() {
  const emailsQuery = useEmailsQuery(TRIAGE_LIMIT)
  const retailersQuery = useCustomerSegmentQuery('active', -1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const updateEmail = useUpdateEmailMutation()

  const emails = listData(emailsQuery.data)
  const retailers = listData(retailersQuery.data)
  const departments = listData(departmentsQuery.data)
  const opportunities = listData(opportunitiesQuery.data)

  const loading =
    emailsQuery.isPending ||
    retailersQuery.isPending ||
    departmentsQuery.isPending ||
    opportunitiesQuery.isPending

  // Cards the salesman chose to peek past this session, kept out of the deck
  // without touching their routing status.
  const [deferred, setDeferred] = useState<Set<string>>(new Set())
  const [lastAction, setLastAction] = useState<{ id: string; prevStatus: string | null } | null>(null)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [committing, setCommitting] = useState(false)
  const startX = useRef<number | null>(null)

  const pending = useMemo(
    () =>
      emails
        .filter((e) => needsRouting(e.routing_status))
        .sort((a, b) => (b.received_at ?? '').localeCompare(a.received_at ?? '')),
    [emails],
  )
  const deck = useMemo(() => pending.filter((e) => !deferred.has(e.id)), [pending, deferred])
  const current = deck[0] ?? null

  const customerOptions = useMemo<ComboOption[]>(
    () => retailers.map((r) => ({ value: r.id, label: r.name })),
    [retailers],
  )
  const opportunityOptions = useMemo<ComboOption[]>(
    () => opportunities.map((o) => ({ value: o.id, label: o.name || 'Untitled program' })),
    [opportunities],
  )
  // Departments narrow to the email's assigned customer, mirroring EmailDrawer.
  const departmentOptions = useMemo<ComboOption[]>(() => {
    const customerId = idOf(current?.retailer)
    const scoped = customerId
      ? departments.filter((d) => idOf((d as CrmDepartment).retailer) === customerId)
      : departments
    return scoped.map((d) => ({ value: d.id, label: d.name }))
  }, [departments, current])

  const assign = useCallback(
    async (key: 'retailer' | 'department' | 'opportunity', value: string) => {
      if (!current) return
      const values: Partial<CrmEmailMessage> = { [key]: value || null }
      // Changing the customer drops a department that no longer belongs to it.
      if (key === 'retailer') {
        const dept = idOf(current.department)
        if (dept && departments.find((d) => d.id === dept && idOf((d as CrmDepartment).retailer) !== value)) {
          values.department = null
        }
      }
      try {
        await updateEmail.mutateAsync({ id: current.id, values })
      } catch {
        toast.error('Could not save change')
      }
    },
    [current, departments, updateEmail],
  )

  const decide = useCallback(
    async (status: 'ROUTED' | 'SKIPPED') => {
      if (!current || committing) return
      if (
        status === 'ROUTED' &&
        !idOf(current.retailer) &&
        !idOf(current.department) &&
        !idOf(current.opportunity)
      ) {
        toast.error('Assign a customer, department, or program before routing')
        setDrag(0)
        return
      }
      const id = current.id
      const prevStatus = current.routing_status
      setCommitting(true)
      setDrag(status === 'ROUTED' ? 480 : -480)
      try {
        await updateEmail.mutateAsync({ id, values: { routing_status: status } })
        setLastAction({ id, prevStatus })
      } catch {
        toast.error('Could not update routing')
      } finally {
        setCommitting(false)
        setDrag(0)
      }
    },
    [current, committing, updateEmail],
  )

  const undo = useCallback(async () => {
    if (!lastAction) return
    try {
      await updateEmail.mutateAsync({
        id: lastAction.id,
        values: { routing_status: lastAction.prevStatus },
      })
      setDeferred((prev) => {
        const next = new Set(prev)
        next.delete(lastAction.id)
        return next
      })
      setLastAction(null)
    } catch {
      toast.error('Could not undo')
    }
  }, [lastAction, updateEmail])

  function onPointerDown(e: React.PointerEvent) {
    if (committing) return
    startX.current = e.clientX
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return
    setDrag(e.clientX - startX.current)
  }
  function onPointerUp() {
    if (startX.current === null) return
    startX.current = null
    setDragging(false)
    if (drag > SWIPE_COMMIT) void decide('ROUTED')
    else if (drag < -SWIPE_COMMIT) void decide('SKIPPED')
    else setDrag(0)
  }

  const routeHint = Math.max(0, Math.min(1, drag / SWIPE_COMMIT))
  const skipHint = Math.max(0, Math.min(1, -drag / SWIPE_COMMIT))

  return (
    <AppPage
      title="Quick Triage"
      description="Route the inbox one card at a time — built for a phone"
      scroll={false}
      actions={
        <Button variant="outline" size="sm" onClick={undo} disabled={!lastAction}>
          <CornerUpLeft className="size-4" />
          Undo
        </Button>
      }
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col gap-3 px-1 py-2">
        {emailsQuery.isError ? (
          <ErrorState onRetry={() => void emailsQuery.refetch()} />
        ) : loading ? (
          <LoadingState rows={5} />
        ) : !current ? (
          <EmptyDeck
            hadDeferred={deferred.size > 0}
            onReset={() => setDeferred(new Set())}
          />
        ) : (
          <>
            <div className="flex items-center justify-between px-1 text-[12px] text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {deck.length} to triage
              </span>
              <span>{pending.length - deck.length} peeked</span>
            </div>

            {/* Swipeable email card */}
            <div className="relative min-h-0 flex-1">
              <div
                key={current.id}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="flex h-full touch-pan-y select-none flex-col overflow-hidden rounded-[16px] border bg-card shadow-[var(--shadow-sm)]"
                style={{
                  transform: `translateX(${drag}px) rotate(${drag / 28}deg)`,
                  transition: dragging ? 'none' : 'transform 180ms ease-out',
                }}
              >
                {/* Swipe intent overlays */}
                <div
                  className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-success px-3 py-1 text-[12px] font-[650] uppercase tracking-wide text-success-foreground"
                  style={{ opacity: routeHint }}
                >
                  Route
                </div>
                <div
                  className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-muted-foreground px-3 py-1 text-[12px] font-[650] uppercase tracking-wide text-white"
                  style={{ opacity: skipHint }}
                >
                  Skip
                </div>

                <div className="border-b px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {current.sender || 'Unknown sender'}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {relativeTime(current.received_at)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <MethodChip method={current.routing_method} />
                    <span className="text-[11px] text-muted-foreground">
                      {label(current.routing_status)}
                    </span>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  <h2 className="text-[16px] font-[650] leading-snug text-foreground">
                    {current.subject || '(no subject)'}
                  </h2>
                  {current.recipients ? (
                    <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
                      To: {current.recipients}
                    </p>
                  ) : null}
                  <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                    {current.body_preview || 'No preview available.'}
                  </p>
                </div>

                {/* Assignment pickers */}
                <div className="space-y-2 border-t bg-muted/20 px-4 py-3">
                  <PickerRow icon={<Building2 className="size-4" />} assigned={!!idOf(current.retailer)}>
                    <Combobox
                      options={customerOptions}
                      value={idOf(current.retailer)}
                      onChange={(v) => void assign('retailer', v)}
                      placeholder="Assign customer"
                      clearLabel="Unassigned"
                    />
                  </PickerRow>
                  <PickerRow icon={<Building2 className="size-4" />} assigned={!!idOf(current.department)}>
                    <Combobox
                      options={departmentOptions}
                      value={idOf(current.department)}
                      onChange={(v) => void assign('department', v)}
                      placeholder="Assign department"
                      clearLabel="Unassigned"
                    />
                  </PickerRow>
                  <PickerRow icon={<RouteIcon className="size-4" />} assigned={!!idOf(current.opportunity)}>
                    <Combobox
                      options={opportunityOptions}
                      value={idOf(current.opportunity)}
                      onChange={(v) => void assign('opportunity', v)}
                      placeholder="Assign program"
                      clearLabel="Unassigned"
                    />
                  </PickerRow>
                </div>
              </div>
            </div>

            {/* Action bar — thumb-reachable */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={committing}
                onClick={() => void decide('SKIPPED')}
              >
                <X className="size-4" />
                Skip
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                title="Peek next without deciding"
                disabled={committing}
                onClick={() => current && setDeferred((prev) => new Set(prev).add(current.id))}
              >
                <ChevronDown className="size-5" />
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                disabled={committing}
                onClick={() => void decide('ROUTED')}
              >
                <Check className="size-4" />
                Route
              </Button>
            </div>
          </>
        )}
      </div>
    </AppPage>
  )
}

function PickerRow({
  icon,
  assigned,
  children,
}: {
  icon: React.ReactNode
  assigned: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md',
          assigned ? 'bg-success/12 text-success' : 'text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function EmptyDeck({ hadDeferred, onReset }: { hadDeferred: boolean; onReset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
        {hadDeferred ? <Inbox className="size-7" /> : <Sparkles className="size-7" />}
      </div>
      <div>
        <p className="text-[15px] font-[650] text-foreground">
          {hadDeferred ? 'Nothing left in the deck' : 'Inbox zero on routing'}
        </p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {hadDeferred
            ? 'You peeked past everything still pending.'
            : 'Every message has a CRM routing decision.'}
        </p>
      </div>
      {hadDeferred ? (
        <Button variant="outline" size="sm" onClick={onReset}>
          <SkipForward className="size-4" />
          Review peeked cards
        </Button>
      ) : null}
    </div>
  )
}
