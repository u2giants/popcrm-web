import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  fetchAiModelConfigs,
  fetchApprovalThreads,
  fetchBuyers,
  fetchDepartments,
  fetchEmailMessages,
  fetchIgnoreRules,
  fetchIngestedContacts,
  fetchIngestedDomains,
  fetchMeetingNotes,
  fetchNotes,
  fetchOpportunities,
  fetchRetailers,
  fetchTasks,
} from './api'
import { FIREFLIES_HEALTH_URL, isApprovalResolved, needsRouting } from './constants'
import type {
  Buyer,
  CrmAiModelConfig,
  CrmDepartment,
  CrmEmailMessage,
  CrmIgnoreRule,
  CrmLicensorApprovalThread,
  CrmMeetingNote,
  CrmNote,
  CrmOpportunity,
  CrmTask,
  Retailer,
} from '@/lib/types'

export interface CrmDashboardStats {
  accounts: number
  contacts: number
  openOpportunities: number
  emails: number
  needsRouting: number
  routed: number
  skipped: number
  companyOnly: number
  companyDept: number
  meetings: number
  openTasks: number
  pendingApprovals: number
}

interface CrmDataValue {
  loading: boolean
  error: boolean
  refresh: () => void
  firefliesOk: boolean | null

  opportunities: CrmOpportunity[]
  retailers: Retailer[]
  buyers: Buyer[]
  // Full ingested registries — used only by the triage pages (Accounts, Contacts,
  // Email Routing, Meetings). Operational pages/pickers use retailers/buyers (customers).
  ingestedDomains: Retailer[]
  ingestedContacts: Buyer[]
  departments: CrmDepartment[]
  emails: CrmEmailMessage[]
  meetings: CrmMeetingNote[]
  ignoreRules: CrmIgnoreRule[]
  aiConfigs: CrmAiModelConfig[]
  notes: CrmNote[]
  tasks: CrmTask[]
  approvals: CrmLicensorApprovalThread[]

  setOpportunities: Dispatch<SetStateAction<CrmOpportunity[]>>
  setRetailers: Dispatch<SetStateAction<Retailer[]>>
  setBuyers: Dispatch<SetStateAction<Buyer[]>>
  setIngestedDomains: Dispatch<SetStateAction<Retailer[]>>
  setIngestedContacts: Dispatch<SetStateAction<Buyer[]>>
  setDepartments: Dispatch<SetStateAction<CrmDepartment[]>>
  setEmails: Dispatch<SetStateAction<CrmEmailMessage[]>>
  setMeetings: Dispatch<SetStateAction<CrmMeetingNote[]>>
  setIgnoreRules: Dispatch<SetStateAction<CrmIgnoreRule[]>>
  setAiConfigs: Dispatch<SetStateAction<CrmAiModelConfig[]>>
  setNotes: Dispatch<SetStateAction<CrmNote[]>>
  setTasks: Dispatch<SetStateAction<CrmTask[]>>
  setApprovals: Dispatch<SetStateAction<CrmLicensorApprovalThread[]>>

  stats: CrmDashboardStats
}

const CrmDataContext = createContext<CrmDataValue | null>(null)

const OPEN_TASK = (t: CrmTask) => t.status !== 'DONE' && t.status !== 'CANCELED'
const PENDING_APPROVAL = (a: CrmLicensorApprovalThread) => !isApprovalResolved(a.stage)

export function CrmDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [firefliesOk, setFirefliesOk] = useState<boolean | null>(null)

  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [ingestedDomains, setIngestedDomains] = useState<Retailer[]>([])
  const [ingestedContacts, setIngestedContacts] = useState<Buyer[]>([])
  const [departments, setDepartments] = useState<CrmDepartment[]>([])
  const [emails, setEmails] = useState<CrmEmailMessage[]>([])
  const [meetings, setMeetings] = useState<CrmMeetingNote[]>([])
  const [ignoreRules, setIgnoreRules] = useState<CrmIgnoreRule[]>([])
  const [aiConfigs, setAiConfigs] = useState<CrmAiModelConfig[]>([])
  const [notes, setNotes] = useState<CrmNote[]>([])
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [approvals, setApprovals] = useState<CrmLicensorApprovalThread[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)

    // Load every collection independently. One collection being forbidden
    // (e.g. a Directus permission gap) or failing must NOT blank the whole app —
    // that section just stays empty. We only surface a hard error if everything
    // fails (auth/network down).
    const sources: Array<{ name: string; run: () => Promise<unknown>; set: (v: never) => void }> = [
      { name: 'opportunities', run: fetchOpportunities, set: setOpportunities as (v: never) => void },
      { name: 'accounts', run: () => fetchRetailers(-1), set: setRetailers as (v: never) => void },
      { name: 'contacts', run: () => fetchBuyers(-1), set: setBuyers as (v: never) => void },
      { name: 'ingested domains', run: () => fetchIngestedDomains(-1), set: setIngestedDomains as (v: never) => void },
      { name: 'ingested contacts', run: () => fetchIngestedContacts(-1), set: setIngestedContacts as (v: never) => void },
      { name: 'departments', run: () => fetchDepartments(), set: setDepartments as (v: never) => void },
      { name: 'emails', run: () => fetchEmailMessages(-1), set: setEmails as (v: never) => void },
      { name: 'meetings', run: () => fetchMeetingNotes(-1), set: setMeetings as (v: never) => void },
      { name: 'ignore rules', run: fetchIgnoreRules, set: setIgnoreRules as (v: never) => void },
      { name: 'AI config', run: fetchAiModelConfigs, set: setAiConfigs as (v: never) => void },
      { name: 'notes', run: fetchNotes, set: setNotes as (v: never) => void },
      { name: 'tasks', run: fetchTasks, set: setTasks as (v: never) => void },
      { name: 'approvals', run: fetchApprovalThreads, set: setApprovals as (v: never) => void },
    ]

    const results = await Promise.allSettled(sources.map((s) => s.run()))
    const failed: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        sources[i].set(result.value as never)
      } else {
        failed.push(sources[i].name)
        sources[i].set([] as never)
      }
    })

    if (failed.length) {
      console.warn(`CRM: could not load ${failed.join(', ')} (continuing with the rest)`)
    }
    // Hard error only when nothing loaded at all.
    setError(failed.length === sources.length)
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => void load())
    queueMicrotask(() => {
      fetch(FIREFLIES_HEALTH_URL)
        .then((res) => setFirefliesOk(res.ok))
        .catch(() => setFirefliesOk(false))
    })
  }, [load])

  const stats = useMemo<CrmDashboardStats>(() => {
    const by = (status: string) => emails.filter((e) => e.routing_status === status).length
    return {
      accounts: retailers.length,
      contacts: buyers.length,
      openOpportunities: opportunities.filter((o) => o.stage !== 'CLOSED').length,
      emails: emails.length,
      needsRouting: emails.filter((e) => needsRouting(e.routing_status)).length,
      routed: by('ROUTED'),
      skipped: by('SKIPPED'),
      companyOnly: by('COMPANY_ONLY'),
      companyDept: by('COMPANY_DEPT'),
      meetings: meetings.length,
      openTasks: tasks.filter(OPEN_TASK).length,
      pendingApprovals: approvals.filter(PENDING_APPROVAL).length,
    }
  }, [retailers, buyers, opportunities, emails, meetings, tasks, approvals])

  const value: CrmDataValue = {
    loading,
    error,
    refresh: () => void load(),
    firefliesOk,
    opportunities,
    retailers,
    buyers,
    ingestedDomains,
    ingestedContacts,
    departments,
    emails,
    meetings,
    ignoreRules,
    aiConfigs,
    notes,
    tasks,
    approvals,
    setOpportunities,
    setRetailers,
    setBuyers,
    setIngestedDomains,
    setIngestedContacts,
    setDepartments,
    setEmails,
    setMeetings,
    setIgnoreRules,
    setAiConfigs,
    setNotes,
    setTasks,
    setApprovals,
    stats,
  }

  return <CrmDataContext.Provider value={value}>{children}</CrmDataContext.Provider>
}

export function useCrmData() {
  const ctx = useContext(CrmDataContext)
  if (!ctx) throw new Error('useCrmData must be used within CrmDataProvider')
  return ctx
}
