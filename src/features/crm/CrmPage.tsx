import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarDays,
  Contact,
  Inbox,
  LayoutDashboard,
  MailWarning,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  OPPORTUNITY_STAGES,
  fetchBuyers,
  fetchEmailMessages,
  fetchMeetingNotes,
  fetchOpportunities,
  fetchRetailers,
  label,
  relatedName,
  setOpportunityStage,
} from './api'
import type { Buyer, CrmEmailMessage, CrmMeetingNote, CrmOpportunity, Retailer } from '@/lib/types'

type Tab = 'pipeline' | 'companies' | 'contacts' | 'email' | 'meetings'

function statLabel(count: number, noun: string) {
  return `${count.toLocaleString()} ${noun}`
}

function textOf(...values: unknown[]) {
  return values.filter(Boolean).join(' ').toLowerCase()
}

export function CrmPage() {
  const [tab, setTab] = useState<Tab>('pipeline')
  const [query, setQuery] = useState('')
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [emails, setEmails] = useState<CrmEmailMessage[]>([])
  const [meetings, setMeetings] = useState<CrmMeetingNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [opps, companies, contacts, messages, notes] = await Promise.all([
        fetchOpportunities(),
        fetchRetailers(),
        fetchBuyers(),
        fetchEmailMessages(),
        fetchMeetingNotes(),
      ])
      if (!active) return
      setOpportunities(opps)
      setRetailers(companies)
      setBuyers(contacts)
      setEmails(messages)
      setMeetings(notes)
      setLoading(false)
    }
    load().catch(() => setLoading(false))
    return () => { active = false }
  }, [])

  const q = query.trim().toLowerCase()
  const unrouted = emails.filter((email) => email.routing_status && email.routing_status !== 'ROUTED' && email.routing_status !== 'SKIPPED')

  const filteredRetailers = useMemo(() => retailers.filter((row) => !q || textOf(row.name, row.domain, row.customer_status, row.chain_type).includes(q)), [q, retailers])
  const filteredBuyers = useMemo(() => buyers.filter((row) => !q || textOf(row.name, row.email, row.contact_type, relatedName(row.retailer), relatedName(row.department)).includes(q)), [q, buyers])
  const filteredEmails = useMemo(() => emails.filter((row) => !q || textOf(row.subject, row.sender, row.routing_status, relatedName(row.retailer), relatedName(row.department)).includes(q)), [q, emails])
  const filteredMeetings = useMemo(() => meetings.filter((row) => !q || textOf(row.name, row.participants, row.summary, relatedName(row.retailer), relatedName(row.department)).includes(q)), [q, meetings])

  async function moveOpportunity(id: string, stage: string) {
    const prior = opportunities
    setOpportunities((rows) => rows.map((row) => row.id === id ? { ...row, stage } : row))
    try {
      await setOpportunityStage(id, stage)
    } catch {
      setOpportunities(prior)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <section className="border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={tab === 'pipeline' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('pipeline')}>
            <LayoutDashboard className="size-4" />
            Pipeline
          </Button>
          <Button variant={tab === 'companies' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('companies')}>
            <Building2 className="size-4" />
            Companies
          </Button>
          <Button variant={tab === 'contacts' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('contacts')}>
            <Contact className="size-4" />
            Contacts
          </Button>
          <Button variant={tab === 'email' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('email')}>
            <Inbox className="size-4" />
            Email
          </Button>
          <Button variant={tab === 'meetings' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('meetings')}>
            <CalendarDays className="size-4" />
            Meetings
          </Button>
          <div className="ml-auto flex min-w-64 items-center gap-2 rounded-md border bg-card px-2">
            <Search className="size-4 text-muted-foreground" />
            <Input className="h-8 border-0 px-0 shadow-none focus-visible:ring-0" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search CRM" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{statLabel(retailers.length, 'companies')}</Badge>
          <Badge variant="outline">{statLabel(buyers.length, 'contacts')}</Badge>
          <Badge variant="outline">{statLabel(emails.length, 'emails loaded')}</Badge>
          <Badge variant={unrouted.length ? 'destructive' : 'outline'}>{statLabel(unrouted.length, 'needs routing')}</Badge>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading CRM…</div>
      ) : (
        <>
          {tab === 'pipeline' && <Pipeline opportunities={opportunities} onMove={moveOpportunity} />}
          {tab === 'companies' && <CompanyList rows={filteredRetailers} />}
          {tab === 'contacts' && <ContactList rows={filteredBuyers} />}
          {tab === 'email' && <EmailList rows={filteredEmails} />}
          {tab === 'meetings' && <MeetingList rows={filteredMeetings} />}
        </>
      )}
    </div>
  )
}

function Pipeline({ opportunities, onMove }: { opportunities: CrmOpportunity[]; onMove: (id: string, stage: string) => void }) {
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
                  <div className="line-clamp-2 text-sm font-medium">{opp.name || 'Untitled program'}</div>
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

function EmailList({ rows }: { rows: CrmEmailMessage[] }) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="divide-y">
        {rows.map((row) => (
          <article key={row.id} className="grid gap-3 px-4 py-3 md:grid-cols-[180px_1fr_180px_160px]">
            <div className="text-sm text-muted-foreground">{row.received_at || '—'}</div>
            <div>
              <div className="font-medium">{row.subject || '(no subject)'}</div>
              <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">{row.body_preview}</div>
            </div>
            <div className="text-sm">{relatedName(row.retailer)}</div>
            <div className="flex items-start gap-2">
              {row.routing_status !== 'ROUTED' && row.routing_status !== 'SKIPPED' ? <MailWarning className="mt-0.5 size-4 text-destructive" /> : null}
              <Badge variant={row.routing_status === 'ROUTED' ? 'secondary' : row.routing_status === 'SKIPPED' ? 'outline' : 'destructive'}>{label(row.routing_status)}</Badge>
            </div>
          </article>
        ))}
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

function Grid<T extends { id: string }>({ rows, render }: { rows: T[]; render: (row: T) => ReactNode }) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rows.map((row) => <div key={row.id}>{render(row)}</div>)}
      </div>
    </ScrollArea>
  )
}
