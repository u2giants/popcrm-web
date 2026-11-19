import { beforeEach, describe, expect, it, vi } from 'vitest'

// Issue #58 step 1: isMissingApiObject must match only the explicit
// missing-object codes (42P01 undefined table, PGRST205 schema-cache miss,
// PGRST202 function not found). An unrelated error whose *message* says
// "does not exist" / "could not find" must not be treated as "feature not
// installed" — that swallowed real failures and rendered them as empty data.
// Observed through the helpers that still own a missing-object fallback:
// fetchContactSegmentCounts retries the crm_contact_list table when the
// segment-counts view is missing, and updateBuyer surfaces every error as-is
// since #39 removed its missing-function fallback (the server always knows
// the clear-field parameters now).

const rpc = vi.fn()
const from = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { schema: () => ({ rpc, from }) },
}))

const api = await import('./api')

beforeEach(() => {
  rpc.mockReset()
  from.mockReset()
})

// A .from() builder that awaits the queued response, the way fetchRows chains
// .select('*').limit(n) before consuming the result.
function queuedFrom(responses: Array<{ data: unknown; error: unknown }>) {
  from.mockImplementation(() => {
    const response = responses.length > 1 ? responses.shift() : responses[0]
    const builder: Record<string, unknown> = {
      select: () => builder,
      limit: () => builder,
      order: () => builder,
      eq: () => builder,
      range: () => builder,
      then: (resolve: (value: unknown) => void, reject: (value: unknown) => void) => {
        const r = response as { data: unknown; error: unknown }
        if (r.error) reject(r.error)
        else resolve(r)
      },
    }
    return builder
  })
  return from
}

describe('isMissingApiObject narrowing (#58)', () => {
  it.each(['42P01', 'PGRST205', 'PGRST202'] as const)(
    'treats code %s as a missing api object and retries the counts fallback',
    async (code) => {
      queuedFrom([
        { data: null, error: { code, message: 'object is missing' } },
        { data: [], error: null },
      ])

      await expect(api.fetchContactSegmentCounts()).resolves.toMatchObject({ all: 0 })
      expect(from).toHaveBeenCalledTimes(2)
    },
  )

  it('does not swallow an unrelated error in the counts fallback', async () => {
    queuedFrom([{ data: null, error: { code: 'XX001', message: 'cache lookup failed: type 12345 does not exist' } }])

    await expect(api.fetchContactSegmentCounts()).rejects.toMatchObject({ code: 'XX001' })
    expect(from).toHaveBeenCalledTimes(1)
  })

  it('does not swallow an unrelated error whose message says "does not exist"', async () => {
    const error = {
      code: 'XX001',
      message: 'cache lookup failed: type 12345 does not exist',
    }
    rpc.mockResolvedValue({ data: null, error })

    await expect(api.updateBuyer('c1', { name: 'Holly Price' })).rejects.toMatchObject({
      code: 'XX001',
      message: error.message,
    })
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('does not swallow an unrelated error whose message says "could not find"', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '500', message: 'worker could not find the queue' } })

    await expect(api.updateBuyer('c1', { name: 'Holly Price' })).rejects.toMatchObject({ code: '500' })
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('does not treat a codeless error with missing-object wording as missing', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'relation "api.crm_contact_list" does not exist' } })

    await expect(api.updateBuyer('c1', { name: 'Holly Price' })).rejects.toMatchObject({
      message: 'relation "api.crm_contact_list" does not exist',
    })
    expect(rpc).toHaveBeenCalledTimes(1)
  })
})
