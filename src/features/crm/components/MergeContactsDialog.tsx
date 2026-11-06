import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { listData, useAllContactsQuery, useMergeContactsMutation } from '@/features/crm/queries'
import { customerLabel, textOf } from '@/features/crm/format'
import { logError } from '@/lib/errors'
import type { Buyer, Retailer } from '@/lib/types'

const contactName = (b: Buyer | null) => b?.name || '—'

// Customer label for a relation that may be an id string, object or null.
const relationCustomerName = (rel: string | Retailer | null) =>
  rel && typeof rel === 'object' ? customerLabel(rel) : ''

// Which value survives a merge for one field: the kept contact's value wins,
// and a blank one is filled from the duplicate being merged away.
function winner(keepValue: string | null | undefined, dropValue: string | null | undefined) {
  const keep = (keepValue ?? '').trim()
  const drop = (dropValue ?? '').trim()
  if (keep) return { text: keep, filled: false }
  if (drop) return { text: drop, filled: true }
  return { text: '', filled: false }
}

/**
 * Merge a duplicate contact into the open one (api.crm_merge_contacts moves
 * every link onto the kept contact and archives the duplicate). The duplicate
 * is picked here by searching all contacts; the preview shows which fields the
 * kept contact gains.
 */
export function MergeContactsDialog({
  keep,
  onClose,
  onMerged,
}: {
  keep: Buyer | null
  onClose: () => void
  onMerged: () => void
}) {
  const allContacts = listData(useAllContactsQuery(-1, !!keep).data)
  const merge = useMergeContactsMutation()
  const [query, setQuery] = useState('')
  const [dropId, setDropId] = useState<string | null>(null)

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allContacts
      .filter((c) => c.id !== keep?.id)
      .filter((c) => !q || textOf(c.name, c.email, c.job_title, relationCustomerName(c.retailer)).includes(q))
      .slice(0, 25)
  }, [allContacts, keep, query])

  const drop = dropId ? allContacts.find((c) => c.id === dropId) ?? null : null

  const preview = useMemo(() => {
    if (!keep || !drop) return null
    return [
      { field: 'Name', ...winner(keep.name, drop.name) },
      { field: 'Email', ...winner(keep.email, drop.email) },
      { field: 'Phone', ...winner(keep.phone, drop.phone) },
      { field: 'Title', ...winner(keep.job_title, drop.job_title) },
    ]
  }, [keep, drop])

  async function confirm() {
    if (!keep || !drop) return
    try {
      await merge.mutateAsync({ keepId: keep.id, dropId: drop.id })
      toast.success(`${contactName(drop)} merged into ${contactName(keep)}`)
      onMerged()
      onClose()
    } catch (error) {
      toast.error('Could not merge these contacts', { description: logError('MergeContactsDialog.confirm', error) })
    }
  }

  return (
    <Dialog open={!!keep} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Merge duplicate contact</DialogTitle>
          <DialogDescription>
            Everything linked to the duplicate (emails, meetings, notes, tasks, programs, customer relations) moves to{' '}
            <span className="font-medium text-foreground">{contactName(keep)}</span>, and the duplicate is archived.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="mc-search">Find the duplicate</Label>
            <Input
              id="mc-search"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, title, customer…"
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto rounded-[8px] border">
            {candidates.length ? (
              candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDropId(c.id)}
                  className={
                    'flex w-full items-center justify-between gap-3 border-b px-[11px] py-[8px] text-left last:border-b-0 transition-colors ' +
                    (c.id === dropId ? 'bg-primary/5' : 'hover:bg-accent')
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-[500] text-foreground">{contactName(c)}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{c.email || relationCustomerName(c.retailer) || '—'}</span>
                  </span>
                  {c.id === dropId ? <span className="shrink-0 text-[11px] font-medium text-primary">Merges away</span> : null}
                </button>
              ))
            ) : (
              <p className="px-[11px] py-[9px] text-[12px] text-muted-foreground">No other contact matches.</p>
            )}
          </div>

          {preview ? (
            <div className="rounded-[9px] border">
              <div className="flex items-center gap-[8px] border-b px-[11px] py-[8px] text-[12px]">
                <span className="truncate font-[600]">{contactName(drop)}</span>
                <ArrowRight className="size-[13px] shrink-0 text-muted-foreground" />
                <span className="truncate font-[600]">{contactName(keep)}</span>
              </div>
              <dl className="grid grid-cols-[auto_1fr_auto] gap-x-[10px] gap-y-[4px] px-[11px] py-[9px] text-[12px]">
                {preview.map((row) => (
                  <div key={row.field} className="col-span-3 grid grid-cols-subgrid">
                    <dt className="text-muted-foreground">{row.field}</dt>
                    <dd className="truncate">{row.text || '—'}</dd>
                    <dd>{row.filled ? <span className="text-[11px] text-muted-foreground">filled from duplicate</span> : null}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={merge.isPending}>Cancel</Button>
          <Button size="sm" disabled={!drop || drop.id === keep?.id || merge.isPending} onClick={() => void confirm()}>
            {merge.isPending ? 'Merging…' : 'Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
