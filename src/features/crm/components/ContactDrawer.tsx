import { useMemo } from 'react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { Badge } from '@/components/ui/badge'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { idOf, label, relatedName } from '@/features/crm/format'
import type { Buyer } from '@/lib/types'

export function ContactDrawer({ row, onClose }: { row: Buyer | null; onClose: () => void }) {
  const { emails, meetings } = useCrmData()

  const related = useMemo(() => {
    if (!row) return { emails: [], meetings: [] }
    return {
      emails: emails.filter((e) => (e.sender || '').toLowerCase() === (row.email || '\0').toLowerCase()).slice(0, 6),
      meetings: meetings.filter((m) => idOf(m.contact) === row.id).slice(0, 6),
    }
  }, [row, emails, meetings])

  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || 'Contact'}
      subtitle={row?.email ?? undefined}
      status={row?.contact_type ? <Badge variant="secondary">{label(row.contact_type)}</Badge> : undefined}
    >
      {row ? (
        <>
          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Email">{row.email || '—'}</DescriptionItem>
              <DescriptionItem term="Phone">{row.phone || '—'}</DescriptionItem>
              <DescriptionItem term="Job title">{row.job_title || '—'}</DescriptionItem>
              <DescriptionItem term="Scope">{label(row.scope)}</DescriptionItem>
              <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
              <DescriptionItem term="Department">{relatedName(row.department)}</DescriptionItem>
            </DescriptionList>
          </DrawerSection>

          <DrawerSection title="Recent email">
            {related.emails.length ? (
              <ul className="divide-y rounded-md border">
                {related.emails.map((e) => (
                  <li key={e.id} className="px-3 py-2 text-sm">
                    <div className="truncate font-medium">{e.subject || '(no subject)'}</div>
                    <div className="truncate text-xs text-muted-foreground">{relatedName(e.retailer)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No email from this address.</p>
            )}
          </DrawerSection>

          <DrawerSection title="Meetings">
            {related.meetings.length ? (
              <ul className="divide-y rounded-md border">
                {related.meetings.map((m) => (
                  <li key={m.id} className="px-3 py-2 text-sm">
                    <div className="truncate font-medium">{m.name || 'Meeting'}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.date || '—'}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No meetings linked.</p>
            )}
          </DrawerSection>
        </>
      ) : null}
    </DetailDrawer>
  )
}
