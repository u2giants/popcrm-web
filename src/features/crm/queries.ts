import { useMemo } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  archiveContact,
  archiveCustomer,
  archiveOpportunity,
  createContact,
  createIgnoreRule,
  createNote,
  createOpportunity,
  createTask,
  createDepartment,
  deleteIgnoreRule,
  deleteMeetingNote,
  deleteNote,
  deleteTask,
  fetchCustomerBrands,
  fetchCustomerSegment,
  fetchCustomerSegmentCounts,
  fetchAiModelConfigs,
  fetchAllContacts,
  fetchApprovalThreads,
  fetchContactSegment,
  fetchContactSegmentCounts,
  fetchDepartments,
  fetchEmailMessages,
  fetchEmailStageCounts,
  fetchEmailStagePage,
  fetchEmailsFor,
  fetchIgnoreRules,
  mergeCustomers,
  mergeContacts,
  previewCustomerMerge,
  fetchIngestedContacts,
  fetchIngestedDomains,
  fetchCustomerIngestedDomains,
  fetchMeetingNotes,
  fetchNotes,
  fetchOpportunities,
  fetchOverviewCounts,
  fetchOverviewEmailCounts,
  fetchOverviewEmailVolume,
  fetchOverviewPendingApprovals,
  fetchOverviewPipelineStages,
  fetchOverviewRecentMeetings,
  fetchOverviewRecentUnrouted,
  fetchCustomerPickerList,
  fetchRetailers,
  fetchTasks,
  setOpportunityStage,
  updateAiModelConfig,
  updateApprovalThread,
  updateBuyer,
  fetchDefunctContacts,
  setContactDefunct,
  type DefunctReason,
  updateDepartment,
  updateEmailMessage,
  updateIngestedDomain,
  updateMeetingNote,
  updateNote,
  updateOpportunity,
  updateRetailer,
  createCustomer,
  fetchContactsByDomain,
  updateTask,
  type CustomerBrand,
  type CustomerSegment,
  type CustomerSegmentCounts,
  type ContactSegment,
  type ContactSegmentCounts,
  type EmailStage,
  type EmailStageCounts,
  type EmailsForFilter,
} from './api'
import { FIREFLIES_HEALTH_URL } from './constants'
import { relatedName } from './format'
import type {
  Buyer,
  CrmAiModelConfig,
  CrmDepartment,
  CrmEmailMessage,
  CrmIgnoreRule,
  CrmIngestedDomain,
  CrmLicensorApprovalThread,
  CrmMeetingNote,
  CrmNote,
  CrmOpportunity,
  CrmTask,
  Retailer,
} from '@/lib/types'

export const crmKeys = {
  all: ['crm'] as const,
  // Every Overview/Sidebar aggregate lives under this prefix, so a mutation can
  // invalidate the whole set with crmKeys.stats() exactly as it did when the
  // aggregates were one combined query.
  stats: () => [...crmKeys.all, 'stats'] as const,
  overviewCounts: () => [...crmKeys.stats(), 'counts'] as const,
  overviewEmailCounts: () => [...crmKeys.stats(), 'emailCounts'] as const,
  overviewPipeline: () => [...crmKeys.stats(), 'pipeline'] as const,
  overviewEmailVolume: (weeks = 12) => [...crmKeys.stats(), 'emailVolume', { weeks }] as const,
  overviewRecentUnrouted: (limit = 6) => [...crmKeys.stats(), 'recentUnrouted', { limit }] as const,
  overviewRecentMeetings: (limit = 6) => [...crmKeys.stats(), 'recentMeetings', { limit }] as const,
  overviewPendingApprovals: (limit = 6) => [...crmKeys.stats(), 'pendingApprovals', { limit }] as const,
  fireflies: () => [...crmKeys.all, 'fireflies'] as const,
  opportunities: (limit = -1) => [...crmKeys.all, 'opportunities', { limit }] as const,
  retailers: (limit = -1) => [...crmKeys.all, 'retailers', { limit }] as const,
  customerSegment: (segment: CustomerSegment, limit = -1) => [...crmKeys.all, 'customerSegment', segment, { limit }] as const,
  customerSegmentCounts: () => [...crmKeys.all, 'customerSegmentCounts'] as const,
  ingestedDomains: (limit = -1) => [...crmKeys.all, 'ingestedDomains', { limit }] as const,
  customerIngestedDomains: (customerId: string) => [...crmKeys.all, 'ingestedDomains', 'customer', customerId] as const,
  ingestedDomainCount: () => [...crmKeys.all, 'ingestedDomainCount'] as const,
  ingestedContacts: (limit = -1) => [...crmKeys.all, 'ingestedContacts', { limit }] as const,
  contactSegment: (segment: Exclude<ContactSegment, 'all'>, limit = -1) => [...crmKeys.all, 'contactSegment', segment, { limit }] as const,
  allContacts: (limit = -1) => [...crmKeys.all, 'allContacts', { limit }] as const,
  contactSegmentCounts: () => [...crmKeys.all, 'contactSegmentCounts'] as const,
  departments: (limit = -1) => [...crmKeys.all, 'departments', { limit }] as const,
  emails: (limit = -1) => [...crmKeys.all, 'emails', { limit }] as const,
  // One record's emails (api.crm_emails_for_page/_count, #40). The filter is
  // normalized to explicit nulls so {companyId: undefined} and {} hash alike.
  emailsFor: (filter: EmailsForFilter, limit: number) =>
    [...crmKeys.all, 'emailsFor', { companyId: filter.companyId ?? null, sender: filter.sender ?? null, opportunityId: filter.opportunityId ?? null }, { limit }] as const,
  emailStageCounts: () => [...crmKeys.all, 'emailStageCounts'] as const,
  emailStagePage: (stage: string, limit: number, offset: number) =>
    [...crmKeys.all, 'emails', 'stagePage', { stage, limit, offset }] as const,
  meetings: (limit = -1) => [...crmKeys.all, 'meetings', { limit }] as const,
  ignoreRules: () => [...crmKeys.all, 'ignoreRules'] as const,
  aiConfigs: () => [...crmKeys.all, 'aiConfigs'] as const,
  notes: (limit = -1) => [...crmKeys.all, 'notes', { limit }] as const,
  tasks: (limit = -1) => [...crmKeys.all, 'tasks', { limit }] as const,
  approvals: (limit = -1) => [...crmKeys.all, 'approvals', { limit }] as const,
}

export const crmQueryDefaults = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const

const EMPTY_LIST: never[] = []

export function listData<T>(data: T[] | undefined): T[] {
  return data ?? EMPTY_LIST
}

function updateList<T extends { id: string }>(queryClient: QueryClient, key: readonly unknown[], id: string, patch: Partial<T>) {
  queryClient.setQueryData<T[]>(key, (rows) => rows?.map((row) => (row.id === id ? { ...row, ...patch } : row)))
}

function updateMatchingLists<T extends { id: string }>(
  queryClient: QueryClient,
  prefix: readonly unknown[],
  id: string,
  patch: Partial<T>,
) {
  queryClient.setQueriesData<T[]>({ queryKey: prefix }, (rows) =>
    rows?.map((row) => (row.id === id ? { ...row, ...patch } : row)),
  )
}

function prependMatchingLists<T extends { id: string }>(queryClient: QueryClient, prefix: readonly unknown[], row: T) {
  queryClient.setQueriesData<T[]>({ queryKey: prefix }, (rows) => (rows ? [row, ...rows] : rows))
}

export function useFirefliesHealth() {
  return useQuery({
    queryKey: crmKeys.fireflies(),
    queryFn: async () => {
      try {
        const res = await fetch(FIREFLIES_HEALTH_URL)
        return res.ok
      } catch {
        // A network-level failure (blocked URL, DNS, offline) means the check
        // ran and the service is unreachable. Returning `false` keeps the
        // error out of the query state so no surface can mistake an errored
        // check (data undefined) for healthy (#54).
        return false
      }
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 120_000,
    retry: 1,
  })
}

export function useOpportunitiesQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.opportunities(limit), queryFn: () => fetchOpportunities(limit), ...crmQueryDefaults })
}

export function useRetailersQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.retailers(limit), queryFn: () => fetchRetailers(limit), ...crmQueryDefaults, staleTime: 2 * 60_000 })
}

/**
 * Brand marks (logo + domain) for every customer, keyed by id. Kept separate
 * from the segment/picker feeds because those either filter out non-curated
 * customers or drop `domain`, which is what the Customer column needs to draw a
 * real logo instead of an initials badge.
 */
export function useCustomerBrandsQuery() {
  return useQuery({
    queryKey: [...crmKeys.all, 'customerBrands'] as const,
    queryFn: fetchCustomerBrands,
    ...crmQueryDefaults,
    staleTime: 5 * 60_000,
  })
}

/** Same brand feed, keyed by customer id for per-row lookups. */
export function useCustomerBrandMap(): Map<string, CustomerBrand> {
  const brands = useCustomerBrandsQuery().data
  return useMemo(() => new Map((brands ?? []).map((b) => [b.id, b])), [brands])
}

/**
 * Resolve any customer relation to the name actually shown in the UI: the
 * display name when the customer has one, otherwise the legal name. Sorting and
 * filtering must use this — TRANSWORLD ENTERTAINMENT trading as "FYE" belongs
 * under F where the reader sees it, not under T.
 */
export function useCustomerDisplayName(): (value: Parameters<typeof relatedName>[0]) => string {
  const brands = useCustomerBrandMap()
  return useMemo(
    () => (value) => {
      const id = value && typeof value === 'object' ? (value as { id?: string }).id ?? '' : ''
      return relatedName((id ? brands.get(id) : null) ?? value)
    },
    [brands],
  )
}

export function useCustomerSegmentQuery(segment: CustomerSegment, limit = -1, enabled = true) {
  return useQuery({
    queryKey: crmKeys.customerSegment(segment, limit),
    queryFn: () => fetchCustomerSegment(segment, limit),
    ...crmQueryDefaults,
    enabled,
    staleTime: 2 * 60_000,
  })
}

/** Status-aware Customer picker feed (api.crm_customer_picker_list). */
export function useCustomerPickerQuery(limit = -1, enabled = true) {
  return useQuery({
    queryKey: [...crmKeys.all, 'customerPicker', limit] as const,
    queryFn: () => fetchCustomerPickerList(limit),
    ...crmQueryDefaults,
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useCustomerSegmentCountsQuery() {
  return useQuery<CustomerSegmentCounts>({
    queryKey: crmKeys.customerSegmentCounts(),
    queryFn: fetchCustomerSegmentCounts,
    ...crmQueryDefaults,
    staleTime: 30_000,
  })
}

export function useIngestedDomainsQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.ingestedDomains(limit), queryFn: () => fetchIngestedDomains(limit), ...crmQueryDefaults })
}

export function useCustomerIngestedDomainsQuery(customerId: string | null | undefined) {
  return useQuery({
    queryKey: crmKeys.customerIngestedDomains(customerId ?? ''),
    queryFn: () => fetchCustomerIngestedDomains(customerId as string),
    enabled: !!customerId,
    ...crmQueryDefaults,
  })
}

export function useUpdateIngestedDomainMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmIngestedDomain> }) =>
      updateIngestedDomain(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'ingestedDomains'] })
      const previous = queryClient.getQueriesData<CrmIngestedDomain[]>({ queryKey: [...crmKeys.all, 'ingestedDomains'] })
      updateMatchingLists<CrmIngestedDomain>(queryClient, [...crmKeys.all, 'ingestedDomains'], id, values)
      return { previous }
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'ingestedDomains'] }),
  })
}

export function useIngestedContactsQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.ingestedContacts(limit), queryFn: () => fetchIngestedContacts(limit), ...crmQueryDefaults })
}

export function useContactSegmentQuery(segment: Exclude<ContactSegment, 'all'>, limit = -1, enabled = true) {
  return useQuery({
    queryKey: crmKeys.contactSegment(segment, limit),
    queryFn: () => fetchContactSegment(segment, limit),
    ...crmQueryDefaults,
    enabled,
  })
}

export function useAllContactsQuery(limit = -1, enabled = true) {
  return useQuery({
    queryKey: crmKeys.allContacts(limit),
    queryFn: () => fetchAllContacts(limit),
    ...crmQueryDefaults,
    enabled,
  })
}

export function useContactSegmentCountsQuery() {
  return useQuery<ContactSegmentCounts>({
    queryKey: crmKeys.contactSegmentCounts(),
    queryFn: fetchContactSegmentCounts,
    ...crmQueryDefaults,
    staleTime: 15_000,
  })
}

export function useDepartmentsQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.departments(limit), queryFn: () => fetchDepartments(limit), ...crmQueryDefaults, staleTime: 2 * 60_000 })
}

export function useEmailsQuery(limit = -1) {
  return useQuery({
    queryKey: crmKeys.emails(limit),
    queryFn: () => fetchEmailMessages(limit),
    ...crmQueryDefaults,
    staleTime: 10_000,
    refetchInterval: 45_000,
  })
}

/**
 * One record's email history with its real count (#40): the page rows plus the
 * full-history total from api.crm_emails_for_count, so a drawer shows the
 * record's own emails however old they are, not the newest 500 company-wide.
 * Pass null to disable (drawer closed / record without the filter value).
 */
export function useEmailsForQuery(filter: EmailsForFilter | null, limit: number) {
  const query = useQuery({
    queryKey: crmKeys.emailsFor(filter ?? {}, limit),
    queryFn: () => fetchEmailsFor(filter as EmailsForFilter, limit),
    enabled: !!filter,
    ...crmQueryDefaults,
    staleTime: 10_000,
    refetchInterval: 45_000,
  })
  return {
    rows: query.data?.rows ?? [],
    total: query.data?.total ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  }
}

export function useEmailStageCountsQuery() {
  return useQuery<EmailStageCounts>({
    queryKey: crmKeys.emailStageCounts(),
    queryFn: fetchEmailStageCounts,
    ...crmQueryDefaults,
    staleTime: 10_000,
    refetchInterval: 45_000,
  })
}

export function useEmailStagePageQuery(stage: EmailStage | 'all', limit: number, offset: number) {
  return useQuery({
    queryKey: crmKeys.emailStagePage(stage, limit, offset),
    queryFn: () => fetchEmailStagePage(stage, limit, offset),
    ...crmQueryDefaults,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: 45_000,
  })
}

export function useMeetingsQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.meetings(limit), queryFn: () => fetchMeetingNotes(limit), ...crmQueryDefaults, refetchInterval: 90_000 })
}

export function useIgnoreRulesQuery() {
  return useQuery({ queryKey: crmKeys.ignoreRules(), queryFn: fetchIgnoreRules, ...crmQueryDefaults, staleTime: 2 * 60_000 })
}

export function useAiConfigsQuery() {
  return useQuery({ queryKey: crmKeys.aiConfigs(), queryFn: fetchAiModelConfigs, ...crmQueryDefaults, staleTime: 2 * 60_000 })
}

export function useNotesQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.notes(limit), queryFn: () => fetchNotes(limit), ...crmQueryDefaults, refetchInterval: 90_000 })
}

export function useTasksQuery(limit = -1) {
  return useQuery({
    queryKey: crmKeys.tasks(limit),
    queryFn: () => fetchTasks(limit),
    ...crmQueryDefaults,
    staleTime: 15_000,
    refetchInterval: 60_000,
  })
}

export function useApprovalsQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.approvals(limit), queryFn: () => fetchApprovalThreads(limit), ...crmQueryDefaults })
}

// Overview + Sidebar aggregates. One hook per failure group, all on shared
// cache keys so the sidebar and the Overview page reuse the same responses
// instead of each issuing its own network call. See
// docs/overview-aggregate-inventory.md.
const overviewDefaults = {
  ...crmQueryDefaults,
  staleTime: 45_000,
  refetchInterval: 90_000,
} as const

export function useOverviewCountsQuery() {
  return useQuery({ queryKey: crmKeys.overviewCounts(), queryFn: fetchOverviewCounts, ...overviewDefaults })
}

export function useOverviewEmailCountsQuery() {
  return useQuery({ queryKey: crmKeys.overviewEmailCounts(), queryFn: fetchOverviewEmailCounts, ...overviewDefaults })
}

export function useOverviewPipelineQuery() {
  return useQuery({ queryKey: crmKeys.overviewPipeline(), queryFn: fetchOverviewPipelineStages, ...overviewDefaults })
}

export function useOverviewEmailVolumeQuery(weeks = 12) {
  return useQuery({
    queryKey: crmKeys.overviewEmailVolume(weeks),
    queryFn: () => fetchOverviewEmailVolume(weeks),
    ...overviewDefaults,
  })
}

export function useOverviewRecentUnroutedQuery(limit = 6) {
  return useQuery({
    queryKey: crmKeys.overviewRecentUnrouted(limit),
    queryFn: () => fetchOverviewRecentUnrouted(limit),
    ...overviewDefaults,
  })
}

export function useOverviewRecentMeetingsQuery(limit = 6) {
  return useQuery({
    queryKey: crmKeys.overviewRecentMeetings(limit),
    queryFn: () => fetchOverviewRecentMeetings(limit),
    ...overviewDefaults,
  })
}

export function useOverviewPendingApprovalsQuery(limit = 6) {
  return useQuery({
    queryKey: crmKeys.overviewPendingApprovals(limit),
    queryFn: () => fetchOverviewPendingApprovals(limit),
    ...overviewDefaults,
  })
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmTask> }) => updateTask(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'tasks'] })
      const previous = queryClient.getQueriesData<CrmTask[]>({ queryKey: [...crmKeys.all, 'tasks'] })
      updateMatchingLists<CrmTask>(queryClient, [...crmKeys.all, 'tasks'], id, values)
      return { previous }
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'tasks'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useUpdateEmailMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmEmailMessage> }) => updateEmailMessage(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'emails'] })
      const previous = queryClient.getQueriesData<CrmEmailMessage[]>({ queryKey: [...crmKeys.all, 'emails'] })
      updateMatchingLists<CrmEmailMessage>(queryClient, [...crmKeys.all, 'emails'], id, values)
      return { previous }
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'emails'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.emailStageCounts() })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useCustomerMergePreviewsQuery(survivorId: string | null, loserIds: string[]) {
  return useQuery({
    queryKey: [...crmKeys.all, 'customerMergePreviews', survivorId, loserIds] as const,
    queryFn: () => Promise.all(loserIds.map((loserId) => previewCustomerMerge(survivorId!, loserId))),
    enabled: Boolean(survivorId && loserIds.length),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

export function useMergeCustomersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mergeCustomers,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.all })
    },
  })
}

export function useContactsByDomainQuery(domain: string | null) {
  return useQuery({
    queryKey: [...crmKeys.all, 'contactsByDomain', domain ?? ''] as const,
    queryFn: () => fetchContactsByDomain(domain as string),
    enabled: !!domain,
    ...crmQueryDefaults,
  })
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    // A new customer changes pickers, customer lists, domain links and contacts.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: crmKeys.all }),
  })
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Retailer> }) => updateRetailer(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'customerSegment'] })
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'retailers'] })
      const previousSegments = queryClient.getQueriesData<Retailer[]>({ queryKey: [...crmKeys.all, 'customerSegment'] })
      const previousRetailers = queryClient.getQueriesData<Retailer[]>({ queryKey: [...crmKeys.all, 'retailers'] })
      updateMatchingLists<Retailer>(queryClient, [...crmKeys.all, 'retailers'], id, values)
      updateMatchingLists<Retailer>(queryClient, [...crmKeys.all, 'customerSegment'], id, values)
      return { previousSegments, previousRetailers }
    },
    onError: (_error, _vars, context) => {
      context?.previousSegments.forEach(([key, data]) => queryClient.setQueryData(key, data))
      context?.previousRetailers.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'retailers'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'customerSegment'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.customerSegmentCounts() })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
      // The brand feed drives every Customer column (name + logo) and the
      // picker feed every customer dropdown; without these a rename or logo
      // change keeps showing the old value until their stale times expire (#41).
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'customerBrands'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'customerPicker'] })
    },
  })
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Buyer> }) => updateBuyer(id, values),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'ingestedContacts'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'buyers'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'contactSegment'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'allContacts'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.contactSegmentCounts() })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createContact,
    // Same surfaces as useUpdateContactMutation: a new contact changes every
    // contact list and the segment counts.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'ingestedContacts'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'buyers'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'contactSegment'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'allContacts'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.contactSegmentCounts() })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useArchiveContactMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveContact,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'ingestedContacts'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'buyers'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'contactSegment'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'allContacts'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.contactSegmentCounts() })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useMergeContactsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ keepId, dropId }: { keepId: string; dropId: string }) => mergeContacts(keepId, dropId),
    // A merge moves links across emails, meetings, notes, tasks and programs,
    // so refresh everything (same as the customer merge).
    onSettled: () => void queryClient.invalidateQueries({ queryKey: crmKeys.all }),
  })
}

export function useUpdateOpportunityMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmOpportunity> }) => updateOpportunity(id, values),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opportunities'] }),
  })
}

export function useCreateOpportunityMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOpportunity,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opportunities'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useArchiveOpportunityMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveOpportunity,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opportunities'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useArchiveCustomerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveCustomer,
    // Same surfaces as the customer merge: every customer-derived list.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: crmKeys.all }),
  })
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'tasks'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNote,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'notes'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'tasks'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useDeleteMeetingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMeetingNote,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'meetings'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useSetOpportunityStageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => setOpportunityStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'opportunities'] })
      const previous = queryClient.getQueriesData<CrmOpportunity[]>({ queryKey: [...crmKeys.all, 'opportunities'] })
      updateMatchingLists<CrmOpportunity>(queryClient, [...crmKeys.all, 'opportunities'], id, { stage })
      return { previous }
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opportunities'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useUpdateNoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmNote> }) => updateNote(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'notes'] })
      const previous = queryClient.getQueriesData<CrmNote[]>({ queryKey: [...crmKeys.all, 'notes'] })
      updateMatchingLists<CrmNote>(queryClient, [...crmKeys.all, 'notes'], id, values)
      return { previous }
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'notes'] }),
  })
}

export function useCreateNoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Partial<CrmNote>) => createNote(values),
    onSuccess: (note) => {
      prependMatchingLists<CrmNote>(queryClient, [...crmKeys.all, 'notes'], note)
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useCreateIgnoreRuleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Partial<CrmIgnoreRule>) => createIgnoreRule(values),
    onSuccess: (rule) => prependMatchingLists<CrmIgnoreRule>(queryClient, [...crmKeys.all, 'ignoreRules'], rule),
  })
}

export function useDeleteIgnoreRuleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteIgnoreRule,
    // Drop the row only after the delete resolved (never optimistically —
    // issue #38 rule); deleting a rule does not un-skip what it skipped.
    onSuccess: (_result, id) => {
      queryClient.setQueriesData<CrmIgnoreRule[]>({ queryKey: [...crmKeys.all, 'ignoreRules'] }, (rows) =>
        rows?.filter((rule) => rule.id !== id),
      )
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'ignoreRules'] }),
  })
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmDepartment> }) => updateDepartment(id, values),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'departments'] }),
  })
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Partial<CrmDepartment>) => createDepartment(values),
    onSuccess: (department) => {
      prependMatchingLists<CrmDepartment>(queryClient, [...crmKeys.all, 'departments'], department)
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'departments'] })
    },
  })
}

export function useUpdateMeetingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmMeetingNote> }) => updateMeetingNote(id, values),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'meetings'] }),
  })
}

export function useUpdateApprovalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmLicensorApprovalThread> }) => updateApprovalThread(id, values),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'approvals'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useUpdateAiConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmAiModelConfig> }) => updateAiModelConfig(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: crmKeys.aiConfigs() })
      const previous = queryClient.getQueryData<CrmAiModelConfig[]>(crmKeys.aiConfigs())
      updateList<CrmAiModelConfig>(queryClient, crmKeys.aiConfigs(), id, values)
      return { previous }
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(crmKeys.aiConfigs(), context?.previous),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: crmKeys.aiConfigs() }),
  })
}

export function useDefunctContactsQuery() {
  return useQuery({ queryKey: [...crmKeys.all, 'defunctContacts'] as const, queryFn: fetchDefunctContacts, ...crmQueryDefaults })
}

export function useSetContactDefunctMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: DefunctReason | null }) => setContactDefunct(id, reason),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'defunctContacts'] }),
  })
}
