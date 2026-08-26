import { useMemo, useState } from 'react'
import { Building2, Check, Mail, Pencil, Route, X } from 'lucide-react'
import { toast } from 'sonner'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { StatusBadge } from '@/components/app/StatusBadge'
import { NameAvatar } from '@/components/app/NameAvatar'
import { CustomerLogo } from '@/components/app/CustomerLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  listData,
  useDepartmentsQuery,
  useEmailsQuery,
  useIngestedContactsQuery,
  useOpportunitiesQuery,
  useUpdateCustomerMutation,
} from '@/features/crm/queries'
import { isDomainShape, normalizeDomainInput, suggestDomainFromEmails } from '@/features/crm/domainSuggestion'
import { logError } from '@/lib/errors'
import { ChainBadge, StageBadge } from '@/features/crm/components/CrmStatusBadge'
import { CustomerLogoField } from '@/features/crm/components/CustomerLogoField'
import { customerStatusLabel, customerStatusTone } from '@/features/crm/constants'
import { effectiveCustomerStatus } from '@/features/crm/pages/_shared'
import { customerLabel, idOf } from '@/features/crm/format'
import type { Retailer } from '@/lib/types'

function fmtAmount(val: string | number | null | undefined): string {
  if (val == null || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

export function CustomerDrawer({ row, onClose }: { row: Retailer | null; onClose: () => void }) {
  const buyers = listData(useIngestedContactsQuery(-1).data)
  const departments = listData(useDepartmentsQuery(-1).data)
  const opportunities = listData(useOpportunitiesQuery(-1).data)
  const emails = listData(useEmailsQuery(-1).data)

  const related = useMemo(() => {
    if (!row) return { contacts: [], depts: [], opps: [], recentEmails: [], suggestedDomain: null }
    const contacts = buyers.filter((b) => idOf(b.retailer) === row.id)
    return {
      contacts,
      suggestedDomain: suggestDomainFromEmails(contacts.map((c) => c.email)),
      depts: departments.filter((d) => idOf(d.retailer) === row.id),
      opps: opportunities.filter((o) => idOf(o.retailer) === row.id),
      recentEmails: emails.filter((e) => idOf(e.retailer) === row.id).slice(0, 6),
    }
  }, [row, buyers, departments, opportunities, emails])

  const aliases = (row?.routing_aliases || '')
    .split(/[\n,]/)
    .map((a) => a.trim())
    .filter(Boolean)

  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row ? customerLabel(row) : 'Customer'}
      subtitle={row?.domain ?? undefined}
      avatar={row ? <CustomerLogo name={customerLabel(row)} domain={row.domain} logoUrl={row.logo_url} size={36} /> : undefined}
      status={
        row ? (
          <>
            <StatusBadge tone={customerStatusTone(effectiveCustomerStatus(row))} dot>
              {customerStatusLabel(effectiveCustomerStatus(row))}
            </StatusBadge>
            {row.chain_type ? <ChainBadge chain={row.chain_type} /> : null}
          </>
        ) : undefined
      }
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="size-[13px]" /> Close
        </Button>
      }
    >
      {row ? (
        <>
          {/* Mini stat cards */}
          <DrawerSection>
            <div className="grid grid-cols-2 gap-[10px]">
              <StatCard
                icon={<Building2 className="size-[14px]" />}
                iconColor="oklch(0.62 0.15 165)"
                label="Contacts"
                value={related.contacts.length}
              />
              <StatCard
                icon={<Route className="size-[14px]" />}
                iconColor="oklch(0.62 0.17 300)"
                label="Programs"
                value={related.opps.length}
              />
            </div>
          </DrawerSection>

          {/* Core details */}
          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Name">
                <CustomerNameField
                  key={row.id}
                  customerId={row.id}
                  name={customerLabel(row)}
                />
              </DescriptionItem>
              <DescriptionItem term="Status">
                <StatusBadge tone={customerStatusTone(effectiveCustomerStatus(row))} dot>
                  {customerStatusLabel(effectiveCustomerStatus(row))}
                </StatusBadge>
              </DescriptionItem>
              <DescriptionItem term="Chain type">
                {row.chain_type ? <ChainBadge chain={row.chain_type} /> : '—'}
              </DescriptionItem>
              <DescriptionItem term="Domain">
                <DomainField
                  key={row.id}
                  customerId={row.id}
                  domain={row.domain}
                  suggestion={related.suggestedDomain}
                />
              </DescriptionItem>
            </DescriptionList>
          </DrawerSection>

          {/* Brand logo */}
          <DrawerSection title="Logo">
            <CustomerLogoField key={row.id} customer={row} />
          </DrawerSection>

          {/* Routing aliases */}
          <DrawerSection title="Routing aliases">
            <RoutingAliasesField key={row.id} customerId={row.id} aliases={aliases} />
          </DrawerSection>

          {/* Contacts list with avatars */}
          <DrawerSection title={`Contacts (${related.contacts.length})`}>
            {related.contacts.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.contacts.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex items-center gap-[9px] px-[11px] py-[8px]">
                    <NameAvatar name={c.last_name || c.name} size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-[500] text-foreground">{c.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{c.email || c.job_title || '—'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No contacts yet.</p>
            )}
          </DrawerSection>

          {/* Programs list with stage chips + amount */}
          <DrawerSection title={`Programs (${related.opps.length})`}>
            {related.opps.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.opps.slice(0, 8).map((o) => (
                  <li key={o.id} className="flex items-center gap-[8px] px-[11px] py-[8px]">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-[500] text-foreground">
                        {o.name || 'Untitled program'}
                      </div>
                      {o.season_year ? (
                        <div className="text-[11px] text-muted-foreground">{o.season_year}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-[6px]">
                      {o.amount ? (
                        <span className="text-[11.5px] font-[650] tabular-nums text-foreground">
                          {fmtAmount(o.amount)}
                        </span>
                      ) : null}
                      <StageBadge stage={o.stage} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No opportunities yet.</p>
            )}
          </DrawerSection>

          {/* Recent email */}
          {related.recentEmails.length ? (
            <DrawerSection title="Recent email">
              <ul className="divide-y rounded-[8px] border">
                {related.recentEmails.map((e) => (
                  <li key={e.id} className="flex items-center gap-[9px] px-[11px] py-[8px]">
                    <Mail className="size-[13px] shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-[500] text-foreground">
                        {e.subject || '(no subject)'}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">{e.sender}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </DrawerSection>
          ) : null}

          {/* Departments */}
          {related.depts.length ? (
            <DrawerSection title={`Departments (${related.depts.length})`}>
              <div className="flex flex-wrap gap-[6px]">
                {related.depts.map((d) => (
                  <span key={d.id} className="rounded-full bg-muted px-[8px] py-[3px] text-[11.5px] text-muted-foreground">
                    {d.name}
                  </span>
                ))}
              </div>
            </DrawerSection>
          ) : null}
        </>
      ) : null}
    </DetailDrawer>
  )
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-[10px] rounded-[9px] border bg-muted/30 px-[12px] py-[10px]">
      <span
        className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px]"
        style={{
          background: `color-mix(in oklch, ${iconColor} 15%, transparent)`,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <div>
        <div className="text-[18px] font-[700] tabular-nums leading-none text-foreground">{value}</div>
        <div className="mt-[2px] text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

export function CustomerNameField({ customerId, name }: { customerId: string; name: string }) {
  const updateCustomer = useUpdateCustomerMutation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  async function save() {
    const next = draft.trim()
    if (!next) {
      toast.error('Customer name cannot be blank')
      return
    }
    if (next === name) {
      setEditing(false)
      return
    }
    try {
      await updateCustomer.mutateAsync({ id: customerId, values: { display_name: next } })
      setEditing(false)
      toast.success(`Customer renamed to ${next}`)
    } catch (error) {
      toast.error('Could not rename the customer', { description: logError('CustomerNameField.save', error) })
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-[6px]">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save()
            if (e.key === 'Escape') setEditing(false)
          }}
          aria-label="Customer name"
          className="h-[26px] w-[210px] text-[12px]"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-[26px]"
          disabled={!draft.trim() || updateCustomer.isPending}
          onClick={() => void save()}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-[26px]" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-[6px]">
      <span>{name}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-[22px] px-[6px] text-[11px] text-muted-foreground"
        onClick={() => {
          setDraft(name)
          setEditing(true)
        }}
      >
        <Pencil className="size-[11px]" /> Rename
      </Button>
    </div>
  )
}

/**
 * Curated Customer domain: shown read-only, editable in place, with a
 * suggestion taken from this customer's own contact addresses. Nothing is
 * written until a human presses Save or accepts the suggestion.
 */
function DomainField({
  customerId,
  domain,
  suggestion,
}: {
  customerId: string
  domain: string | null
  suggestion: string | null
}) {
  const updateCustomer = useUpdateCustomerMutation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  async function save(value: string) {
    const next = normalizeDomainInput(value)
    if (next && !isDomainShape(next)) {
      toast.error(`"${value.trim()}" is not a domain`, { description: 'Use a form like example.com.' })
      return
    }
    if (next === (domain ?? '')) {
      setEditing(false)
      return
    }
    try {
      await updateCustomer.mutateAsync({ id: customerId, values: { domain: next } })
      setEditing(false)
      toast.success(next ? `Domain set to ${next}` : 'Domain cleared')
    } catch (error) {
      toast.error('Could not save the domain', { description: logError('DomainField.save', error) })
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-[6px]">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save(draft)
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="example.com"
          aria-label="Customer domain"
          className="h-[26px] w-[180px] font-mono text-[11.5px]"
        />
        <Button size="sm" variant="outline" className="h-[26px]" disabled={updateCustomer.isPending} onClick={() => void save(draft)}>
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-[26px]" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-[6px]">
      {domain ? <span className="font-mono text-[11.5px]">{domain}</span> : <span>—</span>}
      <Button
        size="sm"
        variant="ghost"
        className="h-[22px] px-[6px] text-[11px] text-muted-foreground"
        onClick={() => {
          setDraft(domain ?? '')
          setEditing(true)
        }}
      >
        <Pencil className="size-[11px]" /> Edit
      </Button>
      {!domain && suggestion ? (
        <Button
          size="sm"
          variant="outline"
          className="h-[22px] px-[7px] text-[11px]"
          disabled={updateCustomer.isPending}
          onClick={() => void save(suggestion)}
          title="Taken from this customer's contact email addresses"
        >
          <Check className="size-[11px]" /> Use {suggestion}
        </Button>
      ) : null}
    </div>
  )
}

/**
 * Routing aliases are the second half of how email finds a customer. A domain
 * alias (anything containing a dot or @) is matched against sender/recipient
 * domains alongside the Domain field, so a second domain can be consolidated
 * onto one customer record without merging anything. A plain word is matched
 * against email subjects instead.
 */
function RoutingAliasesField({ customerId, aliases }: { customerId: string; aliases: string[] }) {
  const updateCustomer = useUpdateCustomerMutation()
  const [draft, setDraft] = useState('')

  async function write(next: string[], done: string) {
    try {
      await updateCustomer.mutateAsync({ id: customerId, values: { routing_aliases: next.join(', ') } })
      setDraft('')
      toast.success(done)
    } catch (error) {
      toast.error('Could not save routing aliases', { description: logError('RoutingAliasesField.write', error) })
    }
  }

  function add() {
    const raw = draft.trim()
    if (!raw) return
    // A domain-ish alias gets the same cleanup as the Domain box; a subject word is kept as typed.
    const value = /[@.]/.test(raw) ? normalizeDomainInput(raw) : raw
    if (!value) return
    if (aliases.some((a) => a.toLowerCase() === value.toLowerCase())) {
      toast.error(`"${value}" is already a routing alias`)
      return
    }
    void write([...aliases, value], `Routing alias ${value} added`)
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {aliases.length ? (
        <div className="flex flex-wrap gap-[6px]">
          {aliases.map((a) => (
            <span
              key={a}
              className="flex items-center gap-[5px] rounded-[5px] border bg-muted/50 py-[2px] pl-[7px] pr-[3px] font-mono text-[11px] text-muted-foreground"
            >
              {a}
              <button
                type="button"
                aria-label={`Remove routing alias ${a}`}
                className="rounded-[3px] p-[2px] hover:bg-accent hover:text-foreground"
                disabled={updateCustomer.isPending}
                onClick={() => void write(aliases.filter((x) => x !== a), `Routing alias ${a} removed`)}
              >
                <X className="size-[10px]" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          No aliases. Add another domain here to route its email to this customer too.
        </p>
      )}
      <div className="flex items-center gap-[6px]">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
            if (e.key === 'Escape') setDraft('')
          }}
          placeholder="another-domain.com or a subject word"
          aria-label="Add routing alias"
          className="h-[26px] flex-1 font-mono text-[11.5px]"
        />
        <Button size="sm" variant="outline" className="h-[26px]" disabled={!draft.trim() || updateCustomer.isPending} onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}
