// Issue #40 step 1: the per-record email fetch must call the exact
// api.crm_emails_for_page / api.crm_emails_for_count contract (shared-db
// migration 20261223010105) with exactly one filter, and must refuse to build
// an unfiltered (full-history) request client-side as well.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { schema: () => ({ rpc }) },
}))

const api = await import('./api')

const PAGE_ROW = {
  id: 'e1',
  subject: 'Spring order',
  sender: 'buyer@acme.example',
  recipients: 'sales@pop.example',
  received_at: '2026-01-02T03:04:05Z',
  routing_status: 'ROUTED',
  routing_method: 'EMAIL_DOMAIN',
  body_preview: 'preview',
  detected_so_numbers: null,
  detected_po_numbers: 'PO-1',
  company_id: 'c1',
  company_name: 'Acme',
  department_id: null,
  department_name: null,
  opportunity_id: 'o1',
  opportunity_name: 'Program',
  opportunity_stage: 'BUYER_REVIEW',
  updated_at: '2026-01-02T03:04:05Z',
}

function resolveRpc(page: unknown[], total: unknown) {
  rpc.mockImplementation(async (fn: string) =>
    fn === 'crm_emails_for_page' ? { data: page, error: null } : { data: total, error: null },
  )
}

beforeEach(() => {
  rpc.mockReset()
})

describe('fetchEmailsFor filter contract (#40)', () => {
  it('requests by customer id with the exact rpc names and arguments', async () => {
    resolveRpc([PAGE_ROW], 4)

    const out = await api.fetchEmailsFor({ companyId: 'c1' }, 50)

    expect(rpc).toHaveBeenCalledWith('crm_emails_for_page', {
      p_company_id: 'c1',
      p_sender: null,
      p_opportunity_id: null,
      p_limit: 50,
      p_offset: 0,
    })
    expect(rpc).toHaveBeenCalledWith('crm_emails_for_count', {
      p_company_id: 'c1',
      p_sender: null,
      p_opportunity_id: null,
    })
    expect(out.total).toBe(4)
  })

  it('requests by bare sender address', async () => {
    resolveRpc([], 0)

    await api.fetchEmailsFor({ sender: 'buyer@acme.example' }, 6)

    expect(rpc).toHaveBeenCalledWith('crm_emails_for_page', {
      p_company_id: null,
      p_sender: 'buyer@acme.example',
      p_opportunity_id: null,
      p_limit: 6,
      p_offset: 0,
    })
    expect(rpc).toHaveBeenCalledWith('crm_emails_for_count', {
      p_company_id: null,
      p_sender: 'buyer@acme.example',
      p_opportunity_id: null,
    })
  })

  it('requests by opportunity id and passes the offset through', async () => {
    resolveRpc([], 0)

    await api.fetchEmailsFor({ opportunityId: 'o1' }, 25, 100)

    expect(rpc).toHaveBeenCalledWith('crm_emails_for_page', {
      p_company_id: null,
      p_sender: null,
      p_opportunity_id: 'o1',
      p_limit: 25,
      p_offset: 100,
    })
    expect(rpc).toHaveBeenCalledWith('crm_emails_for_count', {
      p_company_id: null,
      p_sender: null,
      p_opportunity_id: 'o1',
    })
  })

  it('maps the page row to the drawer email shape', async () => {
    resolveRpc([PAGE_ROW], 1)

    const { rows } = await api.fetchEmailsFor({ companyId: 'c1' }, 50)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 'e1',
      subject: 'Spring order',
      sender: 'buyer@acme.example',
      retailer: { id: 'c1', name: 'Acme' },
      opportunity: { id: 'o1', name: 'Program', stage: 'BUYER_REVIEW' },
    })
  })

  it('normalizes a bigint count that arrives as a string', async () => {
    resolveRpc([], '4321')

    const { total } = await api.fetchEmailsFor({ companyId: 'c1' }, 50)

    expect(total).toBe(4321)
  })

  it('throws without issuing a request when no filter is given', async () => {
    await expect(api.fetchEmailsFor({}, 50)).rejects.toThrow('exactly one of companyId, sender, opportunityId')
    await expect(api.fetchEmailsFor({ companyId: '', sender: '' }, 50)).rejects.toThrow('exactly one')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('throws when more than one filter is given', async () => {
    await expect(
      api.fetchEmailsFor({ companyId: 'c1', sender: 'buyer@acme.example' }, 50),
    ).rejects.toThrow('exactly one of companyId, sender, opportunityId')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not swallow a count rpc failure', async () => {
    rpc.mockImplementation(async (fn: string) =>
      fn === 'crm_emails_for_page'
        ? { data: [], error: null }
        : { data: null, error: { code: '42501', message: 'crm: not authorized' } },
    )

    await expect(api.fetchEmailsFor({ companyId: 'c1' }, 50)).rejects.toMatchObject({ code: '42501' })
  })
})
