import { useState } from 'react'
import { toast } from 'sonner'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { updateTask } from '@/features/crm/api'
import { TASK_STATUSES } from '@/features/crm/constants'
import { formatDateTime, label, relatedName } from '@/features/crm/format'
import type { CrmTask } from '@/lib/types'

export function TaskDrawer({ row, onClose }: { row: CrmTask | null; onClose: () => void }) {
  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.title || 'Task'}
      subtitle={row ? relatedName(row.opportunity) : undefined}
      status={row ? <CrmStatusBadge kind="task" status={row.status} /> : undefined}
    >
      {row ? <TaskDrawerForm key={row.id} row={row} /> : null}
    </DetailDrawer>
  )
}

function TaskDrawerForm({ row }: { row: CrmTask }) {
  const { setTasks } = useCrmData()
  const [status, setStatus] = useState(row.status || 'TODO')

  async function changeStatus(next: string) {
    const prev = status
    setStatus(next)
    setTasks((rows) => rows.map((t) => (t.id === row.id ? { ...t, status: next } : t)))
    try {
      await updateTask(row.id, { status: next })
      toast.success(`Task → ${label(next)}`)
    } catch {
      setStatus(prev)
      setTasks((rows) => rows.map((t) => (t.id === row.id ? { ...t, status: prev } : t)))
      toast.error('Could not update task')
    }
  }

  return (
    <>
      <DrawerSection title="Status">
        <Select value={status} onValueChange={changeStatus}>
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {label(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DrawerSection>

      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="Due">{formatDateTime(row.due_at)}</DescriptionItem>
          <DescriptionItem term="Assignee">{relatedName(row.assignee)}</DescriptionItem>
          <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
          <DescriptionItem term="Opportunity">{relatedName(row.opportunity)}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      {row.body ? (
        <DrawerSection title="Details">
          <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap text-foreground">
            {row.body}
          </div>
        </DrawerSection>
      ) : null}
    </>
  )
}
