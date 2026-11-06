import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { listData, useCreateContactMutation, useCustomerPickerQuery, useDepartmentsQuery } from '@/features/crm/queries'
import { customerLabel, idOf, relatedName } from '@/features/crm/format'
import { isSelectableCustomer } from '@/features/crm/pages/_shared'
import { logError } from '@/lib/errors'

// Adds a contact through api.crm_create_contact, which also enforces the
// name/email rules server-side; the checks here keep the button honest.
export function CreateContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const retailers = listData(useCustomerPickerQuery(-1).data)
  const departments = listData(useDepartmentsQuery(-1).data)
  const createContact = useCreateContactMutation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [retailerId, setRetailerId] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const customerOptions = useMemo<ComboOption[]>(
    () => retailers.filter((r) => isSelectableCustomer(r.status)).map((r) => ({ value: r.id, label: customerLabel(r) })),
    [retailers],
  )
  const departmentOptions = useMemo<ComboOption[]>(
    () =>
      departments
        .filter((d) => !retailerId || idOf(d.retailer) === retailerId)
        .map((d) => ({ value: d.id, label: d.name, hint: relatedName(d.retailer) })),
    [departments, retailerId],
  )

  const trimmedEmail = email.trim()
  const emailLooksWrong = !!trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
  const canSave = !!name.trim() && !emailLooksWrong && !createContact.isPending

  async function save() {
    if (!canSave) return
    try {
      const created = await createContact.mutateAsync({
        name: name.trim(),
        email: trimmedEmail || null,
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        retailer_id: retailerId || null,
        department_id: departmentId || null,
      })
      toast.success(`${created.name || name.trim()} added`)
      onClose()
    } catch (error) {
      toast.error('Could not add contact', { description: logError('CreateContactDialog.save', error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
          <DialogDescription>Add a buyer or contact to the CRM.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="nc-name">Name</Label>
            <Input
              id="nc-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSave) void save() }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="nc-email">Email</Label>
              <Input
                id="nc-email"
                type="email"
                value={email}
                aria-invalid={emailLooksWrong}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailLooksWrong ? <span className="text-[11px] text-destructive">That email address does not look right.</span> : null}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="nc-phone">Phone</Label>
              <Input id="nc-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="nc-title">Title</Label>
            <Input id="nc-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Customer</Label>
            <Combobox
              options={customerOptions}
              value={retailerId}
              onChange={(v) => {
                setRetailerId(v)
                // A department belongs to one customer; drop it when the customer changes.
                const dept = departments.find((d) => d.id === departmentId)
                if (dept && idOf(dept.retailer) !== v) setDepartmentId('')
              }}
              placeholder="Select customer"
            />
          </div>
          <div className="grid gap-1">
            <Label>Department</Label>
            <Combobox
              options={departmentOptions}
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department"
              disabled={!retailerId}
            />
            {!retailerId ? <span className="text-[11px] text-muted-foreground">Pick a customer first.</span> : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={createContact.isPending}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={() => void save()}>
            {createContact.isPending ? 'Adding…' : 'Add contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
