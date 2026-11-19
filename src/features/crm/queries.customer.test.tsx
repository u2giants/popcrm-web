/**
 * @vitest-environment happy-dom
 *
 * Issue #41: renaming a customer (or changing its domain/logo) must refresh
 * the brand feed and the picker feed too. useUpdateCustomerMutation drives
 * every customer save from the drawers, so its onSettled has to invalidate
 * customerBrands (what each Customer column renders name/logo from) and
 * customerPicker (what every customer dropdown lists).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// queries.ts pulls the whole api surface at import time; the real module needs
// Supabase env vars, so stub every named export it imports.
vi.mock('./api', () => ({
  archiveContact: vi.fn(),
  archiveCustomer: vi.fn(),
  archiveOpportunity: vi.fn(),
  createContact: vi.fn(),
  createCustomer: vi.fn(),
  createDepartment: vi.fn(),
  createIgnoreRule: vi.fn(),
  createNote: vi.fn(),
  createOpportunity: vi.fn(),
  createTask: vi.fn(),
  deleteIgnoreRule: vi.fn(),
  deleteMeetingNote: vi.fn(),
  deleteNote: vi.fn(),
  deleteTask: vi.fn(),
  fetchAiModelConfigs: vi.fn(),
  fetchAllContacts: vi.fn(),
  fetchApprovalThreads: vi.fn(),
  fetchContactSegment: vi.fn(),
  fetchContactSegmentCounts: vi.fn(),
  fetchContactsByDomain: vi.fn(),
  fetchCustomerBrands: vi.fn(),
  fetchCustomerIngestedDomains: vi.fn(),
  fetchCustomerPickerList: vi.fn(),
  fetchCustomerSegment: vi.fn(),
  fetchCustomerSegmentCounts: vi.fn(),
  fetchDefunctContacts: vi.fn(),
  fetchDepartments: vi.fn(),
  fetchEmailMessages: vi.fn(),
  fetchEmailStageCounts: vi.fn(),
  fetchEmailStagePage: vi.fn(),
  fetchIgnoreRules: vi.fn(),
  fetchIngestedContacts: vi.fn(),
  fetchIngestedDomainCount: vi.fn(),
  fetchIngestedDomains: vi.fn(),
  fetchMeetingNotes: vi.fn(),
  fetchNotes: vi.fn(),
  fetchOpportunities: vi.fn(),
  fetchOverviewCounts: vi.fn(),
  fetchOverviewEmailCounts: vi.fn(),
  fetchOverviewEmailVolume: vi.fn(),
  fetchOverviewPendingApprovals: vi.fn(),
  fetchOverviewPipelineStages: vi.fn(),
  fetchOverviewRecentMeetings: vi.fn(),
  fetchOverviewRecentUnrouted: vi.fn(),
  fetchRetailers: vi.fn(),
  fetchTasks: vi.fn(),
  mergeContacts: vi.fn(),
  mergeCustomers: vi.fn(),
  previewCustomerMerge: vi.fn(),
  promoteIngestedDomain: vi.fn(),
  setContactDefunct: vi.fn(),
  setOpportunityStage: vi.fn(),
  updateAiModelConfig: vi.fn(),
  updateApprovalThread: vi.fn(),
  updateBuyer: vi.fn(),
  updateDepartment: vi.fn(),
  updateEmailMessage: vi.fn(),
  updateIngestedDomain: vi.fn(),
  updateMeetingNote: vi.fn(),
  updateNote: vi.fn(),
  updateOpportunity: vi.fn(),
  updateRetailer: vi.fn(),
  updateTask: vi.fn(),
}))

const api = await import('./api')
const { crmKeys, useUpdateCustomerMutation } = await import('./queries')

afterEach(cleanup)

function Harness() {
  const mutation = useUpdateCustomerMutation()
  return (
    <button type="button" onClick={() => mutation.mutate({ id: 'c-target', values: { name: 'Renamed Corp' } })}>
      save
    </button>
  )
}

describe('useUpdateCustomerMutation cache invalidation (#41)', () => {
  it('invalidates customerBrands and customerPicker once the mutation settles', async () => {
    vi.mocked(api.updateRetailer).mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => expect(api.updateRetailer).toHaveBeenCalledWith('c-target', { name: 'Renamed Corp' }))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['crm', 'customerBrands'] })))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['crm', 'customerPicker'] })))

    // Each key is invalidated exactly once per settle, alongside the segment feeds.
    const keyOf = (call: unknown): string => String((call as { queryKey?: readonly unknown[] })?.queryKey?.join('.'))
    const brandCalls = invalidate.mock.calls.filter((call) => keyOf(call[0]) === [...crmKeys.all, 'customerBrands'].join('.'))
    const pickerCalls = invalidate.mock.calls.filter((call) => keyOf(call[0]) === [...crmKeys.all, 'customerPicker'].join('.'))
    expect(brandCalls).toHaveLength(1)
    expect(pickerCalls).toHaveLength(1)
  })
})
