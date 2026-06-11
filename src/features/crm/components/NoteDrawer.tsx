import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { updateNote } from '@/features/crm/api'
import { label, relatedName } from '@/features/crm/format'
import type { CrmNote } from '@/lib/types'

export function NoteDrawer({ row, onClose }: { row: CrmNote | null; onClose: () => void }) {
  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.title || 'Note'}
      subtitle={row ? relatedName(row.opportunity) : undefined}
      status={row?.source ? <Badge variant="secondary">{label(row.source)}</Badge> : undefined}
    >
      {row ? <NoteDrawerForm key={row.id} row={row} onClose={onClose} /> : null}
    </DetailDrawer>
  )
}

function NoteDrawerForm({ row, onClose }: { row: CrmNote; onClose: () => void }) {
  const { setNotes } = useCrmData()
  const [title, setTitle] = useState(row.title || '')
  const [body, setBody] = useState(row.body || '')
  const [saving, setSaving] = useState(false)

  const dirty = title !== (row.title || '') || body !== (row.body || '')

  async function save() {
    setSaving(true)
    const values = { title: title.trim() || 'CRM note', body }
    try {
      await updateNote(row.id, values)
      setNotes((rows) => rows.map((n) => (n.id === row.id ? { ...n, ...values } : n)))
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
        <div className="grid gap-3">
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

      {row.action_items ? (
        <DrawerSection title="Action items">
          <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap text-foreground">
            {row.action_items}
          </div>
        </DrawerSection>
      ) : null}

      <DrawerSection>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || !dirty}>
            <Save className="size-4" /> {saving ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      </DrawerSection>
    </>
  )
}
