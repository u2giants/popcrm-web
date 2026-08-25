import { useState } from 'react'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { previewCustomerMerge } from '@/features/crm/api'
import { useCustomerMergePreviewsQuery, useMergeCustomersMutation } from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import type { Retailer } from '@/lib/types'

const label = (r: Retailer) => r.display_name || r.name || 'Untitled customer'

// The engine reports its two gates as result codes rather than errors, because
// both are deliberate operational switches rather than bugs.
const GATE_MESSAGE: Record<string, string> = {
  not_authorized:
    'Merging needs the administrator role plus explicit admin access on your login. Ask for those to be granted, then reopen this dialog.',
  writes_disabled:
    'The database’s merge_execute safety gate is switched off, so no merge can run yet. It has to be enabled in shared-db before this button will do anything.',
  stale_preview: 'Something about these two customers changed while this was open. Close and reopen to review a fresh preview.',
  resolution_required:
    'These two records hold conflicting values that the merge cannot decide between. Clear the conflict on one of them first.',
}

export function MergeCustomersDialog({
  records,
  onClose,
  onMerged,
}: {
  records: Retailer[] | null
  onClose: () => void
  onMerged: () => void
}) {
  // The survivor defaults to the record already carrying the most weight.
  // Deriving it keeps a stale pick from a previous selection from being applied.
  const [pickedSurvivorId, setPickedSurvivorId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const merge = useMergeCustomersMutation()

  const weight = (r: Retailer) => (r.domain ? 2 : 0) + (r.customer_status === 'ACTIVE_CUSTOMER' ? 1 : 0)
  const defaultSurvivor = records?.reduce((best, row) => (weight(row) > weight(best) ? row : best)) ?? null
  const survivorId = records?.some((r) => r.id === pickedSurvivorId) ? pickedSurvivorId : defaultSurvivor?.id ?? null
  const setSurvivorId = setPickedSurvivorId

  const survivor = records?.find((r) => r.id === survivorId) ?? null
  const losers = records?.filter((r) => r.id !== survivorId) ?? []
  const preview = useCustomerMergePreviewsQuery(survivor?.id ?? null, losers.map((r) => r.id))
  const previews = preview.data ?? []
  const blocked = previews.find((item) => !item.ok)
  const gate = blocked ? (GATE_MESSAGE[blocked.code ?? ''] ?? blocked.message ?? 'This merge cannot run.') : null
  const conflicts = previews.flatMap((item) => item.conflicts)
  const affectedCounts = Array.from(
    previews.reduce((counts, item) => {
      for (const row of item.affectedCounts) counts.set(row.label, (counts.get(row.label) ?? 0) + row.count)
      return counts
    }, new Map<string, number>()),
    ([label, count]) => ({ label, count }),
  ).sort((a, b) => b.count - a.count)
  const movingAliases = Array.from(new Set(previews.flatMap((item) => item.movingAliases)))

  async function confirm() {
    if (!survivor || !losers.length || previews.length !== losers.length) return
    let completed = 0
    try {
      for (const loser of losers) {
        // Earlier merges change the survivor, so obtain a fresh token immediately
        // before each operation instead of reusing the dialog's preflight token.
        const fresh = await previewCustomerMerge(survivor.id, loser.id)
        if (!fresh.ok || fresh.conflicts.length || !fresh.previewToken) {
          throw new Error(
            GATE_MESSAGE[fresh.code ?? ''] ?? fresh.message ??
            `${label(loser)} now has a conflict that must be resolved before it can be merged.`,
          )
        }
        const result = await merge.mutateAsync({
          survivorId: survivor.id,
          loserId: loser.id,
          previewToken: fresh.previewToken,
          operationId: crypto.randomUUID(),
          reason: reason.trim(),
        })
        if (!result.ok) {
          throw new Error(GATE_MESSAGE[result.code ?? ''] ?? result.message ?? result.code ?? 'Merge did not run.')
        }
        completed += 1
      }
      toast.success(`${completed} customer record${completed === 1 ? '' : 's'} merged into ${label(survivor)}`)
      onMerged()
      onClose()
    } catch (error) {
      const description = logError('MergeCustomersDialog.confirm', error)
      if (completed) {
        toast.warning(`Merged ${completed} of ${losers.length} customer records`, {
          description: `The remaining records were left unchanged. ${description}`,
        })
        onMerged()
        onClose()
      } else {
        toast.error('Could not merge these customers', { description })
      }
    }
  }

  return (
    <Dialog open={!!records} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Merge customers</DialogTitle>
          <DialogDescription>
            Everything on the records being removed moves to the survivor: contacts, email, programs, routing and ERP references.
            Their names are kept as aliases so old references still resolve. This cannot be undone automatically.
          </DialogDescription>
        </DialogHeader>

        {records ? (
          <div className="flex flex-col gap-[14px]">
            <div>
              <p className="mb-[6px] text-[12px] font-[600] text-foreground">Which record survives?</p>
              <div className="grid max-h-[220px] grid-cols-2 gap-[8px] overflow-y-auto pr-[3px]">
                {records.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSurvivorId(r.id)}
                    className={
                      'rounded-[9px] border px-[11px] py-[9px] text-left transition-colors ' +
                      (r.id === survivorId ? 'border-primary bg-primary/5' : 'hover:bg-accent')
                    }
                  >
                    <div className="truncate text-[13px] font-[600] text-foreground">{label(r)}</div>
                    <div className="truncate font-mono text-[11px] text-muted-foreground">{r.domain || 'no domain'}</div>
                    <div className="mt-[3px] text-[11px] text-muted-foreground">
                      {r.id === survivorId ? 'Keeps everything' : 'Will be merged away'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {preview.isPending ? (
              <p className="text-[12px] text-muted-foreground">Checking what would move…</p>
            ) : gate ? (
              <div className="flex gap-[8px] rounded-[9px] border border-warning/40 bg-warning/10 px-[11px] py-[9px]">
                <TriangleAlert className="mt-[1px] size-[14px] shrink-0 text-warning" />
                <p className="text-[12px] text-foreground">{gate}</p>
              </div>
            ) : previews.length ? (
              <div className="rounded-[9px] border">
                <div className="flex items-center gap-[8px] border-b px-[11px] py-[8px] text-[12px]">
                  <span className="truncate font-[600]">{losers.length} record{losers.length === 1 ? '' : 's'}</span>
                  <ArrowRight className="size-[13px] shrink-0 text-muted-foreground" />
                  <span className="truncate font-[600]">{label(survivor!)}</span>
                </div>
                <div className="px-[11px] py-[9px]">
                  {affectedCounts.length ? (
                    <ul className="flex flex-col gap-[3px] text-[12px] text-muted-foreground">
                      {affectedCounts.map((row) => (
                        <li key={row.label}>
                          <span className="tabular-nums font-[600] text-foreground">{row.count}</span> {row.label.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">Nothing is attached to the record being merged away.</p>
                  )}
                  {movingAliases.length ? (
                    <p className="mt-[7px] text-[11.5px] text-muted-foreground">
                      Aliases kept: {movingAliases.join(', ')}
                    </p>
                  ) : null}
                  {conflicts.length ? (
                    <p className="mt-[7px] text-[11.5px] text-warning">
                      {conflicts.length} field conflict{conflicts.length === 1 ? '' : 's'} to resolve first
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-[5px] text-[12px] font-[600] text-foreground">Why are you merging these?</p>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. duplicate created by the ERP import"
                aria-label="Reason for the merge"
                className="h-[30px] text-[12.5px]"
              />
              <p className="mt-[4px] text-[11px] text-muted-foreground">Recorded on the audit trail with your name.</p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!previews.length || previews.length !== losers.length || !!gate || !reason.trim() || merge.isPending || !!conflicts.length}
            onClick={() => void confirm()}
          >
            {merge.isPending ? 'Merging…' : `Merge ${losers.length} record${losers.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
