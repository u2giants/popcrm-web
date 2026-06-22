import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LayoutGrid, List, ListTodo } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { NameAvatar } from '@/components/app/NameAvatar'
import { StatusBadge } from '@/components/app/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { TaskDrawer } from '@/features/crm/components/TaskDrawer'
import { listData, useTasksQuery, useUpdateTaskMutation } from '@/features/crm/queries'
import { TASK_STATUSES, taskTone } from '@/features/crm/constants'
import { formatDateTime, label, relatedName, textOf } from '@/features/crm/format'
import { cn } from '@/lib/utils'
import type { CrmTask } from '@/lib/types'

function isOverdue(dueAt: string | null | undefined, status: string | null | undefined): boolean {
  if (!dueAt || status === 'DONE' || status === 'CANCELED') return false
  return new Date(dueAt) < new Date()
}

export function TasksPage() {
  const tasksQuery = useTasksQuery(-1)
  const updateTaskMutation = useUpdateTaskMutation()
  const tasks = listData(tasksQuery.data)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'table' | 'board'>('table')
  const [selected, select] = useRecordSelection<CrmTask>('task', tasks)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter(
      (t) => !q || textOf(t.title, t.body, relatedName(t.retailer), relatedName(t.opportunity), relatedName(t.assignee)).includes(q),
    )
  }, [tasks, query])

  async function quickStatus(task: CrmTask, next: string) {
    try {
      await updateTaskMutation.mutateAsync({ id: task.id, values: { status: next } })
    } catch {
      toast.error('Could not update task')
    }
  }

  const columns: Column<CrmTask>[] = [
    {
      key: 'title',
      header: 'Task',
      sortValue: (t) => t.title?.toLowerCase() ?? '',
      filterValue: (t) => t.title,
      className: 'w-full max-w-0',
      cell: (t) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{t.title || 'Task'}</div>
          <div className="truncate text-xs text-muted-foreground">{t.body}</div>
        </div>
      ),
    },
    {
      key: 'opportunity',
      header: 'Opportunity',
      hideBelow: 'lg',
      sortValue: (t) => relatedName(t.opportunity),
      filterValue: (t) => relatedName(t.opportunity),
      cell: (t) => <RelationLabel value={t.opportunity} />,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      hideBelow: 'xl',
      sortValue: (t) => relatedName(t.assignee),
      filterValue: (t) => relatedName(t.assignee),
      cell: (t) => <RelationLabel value={t.assignee} />,
    },
    {
      key: 'due_at',
      header: 'Due',
      hideBelow: 'md',
      sortValue: (t) => t.due_at ?? '',
      filterValue: (t) => t.due_at,
      cell: (t) => (
        <span className={isOverdue(t.due_at, t.status) ? 'font-[550] text-destructive' : 'text-muted-foreground'}>
          {t.due_at ? formatDateTime(t.due_at) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (t) => t.status ?? '',
      filterValue: (t) => label(t.status),
      cell: (t) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select value={t.status || 'TODO'} onValueChange={(v) => quickStatus(t, v)}>
            <SelectTrigger size="sm" className="w-36">
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
        </div>
      ),
    },
  ]

  const viewToggle = (
    <div className="flex h-[32px] overflow-hidden rounded-[8px] border">
      <button
        type="button"
        onClick={() => setView('table')}
        className={cn(
          'flex items-center gap-[5px] px-[9px] text-[12px] transition-colors',
          view === 'table' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent',
        )}
      >
        <List className="size-[13px]" /> List
      </button>
      <button
        type="button"
        onClick={() => setView('board')}
        className={cn(
          'flex items-center gap-[5px] border-l px-[9px] text-[12px] transition-colors',
          view === 'board' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent',
        )}
      >
        <LayoutGrid className="size-[13px]" /> Board
      </button>
    </div>
  )

  return (
    <AppPage
      scroll={view === 'board' ? false : true}
      listBar={
        <ListBar
          title="Tasks"
          subtitle="Open work across accounts and opportunities"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search title, body, assignee…"
          actions={viewToggle}
        />
      }
    >
      {tasksQuery.isError ? (
        <ErrorState onRetry={() => void tasksQuery.refetch()} />
      ) : view === 'board' ? (
        <TaskBoard tasks={filtered} loading={tasksQuery.isPending} onSelect={select} onStatusChange={quickStatus} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(t) => t.id}
          onRowClick={(t) => select(t)}
          loading={tasksQuery.isPending}
          emptyIcon={<ListTodo className="size-5" />}
          emptyTitle="No tasks match"
          emptyDescription="Adjust your search or column filters."
          initialSort={{ key: 'status', dir: 'asc' }}
        />
      )}
      <TaskDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}

const BOARD_COLS: { status: string; label: string; color: string }[] = [
  { status: 'TODO',        label: 'To do',      color: 'oklch(0.66 0.12 250)' },
  { status: 'IN_PROGRESS', label: 'In progress', color: 'oklch(0.62 0.17 255)' },
  { status: 'DONE',        label: 'Done',        color: 'oklch(0.60 0.15 165)' },
  { status: 'CANCELED',    label: 'Canceled',    color: 'oklch(0.58 0.04 256)' },
]

function TaskBoard({
  tasks,
  loading,
  onSelect,
  onStatusChange,
}: {
  tasks: CrmTask[]
  loading: boolean
  onSelect: (t: CrmTask) => void
  onStatusChange: (t: CrmTask, status: string) => void
}) {
  const grouped = useMemo(
    () =>
      BOARD_COLS.map((col) => ({
        ...col,
        rows: tasks.filter((t) => (t.status || 'TODO') === col.status),
      })),
    [tasks],
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-[13px] text-muted-foreground">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4 sm:px-6 lg:px-8">
      {grouped.map((col) => (
        <section
          key={col.status}
          className="flex w-[248px] shrink-0 flex-col rounded-[12px] border bg-muted/30"
        >
          {/* Column header */}
          <div className="sticky top-0 z-10 flex items-center gap-[8px] rounded-t-[12px] border-b bg-card/95 px-[12px] py-[10px] backdrop-blur">
            <span
              className="size-[8px] shrink-0 rounded-full"
              style={{ background: col.color }}
            />
            <span className="flex-1 text-[12px] font-[600] text-foreground">{col.label}</span>
            <span className="rounded-full bg-muted px-[7px] py-[1.5px] text-[11px] tabular-nums text-muted-foreground">
              {col.rows.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-[6px] overflow-y-auto p-[8px]">
            {col.rows.length === 0 ? (
              <div className="rounded-[8px] border border-dashed p-3 text-center text-[11.5px] text-muted-foreground">
                No tasks
              </div>
            ) : null}
            {col.rows.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                colColor={col.color}
                onClick={() => onSelect(task)}
                onStatusChange={(s) => onStatusChange(task, s)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function TaskCard({
  task,
  onClick,
}: {
  task: CrmTask
  colColor?: string
  onClick: () => void
  onStatusChange?: (status: string) => void
}) {
  const overdue = isOverdue(task.due_at, task.status)
  const assigneeName = relatedName(task.assignee)

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[9px] border bg-card text-left shadow-[var(--shadow-xs)] transition-all hover:border-primary/30 hover:shadow-[var(--shadow-sm)]"
    >
      <div className="p-[10px]">
        <div className="mb-[7px] line-clamp-2 text-[12.5px] font-[500] leading-snug text-foreground">
          {task.title || 'Task'}
        </div>

        {relatedName(task.opportunity) !== '—' ? (
          <div className="mb-[6px] truncate text-[11px] text-muted-foreground">
            {relatedName(task.opportunity)}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <StatusBadge tone={taskTone(task.status)} dot={false}>
            {label(task.status)}
          </StatusBadge>

          {task.due_at ? (
            <span
              className={cn(
                'text-[10.5px] tabular-nums',
                overdue ? 'font-[600] text-destructive' : 'text-muted-foreground',
              )}
            >
              {formatDateTime(task.due_at)}
            </span>
          ) : null}
        </div>
      </div>

      {assigneeName !== '—' ? (
        <div className="flex items-center gap-[7px] border-t px-[10px] py-[7px]" onClick={(e) => e.stopPropagation()}>
          <NameAvatar name={assigneeName} size={18} />
          <span className="truncate text-[11px] text-muted-foreground">{assigneeName}</span>
        </div>
      ) : null}
    </button>
  )
}
