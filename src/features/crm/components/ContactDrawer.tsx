import { useMemo } from 'react'
import { Mail } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { idOf, label, relatedName, formatDate } from '@/features/crm/format'
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
      subtitle={row?.job_title ?? undefined}
      status={
        row?.contact_type ? (
          <StatusBadge tone="info" dot={false}>{label(row.contact_type)}</StatusBadge>
        ) : undefined
      }
      footer={
        row?.email ? (
          <Button asChild>
            <a href={`mailto:${row.email}`} target="_blank" rel="noreferrer">
              <Mail className="size-4" /> Compose
            </a>
          </Button>
        ) : undefined
      }
    >
      {row ? (
        <>
          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Email">
                {row.email ? (
                  <a href={`mailto:${row.email}`} className="text-primary hover:underline">
                    {row.email}
                  </a>
                ) : '—'}
              </DescriptionItem>
              <DescriptionItem term="Phone">{row.phone || '—'}</DescriptionItem>
              <DescriptionItem term="Title">{row.job_title || '—'}</DescriptionItem>
              <DescriptionItem term="Type">{label(row.contact_type)}</DescriptionItem>
              <DescriptionItem term="Scope">{label(row.scope)}</DescriptionItem>
              <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
              <DescriptionItem term="Department">{relatedName(row.department)}</DescriptionItem>
            </DescriptionList>
          </DrawerSection>

          <DrawerSection title="Recent email">
            {related.emails.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.emails.map((e) => (
                  <li key={e.id} className="px-[11px] py-[8px]">
                    <div className="truncate text-[12.5px] font-[500] text-foreground">
                      {e.subject || '(no subject)'}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {relatedName(e.retailer)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No email from this address.</p>
            )}
          </DrawerSection>

          <DrawerSection title="Meetings">
            {related.meetings.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.meetings.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-[11px] py-[8px]">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-[500] text-foreground">
                        {m.name || 'Meeting'}
                      </div>
                      {m.participants ? (
                        <div className="truncate text-[11px] text-muted-foreground">{m.participants}</div>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(m.date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No meetings linked.</p>
            )}
          </DrawerSection>
        </>
      ) : null}
    </DetailDrawer>
  )
}
