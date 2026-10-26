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
import type { AssignableDepartment } from './api'
import { personName } from './labels'
import { useAdminUsersQuery, useAssignDepartmentsMutation, useDepartmentAssignmentsQuery } from './queries'

const UNASSIGNED = '__none__'
const ANY = '__any__'
const ROW_CAP = 300

function customerName(d: AssignableDepartment) {
  return d.customer_display_name || d.customer_name
}

// Bulk-assign customer departments to a salesperson. Salespeople are assigned
// per department at a customer, never per customer; choices are limited to
// active people holding the Salesperson role.
export function AssignmentsPanel() {
  const usersQuery = useAdminUsersQuery()
  const departmentsQuery = useDepartmentAssignmentsQuery()
  const assign = useAssignDepartmentsMutation()
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState<string>(ANY)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState<string>('')

  const salespeople = useMemo(
    () => (usersQuery.data ?? []).filter((u) => u.status === 'active' && u.roles.includes('sales')),
    [usersQuery.data],
  )
  const nameById = useMemo(
    () => new Map((usersQuery.data ?? []).map((u) => [u.id, personName(u)])),
    [usersQuery.data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (departmentsQuery.data ?? []).filter((d) => {
      if (!includeInactive && (!d.is_active || d.customer_status === 'inactive')) return false
      if (showFilter === UNASSIGNED && d.salesperson_profile_id) return false
      if (showFilter !== ANY && showFilter !== UNASSIGNED && d.salesperson_profile_id !== showFilter) return false
      return !q || `${customerName(d)} ${d.customer_name} ${d.name} ${d.division ?? ''}`.toLowerCase().includes(q)
    })
  }, [departmentsQuery.data, search, showFilter, includeInactive])
  const visible = filtered.slice(0, ROW_CAP)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function apply() {
    const profileId = target === UNASSIGNED ? null : target
    try {
      const count = await assign.mutateAsync({ ids: [...selected], profileId })
      const who = profileId ? nameById.get(profileId) : 'nobody'
      toast.success(`${count} department${count === 1 ? '' : 's'} assigned to ${who}`)
      setSelected(new Set())
    } catch (error) {
      toast.error('Assignment not saved', { description: logError('AssignmentsPanel', error) })
    }
  }

  const allVisibleSelected = visible.length > 0 && visible.every((d) => selected.has(d.id))

  return (
    <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
      <SectionHeader
        title="Salesperson assignments"
        description="Each department at a customer is assigned to a salesperson. Only people with the Salesperson role can be picked."
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
            <SelectItem value={UNASSIGNED}>No salesperson yet</SelectItem>
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

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[8px] border bg-muted/40 px-3 py-2 text-[12px]">
        <span className="font-medium">{selected.size} selected</span>
        <span className="text-muted-foreground">→ assign to</span>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="h-8 w-52">
            <SelectValue placeholder="Choose a salesperson" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Nobody (clear)</SelectItem>
            {salespeople.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {personName(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8" disabled={!selected.size || !target || assign.isPending} onClick={() => void apply()}>
          Apply
        </Button>
        {!salespeople.length && !usersQuery.isLoading ? (
          <span className="text-[11.5px] text-muted-foreground">
            No one has the Salesperson role yet — give it to someone under People & permissions.
          </span>
        ) : null}
      </div>

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
                <th className="py-2 font-medium">Salesperson</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggle(d.id)} aria-label={`Select ${d.name}`} />
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{customerName(d)}</td>
                  <td className="py-2 pr-3 font-medium text-foreground">
                    {d.name}
                    {d.division ? <span className="ml-1 text-muted-foreground">· {d.division}</span> : null}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {d.salesperson_profile_id ? nameById.get(d.salesperson_profile_id) ?? '—' : '—'}
                  </td>
                </tr>
              ))}
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
