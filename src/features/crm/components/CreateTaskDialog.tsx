import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { listData, useAllContactsQuery, useCreateTaskMutation, useCustomerPickerQuery } from '@/features/crm/queries'
import { customerLabel, idOf } from '@/features/crm/format'
import { isSelectableCustomer } from '@/features/crm/pages/_shared'
import { logError } from '@/lib/errors'

// Adds a task from the Tasks page. The backend write is the same crm.task
// insert Data Admin uses; the customer and contact pickers narrow each other.
export function CreateTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const retailers = listData(useCustomerPickerQuery(-1).data)
  const contacts = listData(useAllContactsQuery(-1, open).data)
  const createTask = useCreateTaskMutation()
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [retailerId, setRetailerId] = useState('')
  const [contactId, setContactId] = useState('')
  const [body, setBody] = useState('')

  const customerOptions = useMemo<ComboOption[]>(
    () => retailers.filter((r) => isSelectableCustomer(r.status)).map((r) => ({ value: r.id, label: customerLabel(r) })),
    [retailers],
  )
  const contactOptions = useMemo<ComboOption[]>(
    () =>
      contacts
        .filter((c) => !retailerId || idOf(c.retailer) === retailerId)
        .map((c) => ({ value: c.id, label: c.name || '—', hint: c.email ?? undefined }))
        .slice(0, 200),
    [contacts, retailerId],
  )

  const canSave = !!title.trim() && !createTask.isPending

  async function save() {
    if (!canSave) return
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        body: body.trim() || null,
        status: 'TODO',
        due_at: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : null,
        retailer: retailerId || null,
        contact: contactId || null,
      })
      toast.success('Task added')
      onClose()
    } catch (error) {
      toast.error('Could not add task', { description: logError('CreateTaskDialog.save', error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Add work to track on the Tasks page.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="nt-title">Title</Label>
            <Input
              id="nt-title"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSave) void save() }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="nt-due">Due date</Label>
              <Input id="nt-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Customer</Label>
              <Combobox
                options={customerOptions}
                value={retailerId}
                onChange={(v) => {
                  setRetailerId(v)
                  const contact = contacts.find((c) => c.id === contactId)
                  if (contact && idOf(contact.retailer) !== v) setContactId('')
                }}
                placeholder="Select customer"
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Contact</Label>
            <Combobox options={contactOptions} value={contactId} onChange={setContactId} placeholder="Select contact" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="nt-body">Details</Label>
            <Textarea id="nt-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-20" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={createTask.isPending}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={() => void save()}>
            {createTask.isPending ? 'Adding…' : 'Add task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
