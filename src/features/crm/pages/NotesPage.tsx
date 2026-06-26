import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { NotebookTabs, Plus } from 'lucide-react'
import { AppPage, ListBar } from '@/components/app/AppPage'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ErrorState } from '@/components/app/states'
import { AccountRelationLogo } from '@/features/crm/components/AccountRelationLogo'
import { RelationLabel } from '@/features/crm/components/RelationLabel'
import { useRecordSelection } from '@/features/crm/useRecordSelection'
import { NoteDrawer } from '@/features/crm/components/NoteDrawer'
import { label, relatedName, textOf } from '@/features/crm/format'
import { StatusBadge } from '@/components/app/StatusBadge'
import { listData, useCreateNoteMutation, useNotesQuery, useOpportunitiesQuery, useRetailersQuery } from '@/features/crm/queries'
import type { CrmNote } from '@/lib/types'

export function NotesPage() {
  const notesQuery = useNotesQuery(-1)
  const retailersQuery = useRetailersQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const notes = listData(notesQuery.data)
  const retailers = listData(retailersQuery.data)
  const opportunities = listData(opportunitiesQuery.data)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [selected, select] = useRecordSelection<CrmNote>('note', notes)
  const retailerById = useMemo(() => new Map(retailers.map((r) => [r.id, r])), [retailers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes.filter(
      (n) => !q || textOf(n.title, n.body, n.action_items, relatedName(n.retailer), relatedName(n.opportunity)).includes(q),
    )
  }, [notes, query])

  const columns: Column<CrmNote>[] = [
    {
      key: 'title',
      header: 'Note',
      sortValue: (n) => n.title?.toLowerCase() ?? '',
      filterValue: (n) => n.title,
      className: 'w-full max-w-0',
      cell: (n) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{n.title || 'CRM note'}</div>
          <div className="truncate text-xs text-muted-foreground">{n.body || n.action_items}</div>
        </div>
      ),
    },
    {
      key: 'retailer',
      header: 'Customer',
      hideBelow: 'md',
      sortValue: (n) => relatedName(n.retailer),
      filterValue: (n) => relatedName(n.retailer),
      cell: (n) => <AccountRelationLogo value={n.retailer} accountById={retailerById} />,
    },
    {
      key: 'opportunity',
      header: 'Opportunity',
      hideBelow: 'lg',
      sortValue: (n) => relatedName(n.opportunity),
      filterValue: (n) => relatedName(n.opportunity),
      cell: (n) => <RelationLabel value={n.opportunity} />,
    },
    {
      key: 'source',
      header: 'Source',
      hideBelow: 'lg',
      sortValue: (n) => n.source ?? '',
      filterValue: (n) => label(n.source),
      cell: (n) => n.source ? <StatusBadge tone="neutral" dot={false}>{label(n.source)}</StatusBadge> : '—',
    },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Notes"
          subtitle="Manual and imported CRM notes"
          count={filtered.length}
          search={query}
          onSearch={setQuery}
          searchPlaceholder="Search title, body, action items…"
          actions={
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New note
            </Button>
          }
        />
      }
    >
      {notesQuery.isError ? (
        <ErrorState onRetry={() => void notesQuery.refetch()} />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(n) => n.id}
          onRowClick={(n) => select(n)}
          loading={notesQuery.isPending}
          emptyIcon={<NotebookTabs className="size-5" />}
          emptyTitle="No notes yet"
          emptyDescription="Create a note to capture CRM context."
        />
      )}

      <NoteDrawer row={selected} onClose={() => select(null)} />
      <NewNoteDialog
        open={creating}
        onClose={() => setCreating(false)}
        retailerOptions={retailers.map((r) => ({ value: r.id, label: r.name }))}
        opportunityOptions={opportunities.map((o) => ({ value: o.id, label: o.name || 'Untitled program', hint: relatedName(o.retailer) }))}
      />
    </AppPage>
  )
}

function NewNoteDialog({
  open,
  onClose,
  retailerOptions,
  opportunityOptions,
}: {
  open: boolean
  onClose: () => void
  retailerOptions: ComboOption[]
  opportunityOptions: ComboOption[]
}) {
  const createNoteMutation = useCreateNoteMutation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [retailer, setRetailer] = useState('')
  const [opportunity, setOpportunity] = useState('')
  const [busy, setBusy] = useState(false)

  function reset() {
    setTitle('')
    setBody('')
    setRetailer('')
    setOpportunity('')
  }

  async function submit() {
    if (!title.trim() && !body.trim()) {
      toast.error('Add a title or body')
      return
    }
    setBusy(true)
    try {
      await createNoteMutation.mutateAsync({
        title: title.trim() || 'CRM note',
        body,
        source: 'MANUAL',
        retailer: retailer || null,
        opportunity: opportunity || null,
      })
      toast.success('Note created')
      reset()
      onClose()
    } catch {
      toast.error('Could not create note')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New note</DialogTitle>
          <DialogDescription>Capture a manual CRM note and optionally link it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
          </div>
          <div className="grid gap-1.5">
            <Label>Body</Label>
            <Textarea className="min-h-32" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a note…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Combobox options={retailerOptions} value={retailer} onChange={setRetailer} placeholder="Optional customer" />
            </div>
            <div className="grid gap-1.5">
              <Label>Opportunity</Label>
              <Combobox options={opportunityOptions} value={opportunity} onChange={setOpportunity} placeholder="Optional opportunity" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Creating…' : 'Create note'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
