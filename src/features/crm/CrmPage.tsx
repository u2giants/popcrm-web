import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  Contact,
  Inbox,
  LayoutDashboard,
  ListTodo,
  MailWarning,
  NotebookTabs,
  Plus,
  RefreshCcw,
  Route,
  Save,
  Search,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  AI_MODELS,
  OPPORTUNITY_STAGES,
  createIgnoreRule,
  createNote,
  fetchAiModelConfigs,
  fetchApprovalThreads,
  fetchBuyers,
  fetchEmailMessages,
  fetchIgnoreRules,
  fetchMeetingNotes,
  fetchNotes,
  fetchOpportunities,
  fetchRetailers,
  fetchTasks,
  label,
  relatedName,
  setOpportunityStage,
  updateAiModelConfig,
  updateEmailMessage,
  updateOpportunity,
  updateTask,
} from './api'
import type {
  Buyer,
  CrmAiModelConfig,
  CrmEmailMessage,
  CrmIgnoreRule,
  CrmLicensorApprovalThread,
  CrmMeetingNote,
  CrmNote,
  CrmOpportunity,
  CrmTask,
  Retailer,
} from '@/lib/types'

type Tab = 'pipeline' | 'companies' | 'contacts' | 'email' | 'meetings' | 'routing' | 'notes' | 'tasks' | 'approvals' | 'settings'

const ROUTING_STATUSES = ['UNROUTED', 'COMPANY_ONLY', 'COMPANY_DEPT', 'CUSTOMER_EMAIL_NO_COMPANY', 'ROUTED', 'SKIPPED']
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELED']

function statLabel(count: number, noun: string) {
  return `${count.toLocaleString()} ${noun}`
}

function textOf(...values: unknown[]) {
  return values.filter(Boolean).join(' ').toLowerCase()
}

function idOf(value: string | { id?: string } | null | undefined) {
  if (!value) return ''
  return typeof value === 'string' ? value : value.id || ''
}

export function CrmPage() {
  const [tab, setTab] = useState<Tab>('pipeline')
  const [query, setQuery] = useState('')
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [emails, setEmails] = useState<CrmEmailMessage[]>([])
  const [meetings, setMeetings] = useState<CrmMeetingNote[]>([])
  const [ignoreRules, setIgnoreRules] = useState<CrmIgnoreRule[]>([])
  const [aiConfigs, setAiConfigs] = useState<CrmAiModelConfig[]>([])
  const [notes, setNotes] = useState<CrmNote[]>([])
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [approvals, setApprovals] = useState<CrmLicensorApprovalThread[]>([])
  const [selectedEmail, setSelectedEmail] = useState<CrmEmailMessage | null>(null)
  const [selectedOpportunity, setSelectedOpportunity] = useState<CrmOpportunity | null>(null)
  const [firefliesOk, setFirefliesOk] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [opps, companies, contacts, messages, meetingRows, rules, configs, noteRows, taskRows, approvalRows] = await Promise.all([
      fetchOpportunities(),
      fetchRetailers(1000),
      fetchBuyers(1000),
      fetchEmailMessages(1000),
      fetchMeetingNotes(300),
      fetchIgnoreRules(),
      fetchAiModelConfigs(),
      fetchNotes(),
      fetchTasks(),
      fetchApprovalThreads(),
    ])
    setOpportunities(opps)
    setRetailers(companies)
    setBuyers(contacts)
    setEmails(messages)
    setMeetings(meetingRows)
    setIgnoreRules(rules)
    setAiConfigs(configs)
    setNotes(noteRows)
    setTasks(taskRows)
    setApprovals(approvalRows)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    queueMicrotask(() => load().catch(() => {
      if (active) setLoading(false)
    }))
    queueMicrotask(() => {
      fetch('https://crm-fireflies.designflow.app/health')
        .then((res) => setFirefliesOk(res.ok))
        .catch(() => setFirefliesOk(false))
    })
    return () => { active = false }
  }, [])

  const q = query.trim().toLowerCase()
  const unrouted = emails.filter((email) => email.routing_status && !['ROUTED', 'SKIPPED'].includes(email.routing_status))

  const filteredRetailers = useMemo(() => retailers.filter((row) => !q || textOf(row.name, row.domain, row.customer_status, row.chain_type).includes(q)), [q, retailers])
  const filteredBuyers = useMemo(() => buyers.filter((row) => !q || textOf(row.name, row.email, row.contact_type, relatedName(row.retailer), relatedName(row.department)).includes(q)), [q, buyers])
  const filteredEmails = useMemo(() => emails.filter((row) => !q || textOf(row.subject, row.sender, row.routing_status, relatedName(row.retailer), relatedName(row.department)).includes(q)), [q, emails])
  const filteredMeetings = useMemo(() => meetings.filter((row) => !q || textOf(row.name, row.participants, row.summary, relatedName(row.retailer), relatedName(row.department)).includes(q)), [q, meetings])
  const filteredNotes = useMemo(() => notes.filter((row) => !q || textOf(row.title, row.body, row.action_items, relatedName(row.retailer), relatedName(row.opportunity)).includes(q)), [q, notes])
  const filteredTasks = useMemo(() => tasks.filter((row) => !q || textOf(row.title, row.body, row.status, relatedName(row.retailer), relatedName(row.opportunity)).includes(q)), [q, tasks])
  const filteredApprovals = useMemo(() => approvals.filter((row) => !q || textOf(row.name, row.licensor_name, row.approval_status, row.latest_comment, relatedName(row.opportunity)).includes(q)), [q, approvals])

  async function moveOpportunity(id: string, stage: string) {
    const prior = opportunities
    setOpportunities((rows) => rows.map((row) => row.id === id ? { ...row, stage } : row))
    try {
      await setOpportunityStage(id, stage)
    } catch {
      setOpportunities(prior)
    }
  }

  async function saveEmail(id: string, values: Partial<CrmEmailMessage>) {
    await updateEmailMessage(id, values)
    setEmails((rows) => rows.map((row) => row.id === id ? { ...row, ...values } : row))
  }

  async function saveTask(id: string, status: string) {
    await updateTask(id, { status })
    setTasks((rows) => rows.map((row) => row.id === id ? { ...row, status } : row))
  }

  const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: 'pipeline', label: 'Pipeline', icon: <LayoutDashboard className="size-4" /> },
    { id: 'companies', label: 'Companies', icon: <Building2 className="size-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <Contact className="size-4" /> },
    { id: 'email', label: 'Email', icon: <Inbox className="size-4" /> },
    { id: 'routing', label: 'Routing', icon: <Route className="size-4" /> },
    { id: 'meetings', label: 'Meetings', icon: <CalendarDays className="size-4" /> },
    { id: 'notes', label: 'Notes', icon: <NotebookTabs className="size-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="size-4" /> },
    { id: 'approvals', label: 'Approvals', icon: <ShieldCheck className="size-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings2 className="size-4" /> },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      <section className="border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((item) => (
            <Button key={item.id} variant={tab === item.id ? 'default' : 'ghost'} size="sm" onClick={() => setTab(item.id)}>
              {item.icon}
              {item.label}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="ml-auto size-8" onClick={() => load()} title="Refresh CRM">
            <RefreshCcw className="size-4" />
          </Button>
          <div className="flex min-w-64 items-center gap-2 rounded-md border bg-card px-2">
            <Search className="size-4 text-muted-foreground" />
            <Input className="h-8 border-0 px-0 shadow-none focus-visible:ring-0" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search CRM" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{statLabel(retailers.length, 'companies')}</Badge>
          <Badge variant="outline">{statLabel(buyers.length, 'contacts')}</Badge>
          <Badge variant="outline">{statLabel(emails.length, 'emails')}</Badge>
          <Badge variant={unrouted.length ? 'destructive' : 'outline'}>{statLabel(unrouted.length, 'needs routing')}</Badge>
          <Badge variant={firefliesOk ? 'secondary' : 'outline'}>Fireflies {firefliesOk === null ? 'checking' : firefliesOk ? 'online' : 'offline'}</Badge>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading CRM...</div>
      ) : (
        <>
          {tab === 'pipeline' && <Pipeline opportunities={opportunities} onMove={moveOpportunity} onOpen={setSelectedOpportunity} />}
          {tab === 'companies' && <CompanyList rows={filteredRetailers} />}
          {tab === 'contacts' && <ContactList rows={filteredBuyers} />}
          {tab === 'email' && <EmailList rows={filteredEmails} onOpen={setSelectedEmail} />}
          {tab === 'routing' && <RoutingWorkbench rows={unrouted} ignoreRules={ignoreRules} onOpenEmail={setSelectedEmail} onRuleCreated={(rule) => setIgnoreRules((rows) => [rule, ...rows])} />}
          {tab === 'meetings' && <MeetingList rows={filteredMeetings} />}
          {tab === 'notes' && <NotesList rows={filteredNotes} onCreated={(note) => setNotes((rows) => [note, ...rows])} />}
          {tab === 'tasks' && <TaskList rows={filteredTasks} onStatus={saveTask} />}
          {tab === 'approvals' && <ApprovalList rows={filteredApprovals} />}
          {tab === 'settings' && <SettingsPanel aiConfigs={aiConfigs} onConfigChange={(config) => setAiConfigs((rows) => rows.map((row) => row.id === config.id ? config : row))} />}
        </>
      )}

      <EmailSheet
        row={selectedEmail}
        retailers={retailers}
        opportunities={opportunities}
        onClose={() => setSelectedEmail(null)}
        onSave={saveEmail}
      />
      <OpportunitySheet
        row={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onSave={async (id, values) => {
          await updateOpportunity(id, values)
          setOpportunities((rows) => rows.map((row) => row.id === id ? { ...row, ...values } : row))
        }}
      />
    </div>
  )
}

function Pipeline({ opportunities, onMove, onOpen }: { opportunities: CrmOpportunity[]; onMove: (id: string, stage: string) => void; onOpen: (row: CrmOpportunity) => void }) {
  const grouped = OPPORTUNITY_STAGES.map((stage) => ({
    stage,
    rows: opportunities.filter((opp) => (opp.stage || OPPORTUNITY_STAGES[0]) === stage),
  }))

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid min-w-[1200px] grid-cols-8 gap-3 p-4">
        {grouped.map((group) => (
          <section key={group.stage} className="flex min-h-[calc(100svh-170px)] flex-col rounded-md border bg-muted/25">
            <div className="flex h-11 items-center justify-between border-b px-3">
              <div className="truncate text-sm font-medium">{label(group.stage)}</div>
              <Badge variant="secondary">{group.rows.length}</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2">
              {group.rows.length === 0 ? <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">No programs</div> : null}
              {group.rows.map((opp) => (
                <article key={opp.id} className="shrink-0 rounded-md border bg-card p-3 shadow-sm">
                  <button className="line-clamp-2 text-left text-sm font-medium hover:underline" onClick={() => onOpen(opp)}>{opp.name || 'Untitled program'}</button>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>{relatedName(opp.retailer)}</div>
                    <div>{relatedName(opp.department)}</div>
                    {opp.production_po_number || opp.sales_order_number ? <div>PO/SO {opp.production_po_number || opp.sales_order_number}</div> : null}
                  </div>
                  <select className="mt-3 h-8 w-full rounded-md border bg-background px-2 text-xs" value={opp.stage || OPPORTUNITY_STAGES[0]} onChange={(event) => onMove(opp.id, event.target.value)}>
                    {OPPORTUNITY_STAGES.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
                  </select>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ScrollArea>
  )
}

function CompanyList({ rows }: { rows: Retailer[] }) {
  return <Grid rows={rows} render={(row) => (
    <article className="rounded-md border bg-card p-3">
      <div className="font-medium">{row.name}</div>
      <div className="mt-2 text-sm text-muted-foreground">{row.domain || 'No domain'}</div>
      <div className="mt-3 flex gap-2"><Badge variant="secondary">{label(row.customer_status)}</Badge><Badge variant="outline">{label(row.chain_type)}</Badge></div>
    </article>
  )} />
}

function ContactList({ rows }: { rows: Buyer[] }) {
  return <Grid rows={rows} render={(row) => (
    <article className="rounded-md border bg-card p-3">
      <div className="font-medium">{row.name}</div>
      <div className="mt-1 text-sm text-muted-foreground">{row.email || 'No email'}</div>
      <div className="mt-3 text-sm">{relatedName(row.retailer)}</div>
      <div className="mt-2 flex gap-2"><Badge variant="secondary">{label(row.contact_type)}</Badge><Badge variant="outline">{label(row.scope)}</Badge></div>
    </article>
  )} />
}

function EmailList({ rows, onOpen }: { rows: CrmEmailMessage[]; onOpen: (row: CrmEmailMessage) => void }) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="divide-y">
        {rows.map((row) => (
          <button key={row.id} className="grid w-full gap-3 px-4 py-3 text-left hover:bg-muted/45 md:grid-cols-[180px_1fr_180px_160px]" onClick={() => onOpen(row)}>
            <div className="text-sm text-muted-foreground">{row.received_at || '-'}</div>
            <div>
              <div className="font-medium">{row.subject || '(no subject)'}</div>
              <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">{row.body_preview}</div>
            </div>
            <div className="text-sm">{relatedName(row.retailer)}</div>
            <div className="flex items-start gap-2">
              {row.routing_status !== 'ROUTED' && row.routing_status !== 'SKIPPED' ? <MailWarning className="mt-0.5 size-4 text-destructive" /> : null}
              <Badge variant={row.routing_status === 'ROUTED' ? 'secondary' : row.routing_status === 'SKIPPED' ? 'outline' : 'destructive'}>{label(row.routing_status)}</Badge>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

function RoutingWorkbench({ rows, ignoreRules, onOpenEmail, onRuleCreated }: { rows: CrmEmailMessage[]; ignoreRules: CrmIgnoreRule[]; onOpenEmail: (row: CrmEmailMessage) => void; onRuleCreated: (row: CrmIgnoreRule) => void }) {
  const [pattern, setPattern] = useState('')
  const [matchType, setMatchType] = useState('CONTAINS')

  async function addRule() {
    if (!pattern.trim()) return
    const rule = await createIgnoreRule({ name: pattern.trim(), pattern: pattern.trim(), match_type: matchType, emails_skipped: 0 })
    onRuleCreated(rule)
    setPattern('')
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
        <section className="rounded-md border">
          <div className="flex h-12 items-center justify-between border-b px-3">
            <div className="font-medium">Needs Routing</div>
            <Badge variant={rows.length ? 'destructive' : 'secondary'}>{rows.length}</Badge>
          </div>
          <div className="divide-y">
            {rows.map((row) => (
              <button key={row.id} className="grid w-full gap-3 px-3 py-3 text-left hover:bg-muted/45 md:grid-cols-[1fr_160px_140px]" onClick={() => onOpenEmail(row)}>
                <div>
                  <div className="font-medium">{row.subject || '(no subject)'}</div>
                  <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">{row.sender}</div>
                </div>
                <div className="text-sm">{relatedName(row.retailer)}</div>
                <Badge variant="destructive">{label(row.routing_status)}</Badge>
              </button>
            ))}
            {!rows.length ? <div className="p-6 text-sm text-muted-foreground">No messages need manual routing.</div> : null}
          </div>
        </section>
        <aside className="space-y-4">
          <section className="rounded-md border p-3">
            <div className="font-medium">Worker Cadence</div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Outlook ingest</span><Badge variant="outline">15 min</Badge></div>
              <div className="flex justify-between"><span>Reroute pass</span><Badge variant="outline">6 hours</Badge></div>
              <div className="flex justify-between"><span>Contact sync</span><Badge variant="outline">daily</Badge></div>
              <div className="flex justify-between"><span>Summaries</span><Badge variant="outline">6 hours</Badge></div>
            </div>
          </section>
          <section className="rounded-md border p-3">
            <div className="font-medium">Ignore Rules</div>
            <div className="mt-3 flex gap-2">
              <Input value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="Subject pattern" />
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={matchType} onChange={(event) => setMatchType(event.target.value)}>
                {['CONTAINS', 'STARTS_WITH', 'EXACT'].map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </select>
              <Button size="icon" onClick={addRule} title="Add ignore rule"><Plus className="size-4" /></Button>
            </div>
            <div className="mt-3 space-y-2">
              {ignoreRules.map((rule) => (
                <div key={rule.id} className="rounded-md border bg-muted/30 p-2 text-sm">
                  <div className="font-medium">{rule.pattern}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{label(rule.match_type)} · {rule.emails_skipped || 0} skipped</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </ScrollArea>
  )
}

function MeetingList({ rows }: { rows: CrmMeetingNote[] }) {
  return <Grid rows={rows} render={(row) => (
    <article className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{row.date || 'No date'}</div>
      <div className="mt-1 font-medium">{row.name || 'Meeting'}</div>
      <div className="mt-2 line-clamp-4 text-sm text-muted-foreground">{row.summary || row.participants}</div>
      <div className="mt-3 flex gap-2"><Badge variant="secondary">{relatedName(row.retailer)}</Badge><Badge variant="outline">{label(row.source)}</Badge></div>
    </article>
  )} />
}

function NotesList({ rows, onCreated }: { rows: CrmNote[]; onCreated: (row: CrmNote) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  async function addNote() {
    if (!title.trim() && !body.trim()) return
    const note = await createNote({ title: title.trim() || 'CRM note', body, source: 'MANUAL' })
    onCreated(note)
    setTitle('')
    setBody('')
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-4 p-4 xl:grid-cols-[360px_1fr]">
        <section className="rounded-md border p-3">
          <div className="font-medium">New Note</div>
          <Input className="mt-3" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          <Textarea className="mt-2 min-h-32" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Body" />
          <Button className="mt-3" onClick={addNote}><Plus className="size-4" /> Add note</Button>
        </section>
        <Grid rows={rows} render={(row) => (
          <article className="rounded-md border bg-card p-3">
            <div className="font-medium">{row.title || 'CRM note'}</div>
            <div className="mt-2 line-clamp-5 text-sm text-muted-foreground">{row.body || row.action_items}</div>
            <div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{label(row.source)}</Badge><Badge variant="outline">{relatedName(row.opportunity)}</Badge></div>
          </article>
        )} plain />
      </div>
    </ScrollArea>
  )
}

function TaskList({ rows, onStatus }: { rows: CrmTask[]; onStatus: (id: string, status: string) => void }) {
  return <Grid rows={rows} render={(row) => (
    <article className="rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{row.title || 'Task'}</div>
          <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">{row.body}</div>
        </div>
        {row.status === 'DONE' ? <CheckCircle2 className="size-5 text-emerald-600" /> : null}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{row.due_at ? new Date(row.due_at).toLocaleString() : 'No due date'}</div>
      <select className="mt-3 h-8 w-full rounded-md border bg-background px-2 text-xs" value={row.status || 'TODO'} onChange={(event) => onStatus(row.id, event.target.value)}>
        {TASK_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
      </select>
    </article>
  )} />
}

function ApprovalList({ rows }: { rows: CrmLicensorApprovalThread[] }) {
  return <Grid rows={rows} render={(row) => (
    <article className="rounded-md border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{row.name || row.licensor_name || 'Approval'}</div>
        <Badge variant={row.approval_status === 'APPROVED' ? 'secondary' : 'outline'}>{label(row.approval_status)}</Badge>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{relatedName(row.opportunity)}</div>
      <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">{row.latest_comment}</div>
    </article>
  )} />
}

function SettingsPanel({ aiConfigs, onConfigChange }: { aiConfigs: CrmAiModelConfig[]; onConfigChange: (row: CrmAiModelConfig) => void }) {
  async function save(config: CrmAiModelConfig, field: keyof CrmAiModelConfig, value: string) {
    const next = { ...config, [field]: value }
    onConfigChange(next)
    await updateAiModelConfig(config.id, { [field]: value })
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-4 p-4 xl:grid-cols-2">
        {aiConfigs.map((config) => (
          <section key={config.id} className="rounded-md border p-4">
            <div className="flex items-center gap-2 font-medium"><Bot className="size-4" />{config.name || 'AI routing config'}</div>
            <Separator className="my-4" />
            {(['email_routing_model', 'fireflies_routing_model', 'transcript_split_model', 'opportunity_summary_model'] as const).map((field) => (
              <label key={field} className="mb-3 grid gap-1 text-sm">
                <span className="text-muted-foreground">{label(field)}</span>
                <select className="h-9 rounded-md border bg-background px-2" value={config[field] || ''} onChange={(event) => save(config, field, event.target.value)}>
                  {AI_MODELS.map((model) => <option key={model} value={model}>{label(model)}</option>)}
                </select>
              </label>
            ))}
          </section>
        ))}
        {!aiConfigs.length ? <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No AI model config rows found.</div> : null}
      </div>
    </ScrollArea>
  )
}

function EmailSheet({ row, retailers, opportunities, onClose, onSave }: { row: CrmEmailMessage | null; retailers: Retailer[]; opportunities: CrmOpportunity[]; onClose: () => void; onSave: (id: string, values: Partial<CrmEmailMessage>) => Promise<void> }) {
  return (
    <Sheet open={!!row} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{row?.subject || 'Email message'}</SheetTitle>
          <SheetDescription>{row?.sender}</SheetDescription>
        </SheetHeader>
        {row ? (
          <EmailSheetForm key={row.id} row={row} retailers={retailers} opportunities={opportunities} onClose={onClose} onSave={onSave} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function EmailSheetForm({ row, retailers, opportunities, onClose, onSave }: { row: CrmEmailMessage; retailers: Retailer[]; opportunities: CrmOpportunity[]; onClose: () => void; onSave: (id: string, values: Partial<CrmEmailMessage>) => Promise<void> }) {
  const [status, setStatus] = useState(row.routing_status || 'UNROUTED')
  const [retailer, setRetailer] = useState(idOf(row.retailer))
  const [opportunity, setOpportunity] = useState(idOf(row.opportunity))
  const [method, setMethod] = useState(row.routing_method || 'MANUAL')

  async function save() {
    await onSave(row.id, {
      routing_status: status,
      routing_method: method || 'MANUAL',
      retailer: retailer || null,
      opportunity: opportunity || null,
    } as Partial<CrmEmailMessage>)
    onClose()
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-md border bg-muted/25 p-3 text-sm text-muted-foreground">{row.body_preview || 'No preview available.'}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Routing status</span>
          <select className="h-9 rounded-md border bg-background px-2" value={status} onChange={(event) => setStatus(event.target.value)}>
            {ROUTING_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Method</span>
          <Input value={method} onChange={(event) => setMethod(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Company</span>
          <select className="h-9 rounded-md border bg-background px-2" value={retailer} onChange={(event) => setRetailer(event.target.value)}>
            <option value="">Unassigned</option>
            {retailers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Opportunity</span>
          <select className="h-9 rounded-md border bg-background px-2" value={opportunity} onChange={(event) => setOpportunity(event.target.value)}>
            <option value="">Unassigned</option>
            {opportunities.map((item) => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}
          </select>
        </label>
      </div>
      <Button onClick={save}><Save className="size-4" /> Save routing</Button>
    </div>
  )
}

function OpportunitySheet({ row, onClose, onSave }: { row: CrmOpportunity | null; onClose: () => void; onSave: (id: string, values: Partial<CrmOpportunity>) => Promise<void> }) {
  return (
    <Sheet open={!!row} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{row?.name || 'Opportunity'}</SheetTitle>
          <SheetDescription>{relatedName(row?.retailer)} · {label(row?.stage)}</SheetDescription>
        </SheetHeader>
        {row ? (
          <OpportunitySheetForm key={row.id} row={row} onClose={onClose} onSave={onSave} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function OpportunitySheetForm({ row, onClose, onSave }: { row: CrmOpportunity; onClose: () => void; onSave: (id: string, values: Partial<CrmOpportunity>) => Promise<void> }) {
  const [summary, setSummary] = useState(row.ai_summary || '')

  async function save() {
    await onSave(row.id, { ai_summary: summary })
    onClose()
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md border p-3"><div className="text-muted-foreground">PO</div><div>{row.production_po_number || '-'}</div></div>
        <div className="rounded-md border p-3"><div className="text-muted-foreground">SO</div><div>{row.sales_order_number || '-'}</div></div>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">AI summary</span>
        <Textarea className="min-h-40" value={summary} onChange={(event) => setSummary(event.target.value)} />
      </label>
      <Button onClick={save}><Save className="size-4" /> Save summary</Button>
    </div>
  )
}

function Grid<T extends { id: string }>({ rows, render, plain = false }: { rows: T[]; render: (row: T) => ReactNode; plain?: boolean }) {
  const content = (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.map((row) => <div key={row.id}>{render(row)}</div>)}
      {!rows.length ? <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No records found.</div> : null}
    </div>
  )
  if (plain) return content
  return <ScrollArea className="min-h-0 flex-1">{content}</ScrollArea>
}
