import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, UserCog } from 'lucide-react'
import { fetchAdminUserList } from '@/features/crm/api'
import { initials, label } from '@/features/crm/format'
import { useAuth } from '@/auth/auth'
import type { AdminUserSummary } from '@/lib/types'
import type { StatusTone } from '@/features/crm/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/app/StatusBadge'
import { ErrorState } from '@/components/app/states'

// Role slug → chip tone. Administrator stands out; everything else is neutral/info.
const ROLE_TONE: Record<string, StatusTone> = {
  administrator: 'warning',
  sales: 'info',
  licensing: 'info',
  designer: 'success',
  viewer: 'neutral',
  vendor: 'danger',
}

function displayNameOf(u: AdminUserSummary): string {
  return u.display_name?.trim() || u.email || 'Unknown user'
}

export function ImpersonationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { realUser, startImpersonation } = useAuth()
  const [term, setTerm] = useState('')

  const query = useQuery({
    queryKey: ['admin-user-list'],
    queryFn: fetchAdminUserList,
    enabled: open,
    staleTime: 60_000,
  })

  const users = useMemo(() => {
    const rows = query.data ?? []
    const t = term.trim().toLowerCase()
    const filtered = t
      ? rows.filter(
          (u) =>
            displayNameOf(u).toLowerCase().includes(t) ||
            (u.email ?? '').toLowerCase().includes(t) ||
            u.roles.some((r) => r.toLowerCase().includes(t)),
        )
      : rows
    return [...filtered].sort((a, b) => displayNameOf(a).localeCompare(displayNameOf(b)))
  }, [query.data, term])

  function pick(u: AdminUserSummary) {
    startImpersonation(u)
    onOpenChange(false)
    setTerm('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="space-y-1 border-b px-5 pt-5 pb-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserCog className="size-[18px]" />
            Impersonate a user
          </DialogTitle>
          <DialogDescription>
            View the CRM exactly as another user sees it. You can exit impersonation at any time
            from the orange bar at the top of the page.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-5 py-3">
          <div className="flex h-[36px] items-center gap-2 rounded-[9px] border bg-background px-3 text-[13px]">
            <Search className="size-[15px] shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name, email, or role…"
              className="h-full w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="max-h-[46vh] overflow-y-auto px-2 py-2">
          {query.isLoading ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">Loading users…</div>
          ) : query.isError ? (
            <ErrorState
              title="Could not load users"
              description="You may not have administrator access, or the request failed."
            />
          ) : users.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              No users match “{term}”.
            </div>
          ) : (
            <ul className="flex flex-col">
              {users.map((u) => {
                const name = displayNameOf(u)
                const isSelf = realUser?.id === u.id
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => pick(u)}
                      className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Avatar className="size-[32px] shrink-0">
                        {u.avatar_url ? <AvatarImage src={u.avatar_url} alt="" /> : null}
                        <AvatarFallback className="text-[11px] font-[650]">{initials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {name}
                          {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(you)</span> : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{u.email ?? '—'}</div>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {u.roles.length ? (
                          u.roles.map((r) => (
                            <StatusBadge key={r} tone={ROLE_TONE[r] ?? 'neutral'} dot={false}>
                              {label(r)}
                            </StatusBadge>
                          ))
                        ) : (
                          <StatusBadge tone="neutral" dot={false}>
                            No role
                          </StatusBadge>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
