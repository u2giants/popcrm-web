import { afterEach, describe, expect, it, vi } from 'vitest'

import { rowsOrReport } from './searchResults'

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
