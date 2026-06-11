import { useState } from 'react'
import { toast } from 'sonner'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { updateApprovalThread } from '@/features/crm/api'
import { APPROVAL_STATUSES } from '@/features/crm/constants'
import { formatDateTime, label, relatedName } from '@/features/crm/format'
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
      title={row?.name || row?.licensor_name || 'Approval'}
      subtitle={row ? relatedName(row.opportunity) : undefined}
      status={row ? <CrmStatusBadge kind="approval" status={row.approval_status} /> : undefined}
    >
      {row ? <ApprovalDrawerForm key={row.id} row={row} /> : null}
    </DetailDrawer>
  )
}

function ApprovalDrawerForm({ row }: { row: CrmLicensorApprovalThread }) {
  const { setApprovals } = useCrmData()
  const [status, setStatus] = useState(row.approval_status || 'PENDING')

  async function changeStatus(next: string) {
    const prev = status
    setStatus(next)
    setApprovals((rows) => rows.map((a) => (a.id === row.id ? { ...a, approval_status: next } : a)))
    try {
      await updateApprovalThread(row.id, { approval_status: next })
      toast.success(`Approval → ${label(next)}`)
    } catch {
      setStatus(prev)
      setApprovals((rows) => rows.map((a) => (a.id === row.id ? { ...a, approval_status: prev } : a)))
      toast.error('Could not update approval')
    }
  }

  return (
    <>
      <DrawerSection title="Status">
        <Select value={status} onValueChange={changeStatus}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPROVAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {label(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DrawerSection>

      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="Licensor">{row.licensor_name || '—'}</DescriptionItem>
          <DescriptionItem term="Opportunity">{relatedName(row.opportunity)}</DescriptionItem>
          <DescriptionItem term="Submitted">{formatDateTime(row.submitted_at)}</DescriptionItem>
          <DescriptionItem term="Approved">{formatDateTime(row.approved_at)}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      <DrawerSection title="Latest comment">
        <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap text-foreground">
          {row.latest_comment || 'No comments yet.'}
        </div>
      </DrawerSection>
    </>
  )
}
