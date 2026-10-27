import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { SectionHeader } from '@/components/app/AppPage'
import { EmptyState, ErrorState, LoadingState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { logError } from '@/lib/errors'
import type { AdminUser, AssignableDepartment } from './api'
import { personName } from './labels'
import { useAdminUsersQuery, useDepartmentAssignmentsQuery, useSetDepartmentSalespeopleMutation } from './queries'

const NONE = '__none__'
const ANY = '__any__'
const ROW_CAP = 300

function customerName(d: AssignableDepartment) {
  return d.customer_display_name || d.customer_name
}

// Slot values → the ordered list the server expects: main first, second
// only when there is a main, never the same person twice.
function slots(main: string | null, second: string | null): string[] {
  if (!main) return second ? [second] : []
  return second && second !== main ? [main, second] : [main]
}

function PersonSelect({
  value,
  onChange,
  people,
  placeholder,
  disabled,
  className = 'h-8 w-44',
}: {
  value: string | null
  onChange: (v: string | null) => void
  people: AdminUser[]
  placeholder: string
  disabled?: boolean
  className?: string
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>— None —</SelectItem>
        {people.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {personName(u)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Salespeople are assigned per department at a customer, never per customer.
// A department can have up to two salespeople. Choices are limited to active
// people holding the Salesperson role.
export function AssignmentsPanel() {
  const usersQuery = useAdminUsersQuery()
  const departmentsQuery = useDepartmentAssignmentsQuery()
  const save = useSetDepartmentSalespeopleMutation()
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState<string>(ANY)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkMain, setBulkMain] = useState<string | null>(null)
  const [bulkSecond, setBulkSecond] = useState<string | null>(null)

  const salespeople = useMemo(
    () => (usersQuery.data ?? []).filter((u) => u.status === 'active' && u.roles.includes('sales')),
    [usersQuery.data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (departmentsQuery.data ?? []).filter((d) => {
      if (!includeInactive && (!d.is_active || d.customer_status === 'inactive')) return false
      const assigned = [d.salesperson_profile_id, d.secondary_salesperson_profile_id]
      if (showFilter === NONE && assigned.some(Boolean)) return false
      if (showFilter !== ANY && showFilter !== NONE && !assigned.includes(showFilter)) return false
      return !q || `${customerName(d)} ${d.customer_name} ${d.name} ${d.division ?? ''}`.toLowerCase().includes(q)
    })
  }, [departmentsQuery.data, search, showFilter, includeInactive])
  const visible = filtered.slice(0, ROW_CAP)

  async function setRow(d: AssignableDepartment, main: string | null, second: string | null) {
    try {
      await save.mutateAsync({ ids: [d.id], profileIds: slots(main, second) })
      toast.success(`${customerName(d)} · ${d.name} updated`)
    } catch (error) {
      toast.error('Assignment not saved', { description: logError('AssignmentsPanel.row', error) })
    }
  }

  async function applyBulk() {
    try {
      const count = await save.mutateAsync({ ids: [...selected], profileIds: slots(bulkMain, bulkSecond) })
      toast.success(`${count} department${count === 1 ? '' : 's'} updated`)
      setSelected(new Set())
    } catch (error) {
      toast.error('Assignment not saved', { description: logError('AssignmentsPanel.bulk', error) })
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = visible.length > 0 && visible.every((d) => selected.has(d.id))

  return (
    <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
      <SectionHeader
        title="Salesperson assignments"
        description="Each department at a customer can have up to two salespeople. Only people with the Salesperson role appear in the lists."
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer or department…"
          className="h-8 w-64"
        />
        <Select value={showFilter} onValueChange={setShowFilter}>
          <SelectTrigger className="h-8 w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any salesperson</SelectItem>
            <SelectItem value={NONE}>No salesperson yet</SelectItem>
            {salespeople.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {personName(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <Checkbox checked={includeInactive} onCheckedChange={(v) => setIncludeInactive(v === true)} />
          Include inactive
        </label>
      </div>

      {selected.size ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[8px] border bg-muted/40 px-3 py-2 text-[12px]">
          <span className="font-medium">{selected.size} selected</span>
          <span className="text-muted-foreground">→ set to</span>
          <PersonSelect value={bulkMain} onChange={setBulkMain} people={salespeople} placeholder="Salesperson" />
          <span className="text-muted-foreground">and</span>
          <PersonSelect
            value={bulkSecond}
            onChange={setBulkSecond}
            people={salespeople.filter((u) => u.id !== bulkMain)}
            placeholder="2nd salesperson"
            disabled={!bulkMain}
          />
          <Button size="sm" className="h-8" disabled={save.isPending} onClick={() => void applyBulk()}>
            Apply
          </Button>
        </div>
      ) : null}

      {!salespeople.length && !usersQuery.isLoading ? (
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          No one has the Salesperson role yet — give it to someone under People & permissions.
        </p>
      ) : null}

      {departmentsQuery.isLoading ? (
        <LoadingState className="mt-4" rows={8} />
      ) : departmentsQuery.isError ? (
        <ErrorState
          className="mt-4"
          description={logError('AssignmentsPanel.load', departmentsQuery.error)}
          onRetry={() => void departmentsQuery.refetch()}
        />
      ) : !visible.length ? (
        <EmptyState className="mt-4" icon={<Building2 className="size-5" />} title="No departments match" />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b text-left text-[11px] text-muted-foreground">
                <th className="w-8 py-2">
                  <Checkbox
                    checked={allVisibleSelected}
                    aria-label="Select all shown"
                    onCheckedChange={(v) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        for (const d of visible) {
                          if (v === true) next.add(d.id)
                          else next.delete(d.id)
                        }
                        return next
                      })
                    }
                  />
                </th>
                <th className="py-2 pr-3 font-medium">Customer</th>
                <th className="py-2 pr-3 font-medium">Department</th>
                <th className="py-2 pr-3 font-medium">Salesperson</th>
                <th className="py-2 font-medium">2nd salesperson</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => {
                const main = d.salesperson_profile_id
                const second = d.secondary_salesperson_profile_id
                return (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-1.5">
                      <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggle(d.id)} aria-label={`Select ${d.name}`} />
                    </td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{customerName(d)}</td>
                    <td className="py-1.5 pr-3 font-medium text-foreground">
                      {d.name}
                      {d.division ? <span className="ml-1 text-muted-foreground">· {d.division}</span> : null}
                    </td>
                    <td className="py-1.5 pr-3">
                      <PersonSelect
                        value={main}
                        onChange={(v) => void setRow(d, v, v ? second : null)}
                        people={salespeople}
                        placeholder="Salesperson"
                        disabled={save.isPending}
                      />
                    </td>
                    <td className="py-1.5">
                      <PersonSelect
                        value={second}
                        onChange={(v) => void setRow(d, main, v)}
                        people={salespeople.filter((u) => u.id !== main)}
                        placeholder="2nd salesperson"
                        disabled={save.isPending || !main}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length > ROW_CAP ? (
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              Showing the first {ROW_CAP} of {filtered.length.toLocaleString()} — search to narrow the list.
            </p>
          ) : null}
        </div>
      )}
    </section>
  )
}
