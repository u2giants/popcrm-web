// Date display contract (#48): a date entered as 20 November must read
// 20 November for staff in New York. The whole file runs in America/New_York
// (west of UTC, where the old UTC-midnight parse shifted every date-only
// string one day early); TZ is stubbed before any date is formatted.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { formatAmount, formatDate, parseDateParts } from './format'

beforeAll(() => {
  vi.stubEnv('TZ', 'America/New_York')
})

describe('parseDateParts', () => {
  it('splits a date-only string into calendar parts', () => {
    expect(parseDateParts('2026-11-20')).toEqual({ year: 2026, month: 11, day: 20 })
  })

  it('returns null for anything that is not a plain YYYY-MM-DD string', () => {
    expect(parseDateParts('2026-11-20T01:30:00Z')).toBeNull()
    expect(parseDateParts('2026-11-20 00:00')).toBeNull()
    expect(parseDateParts('2026-11')).toBeNull()
    expect(parseDateParts('')).toBeNull()
  })
})

describe('formatDate', () => {
  it('renders a date-only string as the same calendar day in New York', () => {
    // `new Date('2026-11-20')` is UTC midnight, i.e. Nov 19 EST — the bug.
    expect(formatDate('2026-11-20')).toBe('Nov 20, 2026')
  })

  it('keeps converting full timestamps to the local day', () => {
    // 01:30 UTC on the 20th is still 20:30 on the 19th in New York (EST):
    // timestamps remain instants and are not run through the date-only branch.
    expect(formatDate('2026-11-20T01:30:00Z')).toBe('Nov 19, 2026')
    expect(formatDate('2026-11-20T23:30:00Z')).toBe('Nov 20, 2026')
  })

  it('returns an em dash for missing values and passes junk through', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('not a date')).toBe('not a date')
  })
})

describe('formatAmount (#55)', () => {
  it('rounds to a whole number before choosing the unit', () => {
    // The old per-screen copies chose "k" first and printed "$1000k".
    expect(formatAmount(999_600)).toBe('$1.00M')
    expect(formatAmount(999_499)).toBe('$999k')
    expect(formatAmount(1_500)).toBe('$2k')
  })

  it('keeps the familiar bands after rounding', () => {
    expect(formatAmount(1_000_000)).toBe('$1.00M')
    expect(formatAmount(1_234_567)).toBe('$1.23M')
    expect(formatAmount(1_000)).toBe('$1k')
    // The rounding rule is uniform: 999 rounds to a whole thousand first, so
    // it displays in the k band rather than as a dollar figure.
    expect(formatAmount(999)).toBe('$1k')
    expect(formatAmount(499)).toBe('$499')
  })

  it('parses messy strings and reads missing or junk values as an em dash', () => {
    expect(formatAmount('999600')).toBe('$1.00M')
    expect(formatAmount('$1,234,567')).toBe('$1.23M')
    expect(formatAmount(null)).toBe('—')
    expect(formatAmount(undefined)).toBe('—')
    expect(formatAmount('')).toBe('—')
    expect(formatAmount('n/a')).toBe('—')
  })
})
