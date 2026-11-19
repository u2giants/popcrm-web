import { beforeEach, describe, expect, it, vi } from 'vitest'

// Issue #38: a delete blocked by an RLS policy touches zero rows and still
// returns success, so the UI used to report "deleted" for a row that never
// went away. These tests pin the zero-row guard on every hard-delete path
// (deleteDepartment / deleteMeetingNote / deleteNote / deleteTask), mirroring
// the updateRow guard from 2026-11-05.

// Every builder method returns the same object, which also carries the
// awaited {data, error, count} result for its table ("await obj" on a plain
// object returns the object itself).
const CHAIN_METHODS = ['select', 'delete', 'insert', 'update', 'upsert', 'eq', 'not', 'is', 'or', 'ilike', 'order', 'range', 'limit', 'single', 'maybeSingle', 'rpc']

function chainFor(result: Record<string, unknown>) {
  const chain: Record<string, unknown> = { ...result }
  for (const method of CHAIN_METHODS) chain[method] = () => chain
  return chain
}

// Live map of "<schema>.<table>" -> result its chain resolves to; reassigned per test.
let mockTables: Record<string, Record<string, unknown>> = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    schema: (schema: string) => ({
      from: (table: string) => {
        const result = mockTables[`${schema}.${table}`]
        if (!result) throw new Error(`unexpected supabase target ${schema}.${table}`)
        return chainFor(result)
      },
    }),
    auth: { getUser: async () => ({ user: { id: 'u1' } }) },
  },
}))

const api = await import('./api')

const DEPARTMENT_REFERENCE_VIEWS = [
  'crm_contact_list',
  'crm_opportunity_list',
  'crm_email_routing_queue',
  'crm_meeting_list',
  'crm_note_list',
  'crm_task_list',
]

function unreferencedDepartmentViews() {
  const out: Record<string, Record<string, unknown>> = {}
  for (const view of DEPARTMENT_REFERENCE_VIEWS) out[`api.${view}`] = { count: 0, error: null }
  return out
}

beforeEach(() => {
  mockTables = {}
})

describe('hard deletes ask for the deleted row back (issue #38)', () => {
  it.each([
    ['deleteNote', 'note'],
    ['deleteTask', 'task'],
    ['deleteMeetingNote', 'meeting_note'],
  ] as const)('%s resolves when exactly one row is deleted', async (fn, table) => {
    mockTables[`crm.${table}`] = { data: [{ id: 'row-1' }], error: null }
    await expect(api[fn]('row-1')).resolves.toBeUndefined()
  })

  it.each([
    ['deleteNote', 'note'],
    ['deleteTask', 'task'],
    ['deleteMeetingNote', 'meeting_note'],
  ] as const)('%s rejects with a permission message when zero rows come back', async (fn, table) => {
    mockTables[`crm.${table}`] = { data: [], error: null }
    await expect(api[fn]('row-1')).rejects.toThrow(
      `No rows were deleted in ${table} — your account may lack write permission for it.`,
    )
  })

  it.each([
    ['deleteNote', 'note'],
    ['deleteTask', 'task'],
    ['deleteMeetingNote', 'meeting_note'],
  ] as const)('%s still surfaces a transport/RLS error unchanged', async (fn, table) => {
    mockTables[`crm.${table}`] = { data: null, error: { code: '42501', message: 'crm: not authorized' } }
    await expect(api[fn]('row-1')).rejects.toMatchObject({ code: '42501' })
  })

  it('deleteDepartment deletes through the zero-row guard once unreferenced', async () => {
    Object.assign(mockTables, unreferencedDepartmentViews(), { 'crm.department': { data: [{ id: 'd1' }], error: null } })
    await expect(api.deleteDepartment('d1')).resolves.toBeUndefined()
  })

  it('deleteDepartment rejects with a permission message when zero rows come back', async () => {
    Object.assign(mockTables, unreferencedDepartmentViews(), { 'crm.department': { data: [], error: null } })
    await expect(api.deleteDepartment('d1')).rejects.toThrow(
      'No rows were deleted in department — your account may lack write permission for it.',
    )
  })
})
