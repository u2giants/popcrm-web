import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listData, useDepartmentsQuery, useEmailsQuery, useMeetingsQuery, useUpdateContactMutation } from '@/features/crm/queries'
import { idOf, label, relatedName, formatDate } from '@/features/crm/format'
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
  // The drawer keeps the row it was opened with, so a successful edit is held
  // here and shown until a different contact is opened.
  const [edited, setEdited] = useState<{ id: string; department: string | CrmDepartment | null; retailer?: string | Retailer | null } | null>(null)
  const applied = edited && row && edited.id === row.id ? edited : null

  const related = useMemo(() => {
    if (!row) return { emails: [], meetings: [] }
    return {
      emails: emails.filter((e) => (e.sender || '').toLowerCase() === (row.email || '\0').toLowerCase()).slice(0, 6),
      meetings: meetings.filter((m) => idOf(m.contact) === row.id).slice(0, 6),
    }
  }, [row, emails, meetings])

  const retailerId = applied ? idOf(applied.retailer ?? null) || '' : idOf(row?.retailer)
  const departmentOptions = useMemo<ComboOption[]>(
    () =>
      departments
        .filter((d) => !retailerId || idOf(d.retailer) === retailerId)
        .map((d) => ({ value: d.id, label: d.name, hint: relatedName(d.retailer) })),
    [departments, retailerId],
  )
  const departmentValue = applied
    ? idOf(applied.department) || ''
    : idOf(row?.department) || ''

  async function setDepartment(value: string) {
    if (!row) return
    const dept = departments.find((d) => d.id === value) ?? null
    // Same rule as the Contacts grid: a department carries its customer, so a
    // contact without one inherits the department's customer.
    const patch: Partial<Buyer> = { department: dept }
    if (dept && !idOf(row.retailer)) patch.retailer = dept.retailer
    try {
      await updateContactMutation.mutateAsync({ id: row.id, values: patch })
      setEdited({ id: row.id, department: dept, retailer: 'retailer' in patch ? patch.retailer : undefined })
    } catch (error) {
      toast.error('Could not save department', { description: logError('ContactDrawer.setDepartment', error) })
    }
  }

  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || 'Contact'}
      subtitle={row?.job_title ?? undefined}
      footer={
        row?.email ? (
          <Button asChild>
            <a href={`mailto:${row.email}`} target="_blank" rel="noreferrer">
              <Mail className="size-4" /> Compose
            </a>
          </Button>
        ) : undefined
      }
    >
      {row ? (
        <>
          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Email">
                {row.email ? (
                  <a href={`mailto:${row.email}`} className="text-primary hover:underline">
                    {row.email}
                  </a>
                ) : '—'}
              </DescriptionItem>
              <DescriptionItem term="Phone">{row.phone || '—'}</DescriptionItem>
              <DescriptionItem term="Title">{row.job_title || '—'}</DescriptionItem>
              <DescriptionItem term="Scope">{label(row.scope)}</DescriptionItem>
              <DescriptionItem term="Customer">{relatedName(applied?.retailer !== undefined ? applied.retailer : row.retailer)}</DescriptionItem>
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
