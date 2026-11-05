import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Mail, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listData, useCustomerPickerQuery, useDepartmentsQuery, useEmailsQuery, useMeetingsQuery, useUpdateContactMutation, useDefunctContactsQuery, useSetContactDefunctMutation } from '@/features/crm/queries'
import { DEFUNCT_REASONS, defunctLabel, type DefunctReason } from '@/features/crm/api'
import { customerLabel, idOf, label, relatedName, formatDate } from '@/features/crm/format'
import { isSelectableCustomer } from '@/features/crm/pages/_shared'
import { logError } from '@/lib/errors'
import type { Buyer, CrmDepartment, Retailer } from '@/lib/types'

export function ContactDrawer({
  row,
  onClose,
  // When opened from an email's From address, jump straight to the Department
  // setting so the sender can be tied to a department in one move.
  focusDepartment = false,
}: {
  row: Buyer | null
  onClose: () => void
  focusDepartment?: boolean
}) {
  const emails = listData(useEmailsQuery(-1).data)
  const meetings = listData(useMeetingsQuery(-1).data)
  const departments = listData(useDepartmentsQuery(-1).data)
  const updateContactMutation = useUpdateContactMutation()
  const defunctMap = useDefunctContactsQuery().data ?? {}
  const setDefunctMutation = useSetContactDefunctMutation()
  const defunctReason = row ? defunctMap[row.id] ?? null : null
  async function markDefunct(reason: DefunctReason | null) {
    if (!row) return
    try {
      await setDefunctMutation.mutateAsync({ id: row.id, reason })
      toast.success(reason ? `Marked defunct (${defunctLabel(reason)})` : 'Marked current again')
    } catch (error) {
      toast.error('Could not change status', { description: logError('ContactDrawer.markDefunct', error) })
    }
  }
  // The drawer keeps the row it was opened with, so a successful edit is held
  // here and shown until a different contact is opened.
  const [edited, setEdited] = useState<{ id: string; department?: string | CrmDepartment | null; retailer?: string | Retailer | null } | null>(null)
  const applied = edited && row && edited.id === row.id ? edited : null
  const retailers = listData(useCustomerPickerQuery(-1).data)
  // Saved text edits, held like the department edit above.
  const [details, setDetails] = useState<{ id: string; name: string; email: string; phone: string; job_title: string } | null>(null)
  const shown = details && row && details.id === row.id ? details : null
  const [draft, setDraft] = useState<{ id: string; name: string; email: string; phone: string; job_title: string; retailer: string } | null>(null)
  const editing = draft && row && draft.id === row.id ? draft : null
  const view = {
    name: shown?.name ?? row?.name ?? '',
    email: shown?.email ?? row?.email ?? '',
    phone: shown?.phone ?? row?.phone ?? '',
    job_title: shown?.job_title ?? row?.job_title ?? '',
  }
  const currentRetailer = applied && applied.retailer !== undefined ? applied.retailer : row?.retailer ?? null
  const customerOptions = useMemo<ComboOption[]>(() => {
    const opts = retailers
      .filter((r) => isSelectableCustomer(r.status) || r.id === idOf(currentRetailer))
      .map((r) => ({ value: r.id, label: customerLabel(r) }))
    return [{ value: '', label: 'Unassigned' }, ...opts]
  }, [retailers, currentRetailer])

  function startEdit() {
    if (!row) return
    setDraft({ id: row.id, ...view, retailer: idOf(currentRetailer) || '' })
  }

  async function saveEdit() {
    if (!row || !editing) return
    const name = editing.name.trim()
    if (!name) {
      toast.error('Name is required')
      return
    }
    const email = editing.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('That email address does not look right')
      return
    }
    const patch: Partial<Buyer> = {
      name,
      email: email || null,
      phone: editing.phone.trim() || null,
      job_title: editing.job_title.trim() || null,
    }
    const retailerChanged = editing.retailer !== (idOf(currentRetailer) || '')
    const newRetailer = retailers.find((r) => r.id === editing.retailer) ?? null
    let deptCleared = false
    if (retailerChanged) {
      patch.retailer = newRetailer
      // A department belongs to one customer; drop it when the customer changes.
      const deptId = applied && applied.department !== undefined ? idOf(applied.department) : idOf(row.department)
      const dept = departments.find((d) => d.id === deptId)
      if (deptId && (!dept || idOf(dept.retailer) !== editing.retailer)) {
        patch.department = null
        deptCleared = true
      }
    }
    try {
      await updateContactMutation.mutateAsync({ id: row.id, values: patch })
      setDetails({ id: row.id, name, email, phone: patch.phone || '', job_title: patch.job_title || '' })
      if (retailerChanged) {
        setEdited({
          id: row.id,
          retailer: newRetailer,
          department: deptCleared ? null : applied?.department !== undefined ? applied.department : row.department,
        })
      }
      setDraft(null)
      toast.success('Contact saved')
    } catch (error) {
      toast.error('Could not save contact', { description: logError('ContactDrawer.saveEdit', error) })
    }
  }

  const related = useMemo(() => {
    if (!row) return { emails: [], meetings: [] }
    return {
      emails: emails.filter((e) => (e.sender || '').toLowerCase() === (row.email || '\0').toLowerCase()).slice(0, 6),
      meetings: meetings.filter((m) => idOf(m.contact) === row.id).slice(0, 6),
    }
  }, [row, emails, meetings])

  const retailerId = idOf(currentRetailer) || ''
  const departmentOptions = useMemo<ComboOption[]>(
    () =>
      departments
        .filter((d) => !retailerId || idOf(d.retailer) === retailerId)
        .map((d) => ({ value: d.id, label: d.name, hint: relatedName(d.retailer) })),
    [departments, retailerId],
  )
  const departmentValue = applied && applied.department !== undefined
    ? idOf(applied.department) || ''
    : idOf(row?.department) || ''

  async function setDepartment(value: string) {
    if (!row) return
    const dept = departments.find((d) => d.id === value) ?? null
    // Same rule as the Contacts grid: a department carries its customer, so a
    // contact without one inherits the department's customer.
    const patch: Partial<Buyer> = { department: dept }
    if (dept && !idOf(currentRetailer)) patch.retailer = dept.retailer
    try {
      await updateContactMutation.mutateAsync({ id: row.id, values: patch })
      setEdited({ id: row.id, department: dept, retailer: 'retailer' in patch ? patch.retailer : applied?.retailer })
    } catch (error) {
      toast.error('Could not save department', { description: logError('ContactDrawer.setDepartment', error) })
    }
  }

  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={view.name || 'Contact'}
      subtitle={view.job_title || undefined}
      footer={
        editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDraft(null)} disabled={updateContactMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={updateContactMutation.isPending}>
              {updateContactMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : row ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="size-4" /> Edit
            </Button>
            {view.email ? (
              <Button asChild>
                <a href={`mailto:${view.email}`} target="_blank" rel="noreferrer">
                  <Mail className="size-4" /> Compose
                </a>
              </Button>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {row ? (
        <>
          {editing ? (
            <DrawerSection>
              <div className="grid gap-3">
                {([
                  ['name', 'Name', 'text'],
                  ['email', 'Email', 'email'],
                  ['phone', 'Phone', 'tel'],
                  ['job_title', 'Title', 'text'],
                ] as const).map(([key, term, type]) => (
                  <label key={key} className="grid gap-1">
                    <span className="text-[12px] text-muted-foreground">{term}</span>
                    <Input
                      type={type}
                      value={editing[key]}
                      autoFocus={key === 'name'}
                      onChange={(e) => setDraft({ ...editing, [key]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') void saveEdit() }}
                      className="h-8 max-w-[320px] text-[12.5px]"
                    />
                  </label>
                ))}
                <div className="grid gap-1">
                  <span className="text-[12px] text-muted-foreground">Customer</span>
                  <Combobox
                    options={customerOptions}
                    value={editing.retailer}
                    onChange={(v) => setDraft({ ...editing, retailer: v })}
                    placeholder="Select customer"
                    className="h-8 max-w-[320px] text-[12.5px]"
                  />
                </div>
              </div>
            </DrawerSection>
          ) : null}
          <DrawerSection title="Status">
            {defunctReason ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-destructive/12 px-2.5 py-[2px] text-[12px] font-[500] text-destructive">
                  Defunct · {defunctLabel(defunctReason)}
                </span>
                <Button size="sm" variant="outline" disabled={setDefunctMutation.isPending} onClick={() => void markDefunct(null)}>
                  Mark current again
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-muted-foreground">Current. Mark defunct:</span>
                {DEFUNCT_REASONS.map((r) => (
                  <Button key={r.value} size="sm" variant="outline" disabled={setDefunctMutation.isPending} onClick={() => void markDefunct(r.value)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            )}
          </DrawerSection>
          <DrawerSection>
            <DescriptionList>
              {!editing ? (<>
              <DescriptionItem term="Email">
                {view.email ? (
                  <a href={`mailto:${view.email}`} className="text-primary hover:underline">
                    {view.email}
                  </a>
                ) : '—'}
              </DescriptionItem>
              <DescriptionItem term="Phone">{view.phone || '—'}</DescriptionItem>
              <DescriptionItem term="Title">{view.job_title || '—'}</DescriptionItem>
              </>) : null}
              <DescriptionItem term="Scope">{label(row.scope)}</DescriptionItem>
              {!editing ? <DescriptionItem term="Customer">{relatedName(currentRetailer)}</DescriptionItem> : null}
              <div
                ref={focusDepartment ? (el) => { el?.scrollIntoView({ block: 'center' }) } : undefined}
                className={cn(
                  'min-w-0 rounded-[6px] -mx-1.5 -my-1 px-1.5 py-1',
                  focusDepartment && 'animate-in fade-in-0 slide-in-from-left-4 duration-700 ring-1 ring-primary/35 bg-primary/5',
                )}
              >
                <dt className="text-[12px] text-muted-foreground">Department</dt>
                <dd className="mt-0.5">
                  <Combobox
                    options={departmentOptions}
                    value={departmentValue}
                    onChange={setDepartment}
                    placeholder="Select department"
                    disabled={updateContactMutation.isPending}
                    className="h-8 max-w-[240px] text-[12.5px]"
                  />
                </dd>
              </div>
            </DescriptionList>
          </DrawerSection>

          <DrawerSection title="Recent email">
            {related.emails.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.emails.map((e) => (
                  <li key={e.id} className="px-[11px] py-[8px]">
                    <div className="truncate text-[12.5px] font-[500] text-foreground">
                      {e.subject || '(no subject)'}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {relatedName(e.retailer)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No email from this address.</p>
            )}
          </DrawerSection>

          <DrawerSection title="Meetings">
            {related.meetings.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.meetings.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-[11px] py-[8px]">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-[500] text-foreground">
                        {m.name || 'Meeting'}
                      </div>
                      {m.participants ? (
                        <div className="truncate text-[11px] text-muted-foreground">{m.participants}</div>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(m.date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No meetings linked.</p>
            )}
          </DrawerSection>
        </>
      ) : null}
    </DetailDrawer>
  )
}
