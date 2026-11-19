// Issue #43: paged reads must pin a deterministic order. Postgres returns rows
// in any order unless the query says one, so .range() pages can silently skip
// or repeat records (contacts especially run past 1,000 rows). These tests pin
// the shared helpers' trailing `id` order and the true paging of the sender
// department backlog, whose old single .limit(2000) request hit the 1,000-row
// server ceiling.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const CEILING = 1000

type RecordedOrder = { col: string; opts: Record<string, unknown> | undefined }
type RecordedRequest = {
  view: string
  orders: RecordedOrder[]
  range: { from: number; to: number } | null
  limit: number | null
  eq: [string, unknown][]
}

const requests: RecordedRequest[] = []
let dataset: Record<string, unknown>[] = []

// Minimal PostgREST-shaped builder: records the order/range/limit of each
// request chain and serves slices of `dataset`, never more than CEILING rows
// per response (the db-max-rows ceiling).
function makeBuilder(view: string) {
  const request: RecordedRequest = { view, orders: [], range: null, limit: null, eq: [] }
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = chain
  builder.order = (col: string, opts?: Record<string, unknown>) => {
    request.orders.push({ col, opts })
    return builder
  }
  builder.eq = (col: string, value: unknown) => {
    request.eq.push([col, value])
    return builder
  }
  builder.ilike = chain
  builder.is = chain
  builder.or = chain
  builder.in = chain
  builder.limit = (n: number) => {
    request.limit = n
    return builder
  }
  builder.range = (from: number, to: number) => {
    request.range = { from, to }
    return builder
  }
  builder.then = (resolve: (r: { data: unknown[]; error: null }) => unknown) => {
    const from = request.range ? request.range.from : 0
    const to = request.range ? request.range.to : from + CEILING - 1
    const cap = request.limit === null ? Infinity : from + request.limit
    const end = Math.min(to + 1, from + CEILING, dataset.length, cap)
    const data = dataset.slice(from, end)
    requests.push(request)
    return resolve({ data, error: null })
  }
  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: { schema: () => ({ from: (view: string) => makeBuilder(view) }) },
}))

const api = await import('./api')

beforeEach(() => {
  requests.length = 0
})

function rows(n: number): Record<string, unknown>[] {
  return Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` }))
}

function lastOrder(request: RecordedRequest): RecordedOrder | undefined {
  return request.orders[request.orders.length - 1]
}

describe('paged reads always carry a final id order (issue #43 step 1)', () => {
  it('an unordered list read orders every page by id', async () => {
    dataset = rows(2300)
    const out = await api.fetchIngestedContacts(-1)
    expect(out).toHaveLength(2300)
    expect(requests.length).toBe(3)
    for (const request of requests) {
      expect(request.view).toBe('crm_contact_list')
      expect(lastOrder(request)?.col).toBe('id')
    }
  })

  it('a caller order by non-unique columns keeps id as the last key', async () => {
    dataset = rows(5)
    await api.fetchTasks(-1)
    expect(requests).toHaveLength(1)
    expect(requests[0].orders.map((o) => o.col)).toEqual(['status', 'due_at', 'id'])
  })

  it('a narrowed-column paged read (customer brands) ends with the id order', async () => {
    dataset = rows(1500)
    const out = await api.fetchCustomerBrands()
    expect(out).toHaveLength(1500)
    expect(requests.length).toBe(2)
    for (const request of requests) expect(lastOrder(request)?.col).toBe('id')
  })

  it('an eq-filtered paged read (contact segment) ends with the id order', async () => {
    dataset = rows(5)
    const out = await api.fetchContactSegment('customer', -1)
    expect(out).toHaveLength(5)
    expect(requests).toHaveLength(1)
    expect(requests[0].eq).toContainEqual(['crm_segment', 'customer'])
    expect(lastOrder(requests[0])?.col).toBe('id')
  })

  it('the id-less segment-counts view stays a bounded single unordered request', async () => {
    dataset = [
      { crm_segment: 'customer', contact_count: 2 },
      { crm_segment: 'triage', contact_count: 3 },
    ]
    const counts = await api.fetchContactSegmentCounts()
    expect(counts).toEqual({ customer: 2, department: 0, triage: 3, all: 0 })
    expect(requests).toHaveLength(1)
    expect(requests[0].view).toBe('crm_contact_segment_counts')
    expect(requests[0].orders).toEqual([])
    expect(requests[0].range).toBeNull()
  })
})

describe('fetchSenderDepartmentBacklog pages past the row ceiling (issue #43 step 2)', () => {
  it('2,300 matching rows are all returned, page by ordered page', async () => {
    dataset = rows(2300)
    const ids = await api.fetchSenderDepartmentBacklog('c1', 'someone@example.com')
    expect(ids).toHaveLength(2300)
    expect(ids[0]).toBe('r0')
    expect(ids[2299]).toBe('r2299')
    expect(requests.map((r) => r.range)).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1999 },
      { from: 2000, to: 2999 },
    ])
    for (const request of requests) expect(lastOrder(request)?.col).toBe('id')
  })

  it('a short first page stops after one request', async () => {
    dataset = rows(7)
    const ids = await api.fetchSenderDepartmentBacklog('c1', 'someone@example.com')
    expect(ids).toHaveLength(7)
    expect(requests).toHaveLength(1)
  })
})
