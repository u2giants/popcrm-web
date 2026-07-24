import { describe, expect, it } from 'vitest'
import { columnDistinctValues } from './columnFilters'

type Row = { status?: string | null; score?: number | null }

describe('columnDistinctValues', () => {
  it('returns sorted distinct values', () => {
    const rows: Row[] = [{ status: 'active' }, { status: 'lead' }, { status: 'active' }]
    expect(columnDistinctValues(rows, (r) => r.status)).toEqual(['active', 'lead'])
  })

  it('surfaces a single blank sentinel first when any value is empty/null/undefined', () => {
    const rows: Row[] = [
      { status: 'active' },
      { status: null },
      { status: '' },
      { status: '   ' }, // whitespace-only counts as blank
      { status: undefined },
      { status: 'lead' },
    ]
    // Exactly one '' sentinel, first, then the sorted real values.
    expect(columnDistinctValues(rows, (r) => r.status)).toEqual(['', 'active', 'lead'])
  })

  it('omits the blank sentinel when every row has a value', () => {
    const rows: Row[] = [{ status: 'active' }, { status: 'lead' }]
    expect(columnDistinctValues(rows, (r) => r.status)).not.toContain('')
  })

  it('coerces numbers to strings and trims', () => {
    const rows: Row[] = [{ score: 10 }, { score: 2 }, { score: 10 }]
    expect(columnDistinctValues(rows, (r) => r.score)).toEqual(['10', '2'])
  })

  it('returns an empty array for no rows', () => {
    expect(columnDistinctValues([] as Row[], (r) => r.status)).toEqual([])
  })
})
