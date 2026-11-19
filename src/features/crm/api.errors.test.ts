import { beforeEach, describe, expect, it, vi } from 'vitest'

// Issue #58 step 1: isMissingApiObject must match only the explicit
// missing-object codes (42P01 undefined table, PGRST205 schema-cache miss,
// PGRST202 function not found). An unrelated error whose *message* says
// "does not exist" / "could not find" must not be treated as "feature not
// installed" — that swallowed real failures and rendered them as empty data.
// Observed through updateBuyer, whose missing-function fallback fires only
// when the predicate matches (retry = second rpc call).

const rpc = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { schema: () => ({ rpc }) },
}))

const api = await import('./api')

beforeEach(() => {
  rpc.mockReset()
})

describe('isMissingApiObject narrowing (#58)', () => {
  it.each(['42P01', 'PGRST205', 'PGRST202'] as const)(
    'treats code %s as a missing api object and retries',
    async (code) => {
      rpc
        .mockResolvedValueOnce({ data: null, error: { code, message: 'object is missing' } })
        .mockResolvedValueOnce({ data: null, error: null })

      await expect(api.updateBuyer('c1', { name: 'Holly Price' })).resolves.toBeUndefined()
      expect(rpc).toHaveBeenCalledTimes(2)
    },
  )

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
