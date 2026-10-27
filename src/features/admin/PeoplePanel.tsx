import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { SectionHeader } from '@/components/app/AppPage'
import { NameAvatar } from '@/components/app/NameAvatar'
import { StatusBadge } from '@/components/app/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/auth/auth'
import { formatDate } from '@/features/crm/format'
import { logError } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { AdminUser } from './api'
import { OTHER_APPS, ROLE_HELP, appLabel, personName, roleLabel } from './labels'
import { useAdminRolesQuery, useAdminUsersQuery, useUpdateAdminUserMutation } from './queries'

type Filter = 'all' | 'sales' | 'administrator' | 'no-crm' | 'inactive'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'sales', label: 'Salespeople' },
  { id: 'administrator', label: 'Administrators' },
  { id: 'no-crm', label: 'No CRM access' },
  { id: 'inactive', label: 'Inactive' },
]

function matches(u: AdminUser, filter: Filter) {
  if (filter === 'inactive') return u.status !== 'active'
  if (u.status !== 'active' && filter !== 'all') return false
  if (filter === 'sales') return u.roles.includes('sales')
  if (filter === 'administrator') return u.roles.includes('administrator')
  if (filter === 'no-crm') return !u.crm_access
  return true
}

export function PeoplePanel() {
  const { realUser } = useAuth()
  const usersQuery = useAdminUsersQuery()
  const rolesQuery = useAdminRolesQuery()
  const update = useUpdateAdminUserMutation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const roleSlugs = useMemo(() => {
    const slugs = (rolesQuery.data ?? []).map((r) => r.slug)
    return slugs.length ? slugs : ['administrator', 'sales', 'sales_assistant', 'licensing', 'designer', 'viewer', 'vendor']
  }, [rolesQuery.data])

  const users = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (usersQuery.data ?? []).filter(
      (u) => matches(u, filter) && (!q || `${u.display_name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q)),
    )
  }, [usersQuery.data, search, filter])

  async function run(change: Parameters<typeof update.mutateAsync>[0], done: string) {
    try {
      await update.mutateAsync(change)
      toast.success(done)
    } catch (error) {
      toast.error('Change not saved', { description: logError('PeoplePanel', error) })
    }
  }

  function toggleRole(u: AdminUser, slug: string) {
    const has = u.roles.includes(slug)
    const roles = has ? u.roles.filter((r) => r !== slug) : [...u.roles, slug]
    void run(
      { kind: 'roles', id: u.id, roles },
      `${personName(u)} ${has ? 'is no longer' : 'is now'} ${/^[AEIOU]/.test(roleLabel(slug)) ? 'an' : 'a'} ${roleLabel(slug)}`,
    )
  }

  return (
    <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
      <SectionHeader
        title="People & permissions"
        description="Everyone who has signed in. Roles and app access are shared with PIM, DAM and PLM. New people appear here after their first Microsoft sign-in."
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="h-8 w-56"
        />
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? 'default' : 'outline'}
            className="h-8"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {usersQuery.isLoading ? (
        <LoadingState className="mt-4" rows={6} />
      ) : usersQuery.isError ? (
        <ErrorState
          className="mt-4"
          description={logError('PeoplePanel.load', usersQuery.error)}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : !users.length ? (
        <EmptyState className="mt-4" icon={<Users className="size-5" />} title="No one matches" />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b text-left text-[11px] text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Person</th>
                <th className="py-2 pr-3 font-medium">Roles</th>
                <th className="py-2 pr-3 font-medium">CRM access</th>
                <th className="py-2 pr-3 font-medium">Other apps</th>
                <th className="py-2 pr-3 font-medium">Departments</th>
                <th className="py-2 pr-3 font-medium">Last sign-in</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === realUser?.id
                const active = u.status === 'active'
                return (
                  <tr key={u.id} className={cn('border-b align-top last:border-0', !active && 'opacity-60')}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <NameAvatar name={personName(u)} size={26} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">
                            {personName(u)}
                            {isSelf ? <span className="ml-1 text-muted-foreground">(you)</span> : null}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex max-w-[340px] flex-wrap gap-1">
                        {roleSlugs.map((slug) => {
                          const on = u.roles.includes(slug)
                          return (
                            <Tooltip key={slug}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  disabled={update.isPending}
                                  onClick={() => toggleRole(u, slug)}
                                  aria-pressed={on}
                                  className={cn(
                                    'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                                    on
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-dashed text-muted-foreground hover:border-foreground hover:text-foreground',
                                  )}
                                >
                                  {roleLabel(slug)}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{ROLE_HELP[slug] ?? roleLabel(slug)}</TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={u.apps.includes('crm')}
                          disabled={update.isPending}
                          onCheckedChange={(v) =>
                            void run(
                              { kind: 'app', id: u.id, app: 'crm', enabled: v === true },
                              `CRM access ${v === true ? 'granted to' : 'removed from'} ${personName(u)}`,
                            )
                          }
                        />
                        <span className="text-[11.5px] text-muted-foreground">
                          {u.crm_access ? 'Yes' : 'No'}
                          {u.crm_access && !u.apps.includes('crm') ? ' (as admin)' : ''}
                        </span>
                      </label>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {OTHER_APPS.map((app) => {
                          const on = u.apps.includes(app)
                          return (
                            <button
                              key={app}
                              type="button"
                              disabled={update.isPending}
                              onClick={() =>
                                void run(
                                  { kind: 'app', id: u.id, app, enabled: !on },
                                  `${appLabel(app)} access ${on ? 'removed from' : 'granted to'} ${personName(u)}`,
                                )
                              }
                              aria-pressed={on}
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[11px]',
                                on ? 'border-foreground/40 bg-muted text-foreground' : 'border-dashed text-muted-foreground',
                              )}
                            >
                              {appLabel(app)}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                      {u.department_count || '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(u.last_sign_in_at) || 'Never'}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Inactive'}</StatusBadge>
                        {!isSelf ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px]"
                            disabled={update.isPending}
                            onClick={() =>
                              void run(
                                { kind: 'status', id: u.id, status: active ? 'inactive' : 'active' },
                                `${personName(u)} ${active ? 'deactivated' : 'reactivated'}`,
                              )
                            }
                          >
                            {active ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
