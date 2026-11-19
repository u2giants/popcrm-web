/**
 * @vitest-environment happy-dom
 *
 * Issue #50: an email linked to a program that has since been archived must
 * keep that link. The archived program stays visible as the selected option
 * (labelled as archived), a save sends only the fields that actually changed
 * — so changing just the status never writes `opportunity: null` — and a save
 * with nothing changed sends no update at all.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CrmDepartment, CrmEmailMessage, CrmOpportunity, Retailer } from '@/lib/types'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
// The stacked contact card is not under test here.
vi.mock('@/features/crm/components/ContactDrawer', () => ({ ContactDrawer: () => null }))

// Per-test feeds and mutation, read by the mocked query hooks below.
const state = vi.hoisted(() => ({
  retailers: [] as Retailer[],
  departments: [] as CrmDepartment[],
  opportunities: [] as CrmOpportunity[], // excludes archived programs, like the feed
  updateEmail: vi.fn(),
}))

vi.mock('@/features/crm/queries', () => ({
  listData: (data: unknown) => data ?? [],
  useDepartmentsQuery: () => ({ data: state.departments }),
  useCustomerPickerQuery: () => ({ data: state.retailers }),
  useAllContactsQuery: () => ({ data: [] }),
  useOpportunitiesQuery: () => ({ data: state.opportunities }),
  useUpdateEmailMutation: () => ({ mutateAsync: state.updateEmail }),
  useCreateIgnoreRuleMutation: () => ({ mutateAsync: vi.fn() }),
}))

const { EmailDrawer } = await import('./EmailDrawer')

const acme: Retailer = {
  id: 'c1',
  name: 'Acme',
  display_name: 'Acme',
  status: 'active',
  domain: 'acme.example',
  logo_url: null,
  customer_status: 'ACTIVE_CUSTOMER',
  chain_type: null,
  routing_aliases: null,
}

// The email's program was archived after being linked: the relation is still
// on the row, but the picker feed no longer lists it.
const emailWithArchivedProgram: CrmEmailMessage = {
  id: 'e1',
  subject: 'Re: Spring PO',
  sender: 'buyer@acme.example',
  recipients: null,
  received_at: null,
  routing_status: 'ROUTED',
  routing_method: 'MANUAL',
  body_preview: null,
  retailer: { ...acme },
  department: { id: 'd1', name: 'Buying', category: null, division: null, active: true, retailer: { ...acme }, primary_buyer: null },
  opportunity: {
    id: 'opp-old',
    name: 'Old Program',
    amount: null,
    close_date: null,
    stage: null,
    program_type: null,
    season_year: null,
    division: null,
    production_po_number: null,
    sales_order_number: null,
    hard_delivery_date: null,
    ai_summary: null,
    ai_state: null,
    retailer: null,
    contact: null,
    department: null,
    factory: null,
    project: null,
  },
}

const liveProgram: CrmOpportunity = {
  ...emailWithArchivedProgram.opportunity as CrmOpportunity,
  id: 'opp-live',
  name: 'Live Program',
}

function renderDrawer() {
  const onClose = vi.fn()
  render(<EmailDrawer row={emailWithArchivedProgram} onClose={onClose} />)
  return onClose
}

// Radix Select opens on a plain click in a non-mouse environment (its
// pointer-type ref defaults to "touch"). The trigger's accessible name
// computes empty, so Status is picked as the first select.
function pickStatus(option: string) {
  fireEvent.click(screen.getAllByRole('combobox')[0])
  fireEvent.click(screen.getByRole('option', { name: option }))
}

function apply() {
  fireEvent.click(screen.getByRole('button', { name: /apply routing/i }))
}

describe('Email drawer routing save (issue #50)', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    state.retailers = []
    state.departments = []
    state.opportunities = []
  })

  it('keeps the archived program linked when only the status changes', async () => {
    state.retailers = [acme]
    state.departments = [emailWithArchivedProgram.department as CrmDepartment]
    state.opportunities = [liveProgram]
    const onClose = renderDrawer()

    // The row's own archived program stays the selected option, labelled.
    expect(screen.getByText('Old Program (archived)')).toBeTruthy()

    pickStatus('Skipped')
    apply()

    await waitFor(() => expect(state.updateEmail).toHaveBeenCalledTimes(1))
    const { values } = state.updateEmail.mock.calls[0][0] as { id: string; values: Partial<CrmEmailMessage> }
    expect(values).toEqual({ routing_status: 'SKIPPED' })
    expect('opportunity' in values).toBe(false)
    expect('department' in values).toBe(false)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('sends the program only when it was actually changed', async () => {
    state.retailers = [acme]
    state.departments = [emailWithArchivedProgram.department as CrmDepartment]
    state.opportunities = [liveProgram]
    renderDrawer()

    fireEvent.click(screen.getByText('Old Program (archived)'))
    fireEvent.click(screen.getByText('Live Program'))
    apply()

    await waitFor(() => expect(state.updateEmail).toHaveBeenCalledTimes(1))
    const { values } = state.updateEmail.mock.calls[0][0] as { id: string; values: Partial<CrmEmailMessage> }
    expect(values.opportunity).toMatchObject({ id: 'opp-live' })
    expect('department' in values).toBe(false)
    expect('routing_status' in values).toBe(false)
  })

  it('sends nothing when nothing changed', async () => {
    state.retailers = [acme]
    state.departments = [emailWithArchivedProgram.department as CrmDepartment]
    state.opportunities = [liveProgram]
    const onClose = renderDrawer()

    apply()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(state.updateEmail).not.toHaveBeenCalled()
  })
})
