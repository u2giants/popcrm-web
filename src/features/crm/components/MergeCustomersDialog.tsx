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
import { useCustomerMergePreviewQuery, useMergeCustomersMutation } from '@/features/crm/queries'
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
  pair,
  onClose,
  onMerged,
}: {
  pair: [Retailer, Retailer] | null
  onClose: () => void
  onMerged: () => void
}) {
  // The survivor defaults to the record already carrying the most weight, and
  // the choice is only overridden once someone picks the other one. Deriving it
  // keeps a stale pick from a previous pair from ever being applied.
  const [pickedSurvivorId, setPickedSurvivorId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const merge = useMergeCustomersMutation()

  const weight = (r: Retailer) => (r.domain ? 2 : 0) + (r.customer_status === 'ACTIVE_CUSTOMER' ? 1 : 0)
  const defaultSurvivor = pair ? (weight(pair[1]) > weight(pair[0]) ? pair[1] : pair[0]) : null
  const survivorId = pair?.some((r) => r.id === pickedSurvivorId) ? pickedSurvivorId : defaultSurvivor?.id ?? null
  const setSurvivorId = setPickedSurvivorId

  const survivor = pair?.find((r) => r.id === survivorId) ?? null
  const loser = pair?.find((r) => r.id !== survivorId) ?? null
  const preview = useCustomerMergePreviewQuery(survivor?.id ?? null, loser?.id ?? null)
  const data = preview.data
  const gate = data && !data.ok ? (GATE_MESSAGE[data.code ?? ''] ?? data.message ?? 'This merge cannot run.') : null

  async function confirm() {
    if (!survivor || !loser || !data?.previewToken) return
    try {
      const result = await merge.mutateAsync({
        survivorId: survivor.id,
        loserId: loser.id,
        previewToken: data.previewToken,
        operationId: crypto.randomUUID(),
        reason: reason.trim(),
      })
      if (!result.ok) {
        toast.error('Merge did not run', { description: GATE_MESSAGE[result.code ?? ''] ?? result.message ?? result.code })
        return
      }
      toast.success(`${label(loser)} merged into ${label(survivor)}`)
      onMerged()
      onClose()
    } catch (error) {
      toast.error('Could not merge these customers', { description: logError('MergeCustomersDialog.confirm', error) })
    }
  }

  return (
    <Dialog open={!!pair} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Merge customers</DialogTitle>
          <DialogDescription>
            Everything on one record moves to the other: contacts, email, programs, routing and ERP references.
            The merged name is kept as an alias so old references still resolve. This cannot be undone automatically.
          </DialogDescription>
        </DialogHeader>

        {pair ? (
          <div className="flex flex-col gap-[14px]">
            <div>
              <p className="mb-[6px] text-[12px] font-[600] text-foreground">Which record survives?</p>
              <div className="grid grid-cols-2 gap-[8px]">
                {pair.map((r) => (
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
            ) : data ? (
              <div className="rounded-[9px] border">
                <div className="flex items-center gap-[8px] border-b px-[11px] py-[8px] text-[12px]">
                  <span className="truncate font-[600]">{data.loserName}</span>
                  <ArrowRight className="size-[13px] shrink-0 text-muted-foreground" />
                  <span className="truncate font-[600]">{data.survivorName}</span>
                </div>
                <div className="px-[11px] py-[9px]">
                  {data.affectedCounts.length ? (
                    <ul className="flex flex-col gap-[3px] text-[12px] text-muted-foreground">
                      {data.affectedCounts.map((row) => (
                        <li key={row.label}>
                          <span className="tabular-nums font-[600] text-foreground">{row.count}</span> {row.label.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">Nothing is attached to the record being merged away.</p>
                  )}
                  {data.movingAliases.length ? (
                    <p className="mt-[7px] text-[11.5px] text-muted-foreground">
                      Aliases kept: {data.movingAliases.join(', ')}
                    </p>
                  ) : null}
                  {data.conflicts.length ? (
                    <p className="mt-[7px] text-[11.5px] text-warning">
                      {data.conflicts.length} field conflict{data.conflicts.length === 1 ? '' : 's'} to resolve first
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
            disabled={!data?.ok || !reason.trim() || merge.isPending || !!data?.conflicts.length}
            onClick={() => void confirm()}
          >
            {merge.isPending ? 'Merging…' : 'Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
