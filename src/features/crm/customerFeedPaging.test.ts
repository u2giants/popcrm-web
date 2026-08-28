// PostgREST enforces a server-side row ceiling (db-max-rows). A select with no
// .range() silently comes back truncated at that ceiling with no error, so an
// unbounded read has to page explicitly. The customer picker feeds every
// combobox in the app and the brand feed resolves every Customer-column logo;
// a silent truncation there makes customers disappear from pickers and turns
// relation labels into raw ids. These tests pin the paging.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const CEILING = 1000

type Range = { from: number; to: number }
const ranges: Range[] = []
let total = 0

// Minimal PostgREST-shaped builder: only .range() bounds the result, and the
// server never returns more than CEILING rows in one response.
function makeBuilder() {
  let range: Range | null = null
  let rowLimit: number | null = null
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = chain
  builder.order = chain
  builder.limit = (n: number) => { rowLimit = n; return builder }
  builder.range = (from: number, to: number) => {
    range = { from, to }
    ranges.push(range)
    return builder
  }
  builder.then = (resolve: (r: { data: unknown[]; error: null }) => unknown) => {
    const from = range ? range.from : 0
    const to = range ? range.to : from + CEILING - 1
    const cap = rowLimit === null ? Infinity : from + rowLimit
    const end = Math.min(to + 1, from + CEILING, total, cap)
    const data = []
    for (let i = from; i < end; i += 1) data.push({ id: `c${i}`, name: `Customer ${i}`, core_status: 'active' })
    return resolve({ data, error: null })
  }
  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: { schema: () => ({ from: () => makeBuilder(), rpc: () => makeBuilder() }) },
}))

const api = await import('./api')

beforeEach(() => {
  ranges.length = 0
})

describe('unbounded customer feeds page past the PostgREST row ceiling', () => {
  it('fetchCustomerPickerList(-1) returns every customer, not the first page', async () => {
    total = 2300
    const rows = await api.fetchCustomerPickerList(-1)
    expect(rows).toHaveLength(2300)
    expect(ranges.length).toBeGreaterThan(1)
  })

  it('fetchCustomerBrands() returns every customer', async () => {
    total = 2300
    const rows = await api.fetchCustomerBrands()
    expect(rows).toHaveLength(2300)
    expect(ranges.length).toBeGreaterThan(1)
  })

  it('a bounded picker read still asks the server for just that many rows', async () => {
    total = 2300
    const rows = await api.fetchCustomerPickerList(25)
    expect(rows).toHaveLength(25)
    expect(ranges).toHaveLength(0)
  })
})
