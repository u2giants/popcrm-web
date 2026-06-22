import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Square } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateNoteMutation } from '@/features/crm/queries'
import { label, relatedName } from '@/features/crm/format'
import type { CrmNote } from '@/lib/types'

function parseChecklist(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-*•‣◦]+/, '').trim())
    .filter(Boolean)
}

export function NoteDrawer({ row, onClose }: { row: CrmNote | null; onClose: () => void }) {
  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.title || 'Note'}
      subtitle={row ? relatedName(row.opportunity) : undefined}
      status={
        row?.source ? (
          <StatusBadge tone="neutral" dot={false}>
            {label(row.source)}
          </StatusBadge>
        ) : undefined
      }
    >
      {row ? <NoteDrawerForm key={row.id} row={row} onClose={onClose} /> : null}
    </DetailDrawer>
  )
}

function NoteDrawerForm({ row, onClose }: { row: CrmNote; onClose: () => void }) {
  const updateNoteMutation = useUpdateNoteMutation()
  const [title, setTitle] = useState(row.title || '')
  const [body, setBody] = useState(row.body || '')
  const [saving, setSaving] = useState(false)

  const dirty = title !== (row.title || '') || body !== (row.body || '')
  const actionLines = row.action_items ? parseChecklist(row.action_items) : []

  async function save() {
    setSaving(true)
    const values = { title: title.trim() || 'CRM note', body }
    try {
      await updateNoteMutation.mutateAsync({ id: row.id, values })
      toast.success('Note saved')
      onClose()
    } catch {
      toast.error('Could not save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DrawerSection title="Note">
        <div className="grid gap-[12px]">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Body</Label>
            <Textarea className="min-h-40" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
      </DrawerSection>

      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
          <DescriptionItem term="Contact">{relatedName(row.contact)}</DescriptionItem>
          <DescriptionItem term="Opportunity">{relatedName(row.opportunity)}</DescriptionItem>
          <DescriptionItem term="Source">{label(row.source)}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      {actionLines.length ? (
        <DrawerSection title="Action items">
          <ul className="space-y-[7px]">
            {actionLines.map((item, i) => (
              <li key={i} className="flex items-start gap-[8px]">
                <Square className="mt-[1px] size-[13px] shrink-0 text-muted-foreground" />
                <span className="text-[12.5px] text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>
      ) : null}

      <DrawerSection>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || !dirty}>
            <Save className="size-[13px]" /> {saving ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      </DrawerSection>
    </>
  )
}
