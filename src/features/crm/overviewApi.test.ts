import { beforeEach, describe, expect, it, vi } from 'vitest'

// The Overview aggregate adapters are the whole Phase 7B contract surface: if
// they mis-map a column, every KPI, chart and panel silently reads zero. These
// tests pin the RPC names, the arguments, and the row→view-model mapping.

const rpc = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { schema: () => ({ rpc }) },
}))

const api = await import('./api')

beforeEach(() => {
  rpc.mockReset()
})

function resolveWith(data: unknown) {
  rpc.mockResolvedValue({ data, error: null })
}

describe('fetchOverviewCounts', () => {
  it('maps the single KPI row and calls the exact contract', async () => {
    resolveWith([
      {
        customers: 12,
        contacts: 34,
        open_opportunities: 5,
        meetings: 6,
        open_tasks: 7,
        pending_approvals: 8,
      },
    ])

    expect(await api.fetchOverviewCounts()).toEqual({
      customers: 12,
      contacts: 34,
      openOpportunities: 5,
      meetings: 6,
      openTasks: 7,
      pendingApprovals: 8,
    })
    expect(rpc).toHaveBeenCalledWith('crm_overview_counts', {})
  })

  it('normalizes bigint counts that arrive as strings', async () => {
    resolveWith([{ customers: '9007', contacts: null }])

    const counts = await api.fetchOverviewCounts()
    expect(counts.customers).toBe(9007)
    expect(counts.contacts).toBe(0)
  })

  it('does not swallow an authorization failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'crm: not authorized' } })
    await expect(api.fetchOverviewCounts()).rejects.toMatchObject({ code: '42501' })
  })

  it('returns zeros rather than throwing when the contract yields no row', async () => {
    resolveWith([])
    expect((await api.fetchOverviewCounts()).customers).toBe(0)
  })
})

describe('fetchOverviewEmailCounts', () => {
  it('maps every routing bucket', async () => {
    resolveWith([
      {
        total: 500,
        needs_routing: 21,
        routed: 400,
        skipped: 30,
        company_only: 10,
        company_dept: 5,
        unrouted: 4,
        no_company: 2,
        other: 0,
      },
    ])

    expect(await api.fetchOverviewEmailCounts()).toEqual({
      total: 500,
      needsRouting: 21,
      routed: 400,
      skipped: 30,
      companyOnly: 10,
      companyDept: 5,
      unrouted: 4,
      noCompany: 2,
      other: 0,
    })
  })
})

describe('fetchOverviewPipelineStages', () => {
  it('preserves the server ordering and keeps zero-count stages', async () => {
    resolveWith([
      { stage: 'DIRECTIVE_RECEIVED', count: 3 },
      { stage: 'DESIGN_IN_PROGRESS', count: 0 },
    ])

    expect(await api.fetchOverviewPipelineStages()).toEqual([
      { stage: 'DIRECTIVE_RECEIVED', count: 3 },
      { stage: 'DESIGN_IN_PROGRESS', count: 0 },
    ])
  })
})

describe('fetchOverviewEmailVolume', () => {
  it('passes the week count through and maps the series', async () => {
    resolveWith([{ week_start: '2026-05-21', ingested: 40, routed: 33 }])

    expect(await api.fetchOverviewEmailVolume(12)).toEqual([
      { weekStart: '2026-05-21', ingested: 40, routed: 33 },
    ])
    expect(rpc).toHaveBeenCalledWith('crm_overview_email_volume', { p_weeks: 12 })
  })
})

describe('bounded recent panels', () => {
  it('requests exactly the rendered row count for unrouted email', async () => {
    resolveWith([{ id: 'e1', subject: 'Re: PO', sender: 'buyer@x.com', routing_status: 'UNROUTED' }])

    expect(await api.fetchOverviewRecentUnrouted(6)).toEqual([
      { id: 'e1', subject: 'Re: PO', sender: 'buyer@x.com', routing_status: 'UNROUTED' },
    ])
    expect(rpc).toHaveBeenCalledWith('crm_overview_recent_unrouted', { p_limit: 6 })
  })

  it('rebuilds the nested company relation for meetings', async () => {
    resolveWith([
      { id: 'm1', name: 'QBR', company_id: 'c1', company_name: 'Acme', date: '2026-08-01' },
    ])

    expect(await api.fetchOverviewRecentMeetings(6)).toEqual([
      { id: 'm1', name: 'QBR', company: { id: 'c1', name: 'Acme' }, date: '2026-08-01' },
    ])
  })

  it('leaves the meeting relation null when the meeting has no company', async () => {
    resolveWith([{ id: 'm2', name: 'Intro', company_id: null, company_name: null, date: null }])

    const [meeting] = await api.fetchOverviewRecentMeetings(6)
    expect(meeting.company).toBeNull()
  })

  it('rebuilds the nested opportunity relation for approvals', async () => {
    resolveWith([
      {
        id: 'a1',
        name: 'Mickey tee',
        property_name: 'Mickey',
        opportunity_id: 'o1',
        opportunity_name: 'Spring program',
        stage: 'SUBMITTED',
      },
    ])

    expect(await api.fetchOverviewPendingApprovals(6)).toEqual([
      {
        id: 'a1',
        name: 'Mickey tee',
        property_name: 'Mickey',
        opportunity: { id: 'o1', name: 'Spring program' },
        stage: 'SUBMITTED',
      },
    ])
    expect(rpc).toHaveBeenCalledWith('crm_overview_pending_approvals', { p_limit: 6 })
  })
})
