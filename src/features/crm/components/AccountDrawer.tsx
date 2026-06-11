import { useMemo } from 'react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { idOf, label, relatedName } from '@/features/crm/format'
import type { Retailer } from '@/lib/types'

export function AccountDrawer({ row, onClose }: { row: Retailer | null; onClose: () => void }) {
  const { buyers, departments, opportunities, emails } = useCrmData()

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
      status={row ? <StatusBadge tone="info">{label(row.customer_status)}</StatusBadge> : undefined}
    >
      {row ? (
        <>
          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Customer status">{label(row.customer_status)}</DescriptionItem>
              <DescriptionItem term="Chain type">{label(row.chain_type)}</DescriptionItem>
              <DescriptionItem term="Domain">{row.domain || '—'}</DescriptionItem>
              <DescriptionItem term="Contacts">{related.contacts.length}</DescriptionItem>
            </DescriptionList>
          </DrawerSection>

          {aliases.length ? (
            <DrawerSection title="Routing aliases">
              <div className="flex flex-wrap gap-1.5">
                {aliases.map((a) => (
                  <Badge key={a} variant="outline" className="font-mono text-xs">
                    {a}
                  </Badge>
                ))}
              </div>
            </DrawerSection>
          ) : null}

          {related.depts.length ? (
            <DrawerSection title={`Departments (${related.depts.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {related.depts.map((d) => (
                  <Badge key={d.id} variant="secondary">
                    {d.name}
                  </Badge>
                ))}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection title={`Opportunities (${related.opps.length})`}>
            {related.opps.length ? (
              <ul className="divide-y rounded-md border">
                {related.opps.slice(0, 8).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="truncate">{o.name || 'Untitled program'}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{label(o.stage)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No opportunities yet.</p>
            )}
          </DrawerSection>

          <DrawerSection title={`Contacts (${related.contacts.length})`}>
            {related.contacts.length ? (
              <ul className="divide-y rounded-md border">
                {related.contacts.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 truncate text-xs text-muted-foreground">{c.email || '—'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No contacts yet.</p>
            )}
          </DrawerSection>

          <DrawerSection title="Recent email">
            {related.recentEmails.length ? (
              <ul className="divide-y rounded-md border">
                {related.recentEmails.map((e) => (
                  <li key={e.id} className="px-3 py-2 text-sm">
                    <div className="truncate font-medium">{e.subject || '(no subject)'}</div>
                    <div className="truncate text-xs text-muted-foreground">{relatedName(e.opportunity)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent email.</p>
            )}
          </DrawerSection>
        </>
      ) : null}
    </DetailDrawer>
  )
}
