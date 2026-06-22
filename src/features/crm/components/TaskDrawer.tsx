import { useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, Clock } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { StatusBadge } from '@/components/app/StatusBadge'
import { useUpdateTaskMutation } from '@/features/crm/queries'
import { TASK_STATUSES, taskTone } from '@/features/crm/constants'
import { formatDateTime, label, relatedName } from '@/features/crm/format'
import { cn } from '@/lib/utils'
import type { CrmTask } from '@/lib/types'

export function TaskDrawer({ row, onClose }: { row: CrmTask | null; onClose: () => void }) {
  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.title || 'Task'}
      subtitle={row ? relatedName(row.opportunity) : undefined}
      status={
        row ? (
          <StatusBadge tone={taskTone(row.status)} dot>
            {label(row.status)}
          </StatusBadge>
        ) : undefined
      }
    >
      {row ? <TaskDrawerForm key={row.id} row={row} /> : null}
    </DetailDrawer>
  )
}

function isDueSoon(dueAt: string | null | undefined): boolean {
  if (!dueAt) return false
  const due = new Date(dueAt)
  const now = new Date()
  return due <= now || due.getTime() - now.getTime() < 86_400_000
}

function TaskDrawerForm({ row }: { row: CrmTask }) {
  const updateTaskMutation = useUpdateTaskMutation()
  const [status, setStatus] = useState(row.status || 'TODO')

  async function changeStatus(next: string) {
    if (next === status) return
    const prev = status
    setStatus(next)
    try {
      await updateTaskMutation.mutateAsync({ id: row.id, values: { status: next } })
      toast.success(`Task → ${label(next)}`)
    } catch {
      setStatus(prev)
      toast.error('Could not update task')
    }
  }

  const overdue = isDueSoon(row.due_at) && status !== 'DONE' && status !== 'CANCELED'

  return (
    <>
      {/* Status chip picker */}
      <DrawerSection title="Status">
        <div className="flex flex-wrap gap-[7px]">
          {TASK_STATUSES.map((s) => {
            const active = status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => changeStatus(s)}
                className={cn(
                  'rounded-full border px-[11px] py-[4px] text-[12px] font-[550] transition-colors',
                  active
                    ? 'border-transparent bg-foreground text-background'
                    : 'border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
                )}
              >
                {label(s)}
              </button>
            )
          })}
        </div>
      </DrawerSection>

      {/* Due date callout if overdue / due soon */}
      {overdue && row.due_at ? (
        <DrawerSection>
          <div className="flex items-center gap-[8px] rounded-[8px] border border-[oklch(0.65_0.18_30)/40] bg-[color-mix(in_oklch,oklch(0.65_0.18_30)_8%,transparent)] px-[11px] py-[9px]">
            <AlertCircle className="size-[14px] shrink-0 text-[oklch(0.60_0.20_30)]" />
            <span className="text-[12px] font-[550] text-[oklch(0.60_0.20_30)]">
              Due {formatDateTime(row.due_at)}
            </span>
          </div>
        </DrawerSection>
      ) : null}

      {/* Details */}
      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="Due">
            <span className="flex items-center gap-[5px]">
              {row.due_at ? <Clock className="size-[11px] text-muted-foreground" /> : null}
              {formatDateTime(row.due_at)}
            </span>
          </DescriptionItem>
          <DescriptionItem term="Assignee">{relatedName(row.assignee)}</DescriptionItem>
          <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
          <DescriptionItem term="Opportunity">{relatedName(row.opportunity)}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      {row.body ? (
        <DrawerSection title="Details">
          <div className="rounded-[8px] border bg-muted/20 px-[12px] py-[10px] text-[12.5px] leading-[1.65] text-foreground whitespace-pre-wrap">
            {row.body}
          </div>
        </DrawerSection>
      ) : null}
    </>
  )
}
