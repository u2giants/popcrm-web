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
  fetchMeetingNotes,
  fetchNotes,
  fetchOpportunities,
  fetchRetailers,
  fetchTasks,
} from './api'
import { FIREFLIES_HEALTH_URL, needsRouting } from './constants'
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
const PENDING_APPROVAL = (a: CrmLicensorApprovalThread) =>
  a.approval_status !== 'APPROVED' && a.approval_status !== 'REJECTED'

export function CrmDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [firefliesOk, setFirefliesOk] = useState<boolean | null>(null)

  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
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
    try {
      const [
        opps,
        companies,
        contacts,
        depts,
        messages,
        meetingRows,
        rules,
        configs,
        noteRows,
        taskRows,
        approvalRows,
      ] = await Promise.all([
        fetchOpportunities(),
        fetchRetailers(-1),
        fetchBuyers(-1),
        fetchDepartments(),
        fetchEmailMessages(-1),
        fetchMeetingNotes(-1),
        fetchIgnoreRules(),
        fetchAiModelConfigs(),
        fetchNotes(),
        fetchTasks(),
        fetchApprovalThreads(),
      ])
      setOpportunities(opps)
      setRetailers(companies)
      setBuyers(contacts)
      setDepartments(depts)
      setEmails(messages)
      setMeetings(meetingRows)
      setIgnoreRules(rules)
      setAiConfigs(configs)
      setNotes(noteRows)
      setTasks(taskRows)
      setApprovals(approvalRows)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
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
