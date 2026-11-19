/**
 * @vitest-environment happy-dom
 *
 * Issue #35: a department delete is two clicks (confirm dialog), and a
 * department still referenced by contacts, programs, emails, meetings, notes
 * or tasks is refused by the server-side count guard with the exact counts —
 * nothing is deleted and the cache is left unchanged.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CrmDepartment } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { crmKeys } from '@/features/crm/queries'

const toasts = { error: vi.fn(), success: vi.fn() }
vi.mock('sonner', () => ({ toast: toasts }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const departments: CrmDepartment[] = [
  { id: 'd1', name: 'Buying', category: null, division: null, active: true, retailer: null, primary_buyer: null },
  { id: 'd2', name: 'Ecommerce', category: null, division: null, active: true, retailer: null, primary_buyer: null },
]

vi.mock('@/features/crm/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/queries')>()
  return {
    ...actual,
    useIngestedContactsQuery: vi.fn(() => ({ data: [], isPending: false })),
    useDepartmentsQuery: vi.fn(() => ({ data: departments, isPending: false })),
    useOpportunitiesQuery: vi.fn(() => ({ data: [], isPending: false })),
    useCustomerPickerQuery: vi.fn(() => ({ data: [], isPending: false })),
    useCustomerDisplayName: vi.fn(() => (value: unknown) =>
      value && typeof value === 'object' ? ((value as { name?: string }).name ?? '') : ''),
  }
})

// Programmable supabase stub: exact head counts per api.* view plus the
// crm.department delete, so the real api.ts deleteDepartment runs end-to-end.
type FakeState = {
  counts?: Record<string, { count?: number; error?: unknown }>
  deleteError?: unknown
}
type SupabaseCall = { schema: string; relation: string; kind: 'count' | 'delete'; column?: string; value?: unknown }

const supabaseCalls: SupabaseCall[] = []

function installFakeSupabase(state: FakeState) {
  supabaseCalls.length = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(supabase as any).schema = (schema: string) => ({
    from: (relation: string) => ({
      select: () => ({
        eq: (column: string, value: unknown) => {
          supabaseCalls.push({ schema, relation, kind: 'count', column, value })
          const entry = state.counts?.[relation]
          return Promise.resolve({ count: entry?.count ?? 0, error: entry?.error ?? null })
        },
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => {
          supabaseCalls.push({ schema, relation, kind: 'delete', column, value })
          return Promise.resolve({ error: state.deleteError ?? null })
        },
      }),
    }),
  })
}

const { DataAdminPage } = await import('./DataAdminPage')

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  queryClient.setQueryData(crmKeys.departments(-1), departments)
  render(
    <QueryClientProvider client={queryClient}>
      <DataAdminPage />
    </QueryClientProvider>,
  )
  return queryClient
}

function openDeleteConfirm() {
  fireEvent.click(screen.getByText('Buying'))
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
  // The confirm dialog names the department; nothing is deleted on one click.
  expect(screen.getByText('Delete this department?')).toBeTruthy()
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('DataAdmin departments delete (issue #35)', () => {
  it('is two clicks: nothing is deleted until the confirm dialog says so', () => {
    installFakeSupabase({})
    renderPage()
    openDeleteConfirm()
    expect(supabaseCalls).toHaveLength(0)
  })

  it('checks all six references server-side, then deletes an unreferenced department', async () => {
    installFakeSupabase({})
    const queryClient = renderPage()
    openDeleteConfirm()
    fireEvent.click(screen.getByRole('button', { name: 'Delete department' }))
    await waitFor(() => expect(toasts.success).toHaveBeenCalledWith('Department deleted'))
    const counts = supabaseCalls.filter((c) => c.kind === 'count')
    expect(counts).toHaveLength(6)
    expect(counts.every((c) => c.schema === 'api' && c.column === 'department_id' && c.value === 'd1')).toBe(true)
    expect(new Set(counts.map((c) => c.relation))).toEqual(
      new Set(['crm_contact_list', 'crm_opportunity_list', 'crm_email_routing_queue', 'crm_meeting_list', 'crm_note_list', 'crm_task_list']),
    )
    expect(supabaseCalls.find((c) => c.kind === 'delete')).toMatchObject({
      schema: 'crm',
      relation: 'department',
      column: 'id',
      value: 'd1',
    })
    expect(queryClient.getQueryData<CrmDepartment[]>(crmKeys.departments(-1))?.map((d) => d.id)).toEqual(['d2'])
  })

  it('refuses an in-use department with the exact counts and leaves the cache unchanged', async () => {
    installFakeSupabase({ counts: { crm_contact_list: { count: 1 }, crm_email_routing_queue: { count: 3 } } })
    const queryClient = renderPage()
    openDeleteConfirm()
    fireEvent.click(screen.getByRole('button', { name: 'Delete department' }))
    await waitFor(() => expect(toasts.error).toHaveBeenCalled())
    expect(toasts.error).toHaveBeenCalledWith('Department not deleted — it is still in use', {
      description: expect.stringContaining('1 contact and 3 emails'),
    })
    expect(supabaseCalls.filter((c) => c.kind === 'delete')).toHaveLength(0)
    expect(queryClient.getQueryData<CrmDepartment[]>(crmKeys.departments(-1))?.map((d) => d.id)).toEqual(['d1', 'd2'])
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete department' })).toBeNull())
  })

  it('fails closed when a reference count cannot be read', async () => {
    installFakeSupabase({ counts: { crm_note_list: { count: 0, error: { message: 'view is offline' } } } })
    const queryClient = renderPage()
    openDeleteConfirm()
    fireEvent.click(screen.getByRole('button', { name: 'Delete department' }))
    await waitFor(() => expect(toasts.error).toHaveBeenCalledWith('Could not delete department', expect.anything()))
    expect(supabaseCalls.filter((c) => c.kind === 'delete')).toHaveLength(0)
    expect(queryClient.getQueryData<CrmDepartment[]>(crmKeys.departments(-1))?.map((d) => d.id)).toEqual(['d1', 'd2'])
  })
})

describe('deleteDepartment guard (issue #35)', () => {
  it('throws a typed in-use error carrying the exact reference counts', async () => {
    installFakeSupabase({ counts: { crm_task_list: { count: 2 } } })
    const { deleteDepartment, DepartmentInUseError } = await import('@/features/crm/api')
    const error = await deleteDepartment('d1').then(
      () => null,
      (e: unknown) => e,
    )
    expect(error).toBeInstanceOf(DepartmentInUseError)
    expect((error as InstanceType<typeof DepartmentInUseError>).counts).toEqual({
      contacts: 0,
      programs: 0,
      emails: 0,
      meetings: 0,
      notes: 0,
      tasks: 2,
    })
    expect(supabaseCalls.filter((c) => c.kind === 'delete')).toHaveLength(0)
  })
})
