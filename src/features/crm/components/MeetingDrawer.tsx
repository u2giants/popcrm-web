import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { Badge } from '@/components/ui/badge'
import { formatDate, label, relatedName } from '@/features/crm/format'
import type { CrmMeetingNote } from '@/lib/types'

export function MeetingDrawer({ row, onClose }: { row: CrmMeetingNote | null; onClose: () => void }) {
  const participants = (row?.participants || '')
    .split(/[\n,;]/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || 'Meeting note'}
      subtitle={row ? formatDate(row.date) : undefined}
      status={row?.source ? <Badge variant="secondary">{label(row.source)}</Badge> : undefined}
    >
      {row ? (
        <>
          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
              <DescriptionItem term="Department">{relatedName(row.department)}</DescriptionItem>
              <DescriptionItem term="Contact">{relatedName(row.contact)}</DescriptionItem>
              <DescriptionItem term="Source">{label(row.source)}</DescriptionItem>
              {row.fireflies_transcript_id ? (
                <DescriptionItem term="Fireflies transcript" full>
                  <span className="font-mono text-xs break-all">{row.fireflies_transcript_id}</span>
                </DescriptionItem>
              ) : null}
            </DescriptionList>
          </DrawerSection>

          {participants.length ? (
            <DrawerSection title="Participants">
              <div className="flex flex-wrap gap-1.5">
                {participants.map((p) => (
                  <Badge key={p} variant="outline">
                    {p}
                  </Badge>
                ))}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection title="Summary">
            <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap text-foreground">
              {row.summary || 'No summary captured.'}
            </div>
          </DrawerSection>

          {row.action_items ? (
            <DrawerSection title="Action items">
              <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap text-foreground">
                {row.action_items}
              </div>
            </DrawerSection>
          ) : null}
        </>
      ) : null}
    </DetailDrawer>
  )
}
