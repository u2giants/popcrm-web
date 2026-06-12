import { CheckSquare, ExternalLink, Mic, Square, Users } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { NameAvatar } from '@/components/app/NameAvatar'
import { StatusBadge } from '@/components/app/StatusBadge'
import { formatDate, label, relatedName } from '@/features/crm/format'
import type { CrmMeetingNote } from '@/lib/types'

function parseChecklist(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-\*•‣◦]+/, '').trim())
    .filter(Boolean)
}

export function MeetingDrawer({ row, onClose }: { row: CrmMeetingNote | null; onClose: () => void }) {
  const participants = (row?.participants || '')
    .split(/[\n,;]/)
    .map((p) => p.trim())
    .filter(Boolean)

  const actionLines = row?.action_items ? parseChecklist(row.action_items) : []

  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || 'Meeting note'}
      subtitle={row ? formatDate(row.date) : undefined}
      status={
        row?.source ? (
          <StatusBadge tone="info" dot={false}>
            {label(row.source)}
          </StatusBadge>
        ) : undefined
      }
    >
      {row ? (
        <>
          {/* Core metadata */}
          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
              <DescriptionItem term="Department">{relatedName(row.department)}</DescriptionItem>
              <DescriptionItem term="Contact">{relatedName(row.contact)}</DescriptionItem>
            </DescriptionList>
          </DrawerSection>

          {/* Participants */}
          {participants.length ? (
            <DrawerSection title="Participants" icon={<Users className="size-[14px]" />}>
              <div className="flex flex-wrap gap-[7px]">
                {participants.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-[6px] rounded-full border bg-muted/40 py-[3px] pl-[4px] pr-[9px]"
                  >
                    <NameAvatar name={p} size={18} />
                    <span className="text-[11.5px] font-[500] text-foreground">{p}</span>
                  </div>
                ))}
              </div>
            </DrawerSection>
          ) : null}

          {/* Fireflies transcript */}
          {row.fireflies_transcript_id ? (
            <DrawerSection title="Fireflies" icon={<Mic className="size-[14px]" />}>
              <div className="flex items-center gap-[8px] rounded-[8px] border bg-muted/30 px-[11px] py-[9px]">
                <span
                  className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px]"
                  style={{
                    background: 'color-mix(in oklch, oklch(0.62 0.18 300) 14%, transparent)',
                    color: 'oklch(0.62 0.18 300)',
                  }}
                >
                  <Mic className="size-[13px]" />
                </span>
                <span className="min-w-0 flex-1 font-mono text-[11px] text-muted-foreground break-all">
                  {row.fireflies_transcript_id}
                </span>
                <ExternalLink className="size-[13px] shrink-0 text-muted-foreground" />
              </div>
            </DrawerSection>
          ) : null}

          {/* Summary */}
          <DrawerSection title="Summary">
            <div className="rounded-[8px] border bg-muted/20 px-[12px] py-[10px] text-[12.5px] leading-[1.65] text-foreground whitespace-pre-wrap">
              {row.summary || <span className="text-muted-foreground">No summary captured.</span>}
            </div>
          </DrawerSection>

          {/* Action items */}
          {actionLines.length ? (
            <DrawerSection title="Action items">
              <ul className="space-y-[7px]">
                {actionLines.map((item, i) => (
                  <li key={i} className="flex items-start gap-[8px]">
                    <span className="mt-[1px] shrink-0 text-muted-foreground">
                      {item.toLowerCase().startsWith('done') || item.startsWith('✓') ? (
                        <CheckSquare className="size-[14px] text-[oklch(0.60_0.15_165)]" />
                      ) : (
                        <Square className="size-[14px]" />
                      )}
                    </span>
                    <span className="text-[12.5px] text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </DrawerSection>
          ) : null}
        </>
      ) : null}
    </DetailDrawer>
  )
}
