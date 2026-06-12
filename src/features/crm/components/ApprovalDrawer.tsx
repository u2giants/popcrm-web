import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { updateApprovalThread } from '@/features/crm/api'
import { formatDate, relatedName } from '@/features/crm/format'
import type { CrmLicensorApprovalThread } from '@/lib/types'

export function ApprovalDrawer({
  row,
  onClose,
}: {
  row: CrmLicensorApprovalThread | null
  onClose: () => void
}) {
  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || row?.property_name || 'Approval'}
      subtitle={row ? relatedName(row.opportunity) : undefined}
      status={row ? <CrmStatusBadge kind="approval" status={row.stage} /> : undefined}
    >
      {row ? <ApprovalDrawerForm key={row.id} row={row} /> : null}
    </DetailDrawer>
  )
}

function ApprovalDrawerForm({ row }: { row: CrmLicensorApprovalThread }) {
  const { setApprovals } = useCrmData()
  const [stage, setStage] = useState(row.stage || '')
  const [saving, setSaving] = useState(false)

  const dirty = stage !== (row.stage || '')

  async function saveStage() {
    setSaving(true)
    const prev = row.stage
    setApprovals((rows) => rows.map((a) => (a.id === row.id ? { ...a, stage } : a)))
    try {
      await updateApprovalThread(row.id, { stage })
      toast.success('Approval updated')
    } catch {
      setApprovals((rows) => rows.map((a) => (a.id === row.id ? { ...a, stage: prev } : a)))
      setStage(prev || '')
      toast.error('Could not update approval')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DrawerSection title="Stage">
        <div className="flex items-end gap-2">
          <div className="grid flex-1 gap-1.5">
            <Label className="sr-only">Stage</Label>
            <Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="e.g. Submitted, Approved…" />
          </div>
          <Button onClick={saveStage} disabled={saving || !dirty}>
            <Save className="size-4" /> Save
          </Button>
        </div>
      </DrawerSection>

      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="Property">{row.property_name || '—'}</DescriptionItem>
          <DescriptionItem term="Opportunity">{relatedName(row.opportunity)}</DescriptionItem>
          <DescriptionItem term="Submitted">{formatDate(row.submitted_date)}</DescriptionItem>
          <DescriptionItem term="Response">{formatDate(row.response_date)}</DescriptionItem>
          <DescriptionItem term="Due">{formatDate(row.due_date)}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      <DrawerSection title="Licensor comments">
        <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap text-foreground">
          {row.licensor_comments || 'No comments yet.'}
        </div>
      </DrawerSection>
    </>
  )
}
