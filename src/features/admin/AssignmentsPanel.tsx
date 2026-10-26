import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { SectionHeader } from '@/components/app/AppPage'
import { EmptyState, ErrorState, LoadingState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { customerLabel } from '@/features/crm/format'
import { logError } from '@/lib/errors'
import type { AssignmentField } from './api'
import { personName } from './labels'
import { useAdminUsersQuery, useAssignCustomersMutation, useAssignableCustomersQuery } from './queries'

const UNASSIGNED = '__none__'
const ANY = '__any__'
const ROW_CAP = 300

// Bulk-assign customers to a salesperson and/or account owner. Salesperson
// choices are limited to active people holding the Salesperson role.
export function AssignmentsPanel() {
  const usersQuery = useAdminUsersQuery()
  const customersQuery = useAssignableCustomersQuery()
  const assign = useAssignCustomersMutation()
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState<string>(ANY)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [field, setField] = useState<AssignmentField>('salesperson')
  const [target, setTarget] = useState<string>('')

  const people = useMemo(() => (usersQuery.data ?? []).filter((u) => u.status === 'active'), [usersQuery.data])
  const salespeople = useMemo(() => people.filter((u) => u.roles.includes('sales')), [people])
  const nameById = useMemo(
    () => new Map((usersQuery.data ?? []).map((u) => [u.id, personName(u)])),
    [usersQuery.data],
  )
  const choices = field === 'salesperson' ? salespeople : people

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (customersQuery.data ?? []).filter((c) => {
      if (!includeInactive && c.status === 'inactive') return false
      if (showFilter === UNASSIGNED && c.primary_salesperson_profile_id) return false
      if (showFilter !== ANY && showFilter !== UNASSIGNED && c.primary_salesperson_profile_id !== showFilter) return false
      return !q || customerLabel(c).toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    })
  }, [customersQuery.data, search, showFilter, includeInactive])
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
      const count = await assign.mutateAsync({ ids: [...selected], profileId, field })
      const who = profileId ? nameById.get(profileId) : 'nobody'
      toast.success(`${count} customer${count === 1 ? '' : 's'} assigned to ${who}`)
      setSelected(new Set())
    } catch (error) {
      toast.error('Assignment not saved', { description: logError('AssignmentsPanel', error) })
    }
  }

  const allVisibleSelected = visible.length > 0 && visible.every((c) => selected.has(c.id))

  return (
    <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
      <SectionHeader
        title="Customer assignments"
        description="Choose which salesperson and account owner each customer belongs to. Only people with the Salesperson role can be picked as salesperson."
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="h-8 w-56"
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
          Include inactive customers
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[8px] border bg-muted/40 px-3 py-2 text-[12px]">
        <span className="font-medium">{selected.size} selected</span>
        <span className="text-muted-foreground">→ set</span>
        <Select value={field} onValueChange={(v) => { setField(v as AssignmentField); setTarget('') }}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="salesperson">Salesperson</SelectItem>
            <SelectItem value="account_owner">Account owner</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">to</span>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="h-8 w-52">
            <SelectValue placeholder="Choose a person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Nobody (clear)</SelectItem>
            {choices.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {personName(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8" disabled={!selected.size || !target || assign.isPending} onClick={() => void apply()}>
          Apply
        </Button>
        {field === 'salesperson' && !salespeople.length && !usersQuery.isLoading ? (
          <span className="text-[11.5px] text-muted-foreground">
            No one has the Salesperson role yet — give it to someone under People.
          </span>
        ) : null}
      </div>

      {customersQuery.isLoading ? (
        <LoadingState className="mt-4" rows={8} />
      ) : customersQuery.isError ? (
        <ErrorState
          className="mt-4"
          description={logError('AssignmentsPanel.load', customersQuery.error)}
          onRetry={() => void customersQuery.refetch()}
        />
      ) : !visible.length ? (
        <EmptyState className="mt-4" icon={<Building2 className="size-5" />} title="No customers match" />
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
                        for (const c of visible) {
                          if (v === true) next.add(c.id)
                          else next.delete(c.id)
                        }
                        return next
                      })
                    }
                  />
                </th>
                <th className="py-2 pr-3 font-medium">Customer</th>
                <th className="py-2 pr-3 font-medium">Salesperson</th>
                <th className="py-2 font-medium">Account owner</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} aria-label={`Select ${c.name}`} />
                  </td>
                  <td className="py-2 pr-3 font-medium text-foreground">{customerLabel(c)}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {c.primary_salesperson_profile_id ? nameById.get(c.primary_salesperson_profile_id) ?? '—' : '—'}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {c.account_owner_profile_id ? nameById.get(c.account_owner_profile_id) ?? '—' : '—'}
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
