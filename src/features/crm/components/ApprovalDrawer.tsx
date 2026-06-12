import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { updateApprovalThread } from '@/features/crm/api'
import { approvalTone } from '@/features/crm/constants'
import { formatDate, relatedName } from '@/features/crm/format'
import type { CrmLicensorApprovalThread } from '@/lib/types'

const APPROVAL_STAGES = [
  'Pending',
  'Submitted',
  'In Review',
  'Revisions Requested',
  'On Hold',
  'Approved',
  'Rejected',
  'Completed',
]

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
    if (!dirty) return
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
      {/* Stage selector */}
      <DrawerSection title="Stage">
        <div className="flex items-end gap-2">
          <div className="grid flex-1 gap-1.5">
            <Label className="sr-only">Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select stage…" />
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={approvalTone(s)} dot>
                        {s}
                      </StatusBadge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveStage} disabled={saving || !dirty}>
            <Save className="size-[13px]" /> Save
          </Button>
        </div>
      </DrawerSection>

      {/* Core details */}
      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="Property">{row.property_name || '—'}</DescriptionItem>
          <DescriptionItem term="Opportunity">{relatedName(row.opportunity)}</DescriptionItem>
          <DescriptionItem term="Submitted">{formatDate(row.submitted_date)}</DescriptionItem>
          <DescriptionItem term="Response">{formatDate(row.response_date)}</DescriptionItem>
          <DescriptionItem term="Due">{formatDate(row.due_date)}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      {/* Licensor comments */}
      {row.licensor_comments ? (
        <DrawerSection title="Licensor comments">
          <div className="rounded-[8px] border-l-[3px] border-l-border bg-muted/20 px-[12px] py-[10px] text-[12.5px] leading-[1.65] text-foreground whitespace-pre-wrap">
            {row.licensor_comments}
          </div>
        </DrawerSection>
      ) : (
        <DrawerSection title="Licensor comments">
          <p className="text-[12px] text-muted-foreground">No comments yet.</p>
        </DrawerSection>
      )}
    </>
  )
}
