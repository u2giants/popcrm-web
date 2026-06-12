import { useMemo, useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import {
  ChevronLeft,
  X,
  Sparkles,
  Send,
  FileText,
  Flag,
  Building2,
  CalendarDays,
  Package,
  Tag,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { setOpportunityStage } from '@/features/crm/api'
import { OPPORTUNITY_STAGES, stageChipClass } from '@/features/crm/constants'
import { formatDate, idOf, label, relatedName } from '@/features/crm/format'
import { cn } from '@/lib/utils'
import { NameAvatar } from '@/components/app/NameAvatar'
import type { CrmOpportunity } from '@/lib/types'

function fmtAmount(val: string | number | null | undefined): string {
  if (val == null || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

// Colored field tile — icon + label + value
function FieldRow({
  icon,
  iconColor,
  fieldLabel,
  value,
}: {
  icon: React.ReactNode
  iconColor: string
  fieldLabel: string
  value: React.ReactNode
}) {
  const bg = `color-mix(in oklch, ${iconColor} 15%, transparent)`
  return (
    <div className="flex items-center gap-[10px] py-[5px]">
      <span
        className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px]"
        style={{ background: bg, color: iconColor }}
      >
        {icon}
      </span>
      <span className="w-[130px] shrink-0 text-[11.5px] text-muted-foreground">{fieldLabel}</span>
      <span className="min-w-0 flex-1 text-[12.5px] font-[500] text-foreground">{value || '—'}</span>
    </div>
  )
}

export function OpportunityModal({
  row,
  onClose,
}: {
  row: CrmOpportunity | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (row) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [row, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = row ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [row])

  if (!row) return null

  return (
    // Scrim
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[2vw]"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal shell */}
      <div
        ref={ref}
        className="flex flex-col overflow-hidden rounded-[16px] bg-card shadow-[var(--shadow-lg)]"
        style={{
          width: 'min(1160px, 96vw)',
          height: 'min(880px, 92vh)',
          animation: 'modal-pop 200ms cubic-bezier(0.22,0.61,0.36,1)',
        }}
        role="dialog"
        aria-modal="true"
      >
        <ModalInner row={row} onClose={onClose} />
      </div>
      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

function ModalInner({ row, onClose }: { row: CrmOpportunity; onClose: () => void }) {
  const { notes, tasks, setOpportunities } = useCrmData()
  const [stage, setStage] = useState(row.stage || OPPORTUNITY_STAGES[0])
  const [composerText, setComposerText] = useState('')

  const relatedNotes = useMemo(
    () => notes.filter((n) => idOf(n.opportunity) === row.id).slice(0, 20),
    [notes, row.id],
  )
  const relatedTasks = useMemo(
    () => tasks.filter((t) => idOf(t.opportunity) === row.id).slice(0, 10),
    [tasks, row.id],
  )

  async function changeStage(next: string) {
    const prev = stage
    setStage(next)
    setOpportunities((rows) => rows.map((r) => (r.id === row.id ? { ...r, stage: next } : r)))
    try {
      await setOpportunityStage(row.id, next)
      toast.success(`Stage → ${label(next)}`)
    } catch {
      setStage(prev)
      setOpportunities((rows) => rows.map((r) => (r.id === row.id ? { ...r, stage: prev } : r)))
      toast.error('Could not update stage')
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex h-[48px] shrink-0 items-center gap-[10px] border-b bg-card px-[16px]">
        <button
          onClick={onClose}
          className="flex size-[28px] items-center justify-center rounded-[7px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="size-[16px]" />
        </button>
        <span className="text-[12px] text-muted-foreground">
          POP Creations
          <span className="mx-[5px] opacity-40">▸</span>
          Pipeline
          <span className="mx-[5px] opacity-40">▸</span>
          <span className="text-foreground">{label(stage)}</span>
        </span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="flex size-[28px] items-center justify-center rounded-[7px] text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-[15px]" />
        </button>
      </div>

      {/* Body: left main + right activity */}
      <div className="flex min-h-0 flex-1">
        {/* Left pane */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-[32px] py-[24px]">
            {/* Record header */}
            <div className="mb-[20px]">
              <div className="mb-[8px] flex items-center gap-[8px]">
                <span className={cn('rounded-full px-[8px] py-[3px] text-[11px] font-[600]', stageChipClass(stage))}>
                  Program
                </span>
              </div>
              <h1 className="text-[24px] font-[700] leading-tight tracking-[-0.025em] text-foreground">
                {row.name || 'Untitled program'}
              </h1>
              <p className="mt-[4px] text-[13px] text-muted-foreground">
                {relatedName(row.retailer)}
                {relatedName(row.department) !== '—' ? ` · ${relatedName(row.department)}` : ''}
              </p>
            </div>

            {/* AI summary callout */}
            {row.ai_summary ? (
              <div
                className="mb-[20px] flex gap-[10px] rounded-[10px] border p-[14px]"
                style={{ background: 'color-mix(in oklch, var(--chart-5) 8%, var(--card))', borderColor: 'color-mix(in oklch, var(--chart-5) 30%, transparent)' }}
              >
                <Sparkles className="mt-[1px] size-[14px] shrink-0" style={{ color: 'var(--chart-5)' }} />
                <p className="text-[12.5px] leading-relaxed text-foreground">{row.ai_summary}</p>
              </div>
            ) : null}

            {/* Properties grid */}
            <section className="mb-[20px]">
              <h3 className="mb-[10px] text-[11.5px] font-[650] uppercase tracking-[0.05em] text-muted-foreground">
                Details
              </h3>
              <div className="grid gap-x-[24px] gap-y-[2px] sm:grid-cols-2">
                {[
                  ['Stage', <span className={cn('rounded-full px-[7px] py-[2px] text-[11px] font-[600]', stageChipClass(stage))}>{label(stage)}</span>],
                  ['Account', relatedName(row.retailer)],
                  ['Department', relatedName(row.department)],
                  ['Program type', label(row.program_type)],
                  ['Season / year', row.season_year],
                  ['Division', row.division],
                  ['Close date', formatDate(row.close_date)],
                  ['Est. value', fmtAmount(row.amount)],
                  ['Hard delivery', formatDate(row.hard_delivery_date)],
                  ['Factory', relatedName(row.factory)],
                ].map(([term, value]) => (
                  <div key={String(term)} className="flex items-baseline gap-[8px] py-[5px]">
                    <span className="w-[130px] shrink-0 text-[11.5px] text-muted-foreground">{term}</span>
                    <span className="min-w-0 flex-1 text-[12.5px] font-[500] text-foreground">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reference numbers */}
            {(row.production_po_number || row.sales_order_number) ? (
              <section className="mb-[20px]">
                <h3 className="mb-[10px] text-[11.5px] font-[650] uppercase tracking-[0.05em] text-muted-foreground">
                  Reference
                </h3>
                <div className="rounded-[8px] border bg-muted/30 px-[14px] py-[10px] font-mono text-[12px] text-muted-foreground">
                  {row.production_po_number ? <div>PO: {row.production_po_number}</div> : null}
                  {row.sales_order_number ? <div>SO: {row.sales_order_number}</div> : null}
                </div>
              </section>
            ) : null}

            {/* Colored field tiles */}
            <section className="mb-[20px]">
              <h3 className="mb-[6px] text-[11.5px] font-[650] uppercase tracking-[0.05em] text-muted-foreground">
                Fields
              </h3>
              <FieldRow icon={<Building2 className="size-[13px]" />} iconColor="oklch(0.60 0.15 200)" fieldLabel="Account" value={relatedName(row.retailer)} />
              <FieldRow icon={<DollarSign className="size-[13px]" />} iconColor="oklch(0.60 0.17 155)" fieldLabel="Est. value" value={fmtAmount(row.amount)} />
              <FieldRow icon={<Package className="size-[13px]" />} iconColor="oklch(0.62 0.15 165)" fieldLabel="Factory" value={relatedName(row.factory)} />
              <FieldRow icon={<Tag className="size-[13px]" />} iconColor="oklch(0.64 0.15 130)" fieldLabel="Program type" value={label(row.program_type)} />
              <FieldRow icon={<CalendarDays className="size-[13px]" />} iconColor="oklch(0.66 0.15 60)" fieldLabel="Close date" value={formatDate(row.close_date)} />
              <FieldRow icon={<Flag className="size-[13px]" />} iconColor="oklch(0.62 0.16 25)" fieldLabel="Division" value={row.division} />
              <FieldRow icon={<FileText className="size-[13px]" />} iconColor="oklch(0.62 0.17 300)" fieldLabel="Season / year" value={row.season_year} />
            </section>

            {/* Move stage */}
            <section>
              <h3 className="mb-[10px] text-[11.5px] font-[650] uppercase tracking-[0.05em] text-muted-foreground">
                Move stage
              </h3>
              <div className="flex flex-wrap gap-[6px]">
                {OPPORTUNITY_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStage(s)}
                    className={cn(
                      'rounded-full px-[10px] py-[4px] text-[11.5px] font-[600] transition-all',
                      stageChipClass(s),
                      s === stage
                        ? 'ring-2 ring-offset-1 ring-offset-card ring-current opacity-100'
                        : 'opacity-50 hover:opacity-80',
                    )}
                  >
                    {label(s)}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Right activity pane */}
        <div className="hidden w-[376px] shrink-0 flex-col border-l bg-background lg:flex">
          <div className="flex shrink-0 items-center gap-[8px] border-b px-[16px] py-[11px]">
            <span className="text-[13px] font-[650] tracking-[-0.005em] text-foreground">Activity</span>
            <span className="rounded-full bg-muted px-[6px] py-[1px] text-[11px] tabular-nums text-muted-foreground">
              {relatedNotes.length + relatedTasks.length}
            </span>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-0 px-[16px] py-[12px]">
              {/* System event */}
              <ActivityEvent icon="▸" text={`Created program "${row.name || 'Untitled'}"`} time="" />
              {stage !== (row.stage || OPPORTUNITY_STAGES[0]) ? (
                <ActivityEvent icon="↗" text={`Stage → ${label(stage)}`} time="just now" />
              ) : null}
              {row.ai_summary ? (
                <ActivityEvent icon="✦" text="AI summary generated" time="" />
              ) : null}

              {/* Related notes */}
              {relatedNotes.map((note) => (
                <ActivityNote
                  key={note.id}
                  title={note.title || 'Note'}
                  body={note.body || note.action_items || ''}
                />
              ))}

              {/* Related tasks */}
              {relatedTasks.map((task) => (
                <ActivityTask
                  key={task.id}
                  title={task.title || 'Task'}
                  status={task.status}
                />
              ))}

              {relatedNotes.length === 0 && relatedTasks.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-muted-foreground">
                  No activity yet for this program.
                </p>
              ) : null}
            </div>
          </ScrollArea>

          {/* Composer */}
          <div className="shrink-0 border-t bg-background px-[14px] py-[12px]">
            <div className="flex items-end gap-[8px]">
              <NameAvatar name="You" size={26} />
              <div className="flex min-h-[36px] flex-1 items-center rounded-[9px] border bg-card px-[10px]">
                <input
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent text-[12.5px] placeholder:text-muted-foreground focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { setComposerText(''); e.preventDefault() } }}
                />
              </div>
              <Button
                size="icon-sm"
                disabled={!composerText.trim()}
                onClick={() => setComposerText('')}
                aria-label="Send"
              >
                <Send className="size-[13px]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ActivityEvent({ icon, text, time }: { icon: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-[8px] py-[5px]">
      <span className="mt-[1px] flex size-[20px] shrink-0 items-center justify-center text-[11px] text-muted-foreground">
        {icon}
      </span>
      <p className="flex-1 text-[12px] text-muted-foreground">{text}</p>
      {time ? <span className="shrink-0 text-[11px] text-muted-foreground/60">{time}</span> : null}
    </div>
  )
}

function ActivityNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="my-[4px] rounded-[8px] border bg-card p-[10px]">
      <div className="flex items-center gap-[6px]">
        <FileText className="size-[12px] text-muted-foreground" />
        <span className="text-[12px] font-[600] text-foreground">{title}</span>
      </div>
      {body ? (
        <p className="mt-[4px] line-clamp-2 text-[11.5px] text-muted-foreground">{body}</p>
      ) : null}
    </div>
  )
}

function ActivityTask({ title, status }: { title: string; status: string | null }) {
  return (
    <div className="my-[4px] flex items-center gap-[8px] rounded-[8px] border bg-card px-[10px] py-[8px]">
      <span
        className="size-[10px] shrink-0 rounded-full border-2"
        style={{ borderColor: status === 'DONE' ? 'var(--chip-success-fg)' : 'var(--border-strong)' }}
      />
      <span className="flex-1 text-[12px] text-foreground">{title}</span>
      {status ? (
        <span className="text-[11px] text-muted-foreground">{label(status)}</span>
      ) : null}
    </div>
  )
}
