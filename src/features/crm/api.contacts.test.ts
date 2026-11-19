import { beforeEach, describe, expect, it, vi } from 'vitest'

// Issue #39: clearing a contact's email, phone or job title must be an
// explicit instruction. These tests pin the p_clear_* flags updateBuyer sends,
// and the honest "could not clear" failure when the server function does not
// know the flags yet (the fallback retry saves what it can, then reports the
// fields it could not clear instead of pretending the save removed them).

const rpc = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { schema: () => ({ rpc }) },
}))

const api = await import('./api')

beforeEach(() => {
  rpc.mockReset()
})

// What PostgREST returns for a named argument the deployed function lacks.
function missingFunctionRejection() {
  return {
    data: null,
    error: {
      code: 'PGRST202',
      message: 'Could not find the function api.crm_update_contact(p_clear_phone := boolean, ...) in the schema cache',
    },
  }
}

describe('updateBuyer clear flags (#39)', () => {
  it('sends p_clear_phone when the phone is explicitly nulled', async () => {
    rpc.mockResolvedValue({ data: null, error: null })

    await api.updateBuyer('c1', { phone: null })

    expect(rpc).toHaveBeenCalledTimes(1)
    const [name, args] = rpc.mock.calls[0]
    expect(name).toBe('crm_update_contact')
    expect(args.p_contact_id).toBe('c1')
    expect(args.p_phone).toBeUndefined()
    expect(args.p_clear_phone).toBe(true)
  })

  it('sends every requested clear flag and no others', async () => {
    rpc.mockResolvedValue({ data: null, error: null })

    await api.updateBuyer('c1', { email: null, job_title: null })

    const args = rpc.mock.calls[0][1]
    expect(args.p_clear_email).toBe(true)
    expect(args.p_clear_job_title).toBe(true)
    expect('p_clear_phone' in args).toBe(false)
  })

  it('keeps the clear flag off for a replacement value', async () => {
    rpc.mockResolvedValue({ data: null, error: null })

    await api.updateBuyer('c1', { phone: '555-0100' })

    const args = rpc.mock.calls[0][1]
    expect(args.p_phone).toBe('555-0100')
    expect('p_clear_phone' in args).toBe(false)
  })

  it('does not swallow an authorization failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'crm: not authorized' } })

    await expect(api.updateBuyer('c1', { phone: null })).rejects.toMatchObject({ code: '42501' })
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('retries without the new flags when the function lacks them, keeping the relationship flags, and says the field could not be cleared', async () => {
    rpc
      .mockResolvedValueOnce(missingFunctionRejection())
      .mockResolvedValueOnce({ data: null, error: null })

    await expect(api.updateBuyer('c1', { name: 'Holly Price', phone: null, department: null })).rejects.toThrow(
      /could not clear phone/i,
    )

    expect(rpc).toHaveBeenCalledTimes(2)
    const [fallbackName, fallbackArgs] = rpc.mock.calls[1]
    expect(fallbackName).toBe('crm_update_contact')
    expect(fallbackArgs.p_full_name).toBe('Holly Price')
    expect('p_clear_phone' in fallbackArgs).toBe(false)
    expect(fallbackArgs.p_clear_crm_department).toBe(true)
  })

  it('resolves quietly on the retry when nothing new needed clearing', async () => {
    rpc
      .mockResolvedValueOnce(missingFunctionRejection())
      .mockResolvedValueOnce({ data: null, error: null })

    await expect(api.updateBuyer('c1', { name: 'Holly Price' })).resolves.toBeUndefined()
  })
})
