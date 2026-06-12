import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ListTodo } from 'lucide-react'
import { AppPage } from '@/components/app/AppPage'
import { PageToolbar } from '@/components/app/PageToolbar'
import { FilterSelect } from '@/components/app/FilterSelect'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState } from '@/components/app/states'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { TaskDrawer } from '@/features/crm/components/TaskDrawer'
import { updateTask } from '@/features/crm/api'
import { TASK_STATUSES } from '@/features/crm/constants'
import { formatDateTime, label, relatedName, textOf } from '@/features/crm/format'
import type { CrmTask } from '@/lib/types'

export function TasksPage() {
  const { tasks, loading, error, refresh, setTasks } = useCrmData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [selected, select] = useRecordSelection<CrmTask>('task', tasks)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter(
      (t) =>
        (!q || textOf(t.title, t.body, relatedName(t.retailer), relatedName(t.opportunity), relatedName(t.assignee)).includes(q)) &&
        (!status || t.status === status),
    )
  }, [tasks, query, status])

  async function quickStatus(task: CrmTask, next: string) {
    const prev = task.status
    setTasks((rows) => rows.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
    try {
      await updateTask(task.id, { status: next })
    } catch {
      setTasks((rows) => rows.map((t) => (t.id === task.id ? { ...t, status: prev ?? null } : t)))
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
      cell: (t) => <RelationLabel value={t.opportunity} />,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      hideBelow: 'xl',
      sortValue: (t) => relatedName(t.assignee),
      cell: (t) => <RelationLabel value={t.assignee} />,
    },
    {
      key: 'due_at',
      header: 'Due',
      hideBelow: 'md',
      sortValue: (t) => t.due_at ?? '',
      className: 'text-muted-foreground',
      cell: (t) => (t.due_at ? formatDateTime(t.due_at) : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (t) => t.status ?? '',
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

  return (
    <AppPage
      title="Tasks"
      description="Open work across accounts and opportunities."
      actions={<Badge variant="outline">{filtered.length.toLocaleString()} shown</Badge>}
      toolbar={
        <PageToolbar
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search title, body, assignee…"
          showClear={!!status}
          onClear={() => setStatus('')}
          filters={
            <FilterSelect
              value={status}
              onChange={setStatus}
              allLabel="All statuses"
              placeholder="Status"
              options={TASK_STATUSES.map((s) => ({ value: s, label: label(s) }))}
            />
          }
        />
      }
    >
      {error ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(t) => t.id}
          onRowClick={(t) => select(t)}
          loading={loading}
          emptyIcon={<ListTodo className="size-5" />}
          emptyTitle="No tasks match"
          emptyDescription="Adjust your search or filters."
          initialSort={{ key: 'status', dir: 'asc' }}
        />
      )}
      <TaskDrawer row={selected} onClose={() => select(null)} />
    </AppPage>
  )
}
