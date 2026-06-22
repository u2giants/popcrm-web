import { useMemo } from 'react'
import { Building2, Mail, Route, X } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { StatusBadge } from '@/components/app/StatusBadge'
import { NameAvatar } from '@/components/app/NameAvatar'
import { AccountLogo } from '@/components/app/AccountLogo'
import { Button } from '@/components/ui/button'
import { listData, useDepartmentsQuery, useEmailsQuery, useIngestedContactsQuery, useOpportunitiesQuery } from '@/features/crm/queries'
import { ChainBadge, StageBadge } from '@/features/crm/components/CrmStatusBadge'
import { customerStatusLabel, customerStatusTone } from '@/features/crm/constants'
import { idOf } from '@/features/crm/format'
import type { Retailer } from '@/lib/types'

function fmtAmount(val: string | number | null | undefined): string {
  if (val == null || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

export function AccountDrawer({ row, onClose }: { row: Retailer | null; onClose: () => void }) {
  const buyers = listData(useIngestedContactsQuery(-1).data)
  const departments = listData(useDepartmentsQuery(-1).data)
  const opportunities = listData(useOpportunitiesQuery(-1).data)
  const emails = listData(useEmailsQuery(-1).data)

  const related = useMemo(() => {
    if (!row) return { contacts: [], depts: [], opps: [], recentEmails: [] }
    return {
      contacts: buyers.filter((b) => idOf(b.retailer) === row.id),
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
      title={row?.name || 'Account'}
      subtitle={row?.domain ?? undefined}
      avatar={row ? <AccountLogo name={row.name} domain={row.domain} size={36} /> : undefined}
      status={
        row ? (
          <>
            <StatusBadge tone={customerStatusTone(row.customer_status)} dot>
              {customerStatusLabel(row.customer_status)}
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
              <DescriptionItem term="Status">
                <StatusBadge tone={customerStatusTone(row.customer_status)} dot>
                  {customerStatusLabel(row.customer_status)}
                </StatusBadge>
              </DescriptionItem>
              <DescriptionItem term="Chain type">
                {row.chain_type ? <ChainBadge chain={row.chain_type} /> : '—'}
              </DescriptionItem>
              <DescriptionItem term="Domain">
                {row.domain ? (
                  <span className="font-mono text-[11.5px]">{row.domain}</span>
                ) : '—'}
              </DescriptionItem>
            </DescriptionList>
          </DrawerSection>

          {/* Routing aliases */}
          {aliases.length ? (
            <DrawerSection title="Routing aliases">
              <div className="flex flex-wrap gap-[6px]">
                {aliases.map((a) => (
                  <span key={a} className="rounded-[5px] border bg-muted/50 px-[7px] py-[2px] font-mono text-[11px] text-muted-foreground">
                    {a}
                  </span>
                ))}
              </div>
            </DrawerSection>
          ) : null}

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
