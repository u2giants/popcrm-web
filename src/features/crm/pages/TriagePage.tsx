import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Contact,
  Inbox,
  Plus,
  Sparkles,
} from 'lucide-react'
import { AppPage } from '@/components/app/AppPage'
import { NameAvatar } from '@/components/app/NameAvatar'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { ErrorState, LoadingState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import { idOf, relatedName } from '@/features/crm/format'
import {
  listData,
  useContactSegmentQuery,
  useCreateDepartmentMutation,
  useDepartmentsQuery,
  useUpdateContactMutation,
  useCustomerDisplayName,
} from '@/features/crm/queries'
import { describeError, errorCode, logError } from '@/lib/errors'
import type { Buyer, CrmDepartment } from '@/lib/types'

function contactSearchText(contact: Buyer, customerName: (value: Buyer['retailer']) => string) {
  return [
    contact.name,
    contact.email,
    contact.job_title,
    customerName(contact.retailer),
    relatedName(contact.department),
  ].filter(Boolean).join(' ').toLowerCase()
}

export function TriagePage() {
  const customerName = useCustomerDisplayName()
  const contactsQuery = useContactSegmentQuery('customer', -1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const updateContact = useUpdateContactMutation()
  const createDepartment = useCreateDepartmentMutation()

  const contacts = listData(contactsQuery.data)
  const departments = listData(departmentsQuery.data)
  const [query, setQuery] = useState('')
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [departmentId, setDepartmentId] = useState('')
  const [newDepartmentName, setNewDepartmentName] = useState('')

  const loading = contactsQuery.isPending || departmentsQuery.isPending

  const queue = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts
      .filter((contact) => idOf(contact.retailer) && !idOf(contact.department))
      .filter((contact) => !completed.has(contact.id))
      .filter((contact) => !q || contactSearchText(contact, customerName).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [contacts, completed, query, customerName])

  const activeIndex = Math.min(currentIndex, Math.max(0, queue.length - 1))
  const current = queue[activeIndex] ?? null
  const currentCustomerId = idOf(current?.retailer)
  const currentSkipped = current ? skipped.has(current.id) : false

  const scopedDepartments = useMemo(
    () => departments.filter((department) => idOf(department.retailer) === currentCustomerId),
    [currentCustomerId, departments],
  )

  const departmentOptions = useMemo<ComboOption[]>(
    () => scopedDepartments.map((department) => ({ value: department.id, label: department.name })),
    [scopedDepartments],
  )

  const busy = updateContact.isPending || createDepartment.isPending

  function clearDraft() {
    setDepartmentId('')
    setNewDepartmentName('')
  }

  async function assignDepartment(nextDepartmentId: string) {
    if (!current) return
    if (!nextDepartmentId) {
      setDepartmentId('')
      return
    }

    const department = departments.find((item) => item.id === nextDepartmentId)
    if (!department || idOf(department.retailer) !== currentCustomerId) {
      toast.error('Choose a department from this contact\'s company')
      return
    }

    try {
      await updateContact.mutateAsync({
        id: current.id,
        values: { retailer: currentCustomerId, department: department.id },
      })
      markCurrentDone(current.id)
      toast.success('Contact routed to department')
    } catch (error) {
      toast.error('Could not route contact', {
        description: logError('TriagePage.assignDepartment', error),
      })
    }
  }

  async function createAndAssignDepartment() {
    if (!current || !currentCustomerId) return
    const contactId = current.id
    const name = newDepartmentName.trim()
    if (!name) {
      toast.error('Enter a department name')
      return
    }

    // Departments are unique per company (company_id, name). If one already
    // exists for this company — even inactive, or just not shown in the picker —
    // reuse it instead of tripping the unique constraint, which used to surface
    // as an unexplained "Could not create department".
    const existing = departments.find(
      (item) =>
        idOf(item.retailer) === currentCustomerId &&
        (item.name ?? '').trim().toLowerCase() === name.toLowerCase(),
    )

    let departmentId: string
    try {
      if (existing) {
        departmentId = existing.id
      } else {
        const department = await createDepartment.mutateAsync({
          name,
          retailer: currentCustomerId,
          active: true,
        } as Partial<CrmDepartment>)
        departmentId = department.id
      }
    } catch (error) {
      // Lost a race (or a stale list) against an already-created department:
      // recover by finding it after a refetch rather than failing outright.
      if (errorCode(error) === '23505') {
        logError('TriagePage.createDepartment', error)
        const refreshed = listData((await departmentsQuery.refetch()).data).find(
          (item) =>
            idOf(item.retailer) === currentCustomerId &&
            (item.name ?? '').trim().toLowerCase() === name.toLowerCase(),
        )
        if (!refreshed) {
          toast.error('Could not create department', { description: describeError(error) })
          return
        }
        departmentId = refreshed.id
      } else {
        toast.error('Could not create department', {
          description: logError('TriagePage.createDepartment', error),
        })
        return
      }
    }

    try {
      await updateContact.mutateAsync({
        id: contactId,
        values: { retailer: currentCustomerId, department: departmentId },
      })
    } catch (error) {
      toast.error('Department is ready, but the contact was not routed', {
        description: logError('TriagePage.createAndAssign.routeContact', error),
      })
      return
    }

    markCurrentDone(contactId)
    toast.success(existing ? 'Contact routed to department' : 'Department created and contact routed')
  }

  function markCurrentDone(contactId: string) {
    setCompleted((prev) => new Set(prev).add(contactId))
    setSkipped((prev) => {
      const next = new Set(prev)
      next.delete(contactId)
      return next
    })
    setDepartmentId('')
    setNewDepartmentName('')
  }

  function goPrevious() {
    clearDraft()
    setCurrentIndex(Math.max(0, activeIndex - 1))
  }

  function goNext() {
    clearDraft()
    setCurrentIndex(Math.min(queue.length - 1, activeIndex + 1))
  }

  function skipCurrent() {
    if (!current) return
    setSkipped((prev) => new Set(prev).add(current.id))
    goNext()
  }

  return (
    <AppPage
      title="Quick Triage"
      description="Assign customer contacts to departments from your phone"
      scroll={false}
      bodyClassName="box-border h-full min-h-0"
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={!skipped.size}
          onClick={() => setSkipped(new Set())}
        >
          <Inbox className="size-4" />
          Clear skipped
        </Button>
      }
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col gap-3 px-1 py-2">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setCurrentIndex(0)
            clearDraft()
          }}
          placeholder="Search contacts"
          className="h-10 bg-background"
        />

        {contactsQuery.isError || departmentsQuery.isError ? (
          <ErrorState
            onRetry={() => {
              void contactsQuery.refetch()
              void departmentsQuery.refetch()
            }}
          />
        ) : loading ? (
          <LoadingState rows={5} />
        ) : !current ? (
          <EmptyQueue
            filtered={!!query.trim()}
            skipped={skipped.size}
            onReset={() => {
              setQuery('')
              setSkipped(new Set())
              setCurrentIndex(0)
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between px-1 text-[12px] text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {activeIndex + 1} of {queue.length}
              </span>
              <span>{currentSkipped ? 'Skipped' : `${skipped.size} skipped`}</span>
            </div>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-sm)]">
              <div className="border-b px-4 py-3">
                <div className="flex items-start gap-3">
                  <NameAvatar name={current.last_name || current.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[17px] font-[650] leading-tight text-foreground">
                      {current.name}
                    </h2>
                    <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                      {current.job_title || current.email || 'No title or email'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="rounded-md border bg-muted/20 px-3 py-3">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-[650] uppercase text-muted-foreground">
                    <Building2 className="size-3.5" />
                    Company
                  </div>
                  <CustomerRelationLogo value={current.retailer} size={24} variant="token-name" />
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="department-select">Department</Label>
                  <Combobox
                    options={departmentOptions}
                    value={departmentId}
                    onChange={setDepartmentId}
                    placeholder={scopedDepartments.length ? 'Choose department' : 'No departments yet'}
                    emptyText="No departments for this company"
                    clearLabel="Choose later"
                    disabled={busy}
                  />
                </div>

                <div className="mt-5 border-t pt-4">
                  <Label htmlFor="new-department">Create department in this company</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="new-department"
                      value={newDepartmentName}
                      onChange={(event) => setNewDepartmentName(event.target.value)}
                      placeholder="Department name"
                      disabled={busy}
                    />
                    <Button
                      type="button"
                      size="icon"
                      disabled={busy || !newDepartmentName.trim()}
                      onClick={() => void createAndAssignDepartment()}
                      title="Create department"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={busy}
                onClick={skipCurrent}
              >
                <ChevronDown className="size-4" />
                Skip
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={busy || activeIndex === 0}
                onClick={goPrevious}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={busy || activeIndex >= queue.length - 1}
                onClick={goNext}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={busy || !departmentId}
              onClick={() => void assignDepartment(departmentId)}
            >
              <Check className="size-4" />
              Assign department
            </Button>
          </>
        )}
      </div>
    </AppPage>
  )
}

function EmptyQueue({
  filtered,
  skipped,
  onReset,
}: {
  filtered: boolean
  skipped: number
  onReset: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
        {filtered ? <Contact className="size-7" /> : <Sparkles className="size-7" />}
      </div>
      <div>
        <p className="text-[15px] font-[650] text-foreground">
          {filtered ? 'No matching contacts' : 'Department triage is clear'}
        </p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {filtered
            ? 'Clear search to return to the full queue.'
            : 'Every assigned-company contact in this queue has a department.'}
        </p>
      </div>
      {filtered || skipped ? (
        <Button variant="outline" size="sm" onClick={onReset}>
          <Inbox className="size-4" />
          Reset queue
        </Button>
      ) : null}
    </div>
  )
}
