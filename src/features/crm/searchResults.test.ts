import { afterEach, describe, expect, it, vi } from 'vitest'

import { failedSearchGroups, rowsOrReport } from './searchResults'

describe('rowsOrReport', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns successful rows', () => {
    expect(rowsOrReport('customers', { data: [{ id: '1' }], error: null })).toEqual([{ id: '1' }])
  })

  it('reports one failed group and lets the other search groups render', () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(rowsOrReport('emails', { data: null, error: { code: '57014' } })).toEqual([])
    expect(report).toHaveBeenCalledWith(
      'CommandSearch: emails query failed',
      { code: '57014' },
    )
  })
})

describe('failedSearchGroups', () => {
  it('names only the groups that failed', () => {
    expect(
      failedSearchGroups({
        customers: { data: [{ id: '1' }], error: null },
        contacts: { data: null, error: { code: '57014' } },
        opportunities: { data: [], error: null },
        emails: { data: null, error: { code: '42P01' } },
      }),
    ).toEqual(['contacts', 'emails'])
  })

  it('returns an empty list when every group succeeded', () => {
    expect(
      failedSearchGroups({
        customers: { data: [], error: null },
        emails: { data: null, error: null },
      }),
    ).toEqual([])
  })
})
