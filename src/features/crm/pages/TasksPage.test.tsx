/**
 * @vitest-environment happy-dom
 *
 * Issue #49 step 1: the Overview "Open tasks" card counts tasks whose status
 * is not DONE/CANCELED. The Tasks page defaults to the same Open predicate,
 * so clicking through shows that exact number; All shows every task.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { CrmTask } from '@/lib/types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
// The drawer and create dialog are not under test here; nulling them keeps
// the mock surface small.
vi.mock('@/features/crm/components/TaskDrawer', () => ({ TaskDrawer: () => null }))
vi.mock('@/features/crm/components/CreateTaskDialog', () => ({ CreateTaskDialog: () => null }))

const task = (id: string, title: string, status: string | null): CrmTask => ({
  id,
  title,
  body: null,
  status,
  due_at: null,
  retailer: null,
  contact: null,
  opportunity: null,
  department: null,
  assignee: null,
})

const tasks: CrmTask[] = [
  task('t1', 'Draft brief', 'TODO'),
  task('t2', 'Chase sample', 'IN_PROGRESS'),
  task('t3', 'Untouched', null),
  task('t4', 'Done deal', 'DONE'),
  task('t5', 'Cancelled', 'CANCELED'),
]

vi.mock('@/features/crm/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/queries')>()
  return {
    ...actual,
    listData: (data: unknown) => data ?? [],
    useTasksQuery: vi.fn(() => ({ data: tasks, isPending: false, isError: false, refetch: vi.fn() })),
    useUpdateTaskMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useCustomerDisplayName: vi.fn(() => (value: unknown) =>
      value && typeof value === 'object' ? ((value as { name?: string }).name ?? '') : ''),
  }
})

const { TasksPage } = await import('./TasksPage')

function renderPage() {
  return render(
    <MemoryRouter>
      <TasksPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('Tasks Open/All segment matches the Overview aggregate (issue #49)', () => {
  it('defaults to Open: the list equals the not-DONE/CANCELED count', () => {
    renderPage()
    // Three open tasks show; the done and canceled ones do not.
    expect(screen.getByText('Draft brief')).toBeTruthy()
    expect(screen.getByText('Chase sample')).toBeTruthy()
    expect(screen.getByText('Untouched')).toBeTruthy()
    expect(screen.queryByText('Done deal')).toBeNull()
    expect(screen.queryByText('Cancelled')).toBeNull()
    // The segment counts say Open 3 / All 5.
    expect(within(screen.getByRole('tab', { name: /Open/ })).getByText('3')).toBeTruthy()
    expect(within(screen.getByRole('tab', { name: /All/ })).getByText('5')).toBeTruthy()
  })

  it('toggles to All and shows every task', () => {
    renderPage()
    // Radix tabs activate on mousedown, not click.
    fireEvent.mouseDown(screen.getByRole('tab', { name: /All/ }))
    expect(screen.getByText('Draft brief')).toBeTruthy()
    expect(screen.getByText('Done deal')).toBeTruthy()
    expect(screen.getByText('Cancelled')).toBeTruthy()
  })
})
