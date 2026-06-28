import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  createIgnoreRule,
  createNote,
  fetchAccountSegment,
  fetchAccountSegmentCounts,
  fetchAiModelConfigs,
  fetchAllContacts,
  fetchApprovalThreads,
  fetchBuyers,
  fetchContactSegment,
  fetchContactSegmentCounts,
  fetchDepartments,
  fetchEmailMessages,
  fetchEmailSegmentCounts,
  fetchIgnoreRules,
  fetchIngestedDomainCount,
  fetchIngestedContacts,
  fetchIngestedDomains,
  fetchMeetingNotes,
  fetchNotes,
  fetchOpportunities,
  fetchRetailers,
  fetchTasks,
  promoteIngestedDomain,
  setOpportunityStage,
  updateAiModelConfig,
  updateApprovalThread,
  updateBuyer,
  updateDepartment,
  updateEmailMessage,
  updateMeetingNote,
  updateNote,
  updateOpportunity,
  updateRetailer,
  updateTask,
  type AccountSegment,
  type AccountSegmentCounts,
  type ContactSegment,
  type ContactSegmentCounts,
  type EmailSegmentCounts,
} from './api'
import { FIREFLIES_HEALTH_URL } from './constants'
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
  stats: () => [...crmKeys.all, 'stats'] as const,
  fireflies: () => [...crmKeys.all, 'fireflies'] as const,
  opportunities: (limit = -1) => [...crmKeys.all, 'opportunities', { limit }] as const,
  retailers: (limit = -1) => [...crmKeys.all, 'retailers', { limit }] as const,
  accountSegment: (segment: AccountSegment, limit = -1) => [...crmKeys.all, 'accountSegment', segment, { limit }] as const,
  accountSegmentCounts: () => [...crmKeys.all, 'accountSegmentCounts'] as const,
  buyers: (limit = -1) => [...crmKeys.all, 'buyers', { limit }] as const,
  ingestedDomains: (limit = -1) => [...crmKeys.all, 'ingestedDomains', { limit }] as const,
  ingestedDomainCount: () => [...crmKeys.all, 'ingestedDomainCount'] as const,
  ingestedContacts: (limit = -1) => [...crmKeys.all, 'ingestedContacts', { limit }] as const,
  contactSegment: (segment: Exclude<ContactSegment, 'all'>, limit = -1) => [...crmKeys.all, 'contactSegment', segment, { limit }] as const,
  allContacts: (limit = -1) => [...crmKeys.all, 'allContacts', { limit }] as const,
  contactSegmentCounts: () => [...crmKeys.all, 'contactSegmentCounts'] as const,
  departments: (limit = -1) => [...crmKeys.all, 'departments', { limit }] as const,
  emails: (limit = -1) => [...crmKeys.all, 'emails', { limit }] as const,
  emailSegmentCounts: () => [...crmKeys.all, 'emailSegmentCounts'] as const,
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
      const res = await fetch(FIREFLIES_HEALTH_URL)
      return res.ok
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

export function useAccountSegmentQuery(segment: AccountSegment, limit = -1, enabled = true) {
  return useQuery({
    queryKey: crmKeys.accountSegment(segment, limit),
    queryFn: () => fetchAccountSegment(segment, limit),
    ...crmQueryDefaults,
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useAccountSegmentCountsQuery() {
  return useQuery<AccountSegmentCounts>({
    queryKey: crmKeys.accountSegmentCounts(),
    queryFn: fetchAccountSegmentCounts,
    ...crmQueryDefaults,
    staleTime: 30_000,
  })
}

export function useBuyersQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.buyers(limit), queryFn: () => fetchBuyers(limit), ...crmQueryDefaults, staleTime: 2 * 60_000 })
}

export function useIngestedDomainsQuery(limit = -1) {
  return useQuery({ queryKey: crmKeys.ingestedDomains(limit), queryFn: () => fetchIngestedDomains(limit), ...crmQueryDefaults })
}

export function useIngestedDomainCountQuery() {
  return useQuery({
    queryKey: crmKeys.ingestedDomainCount(),
    queryFn: fetchIngestedDomainCount,
    ...crmQueryDefaults,
    staleTime: 30_000,
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

export function useEmailSegmentCountsQuery() {
  return useQuery<EmailSegmentCounts>({
    queryKey: crmKeys.emailSegmentCounts(),
    queryFn: fetchEmailSegmentCounts,
    ...crmQueryDefaults,
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

export function useCrmStatsQuery() {
  return useQuery({
    queryKey: crmKeys.stats(),
    queryFn: async () => {
      const [retailers, buyers, opportunities, emails, meetings, tasks, approvals] = await Promise.all([
        fetchRetailers(-1),
        fetchBuyers(-1),
        fetchOpportunities(-1),
        fetchEmailMessages(-1),
        fetchMeetingNotes(-1),
        fetchTasks(-1),
        fetchApprovalThreads(-1),
      ])
      return { retailers, buyers, opportunities, emails, meetings, tasks, approvals }
    },
    ...crmQueryDefaults,
    staleTime: 45_000,
    refetchInterval: 90_000,
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
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Retailer> }) => updateRetailer(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'accountSegment'] })
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'retailers'] })
      const previousSegments = queryClient.getQueriesData<Retailer[]>({ queryKey: [...crmKeys.all, 'accountSegment'] })
      const previousRetailers = queryClient.getQueriesData<Retailer[]>({ queryKey: [...crmKeys.all, 'retailers'] })
      updateMatchingLists<Retailer>(queryClient, [...crmKeys.all, 'retailers'], id, values)
      updateMatchingLists<Retailer>(queryClient, [...crmKeys.all, 'accountSegment'], id, values)
      return { previousSegments, previousRetailers }
    },
    onError: (_error, _vars, context) => {
      context?.previousSegments.forEach(([key, data]) => queryClient.setQueryData(key, data))
      context?.previousRetailers.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'retailers'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'accountSegment'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.accountSegmentCounts() })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
    },
  })
}

export function usePromoteIngestedDomainMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ domain, name }: { domain: string; name: string }) => promoteIngestedDomain(domain, name),
    onMutate: async ({ domain }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKeys.all, 'ingestedDomains'] })
      const previous = queryClient.getQueriesData<CrmIngestedDomain[]>({ queryKey: [...crmKeys.all, 'ingestedDomains'] })
      queryClient.setQueriesData<CrmIngestedDomain[]>({ queryKey: [...crmKeys.all, 'ingestedDomains'] }, (rows) =>
        rows?.filter((row) => row.domain !== domain),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'ingestedDomains'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.ingestedDomainCount() })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'retailers'] })
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'accountSegment'] })
      void queryClient.invalidateQueries({ queryKey: crmKeys.accountSegmentCounts() })
      void queryClient.invalidateQueries({ queryKey: crmKeys.stats() })
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

export function useUpdateOpportunityMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmOpportunity> }) => updateOpportunity(id, values),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opportunities'] }),
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

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CrmDepartment> }) => updateDepartment(id, values),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'departments'] }),
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
