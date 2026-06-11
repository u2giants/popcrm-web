import { Menu, RefreshCcw, Search } from 'lucide-react'
import { useAuth } from '@/auth/auth'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/app/StatusBadge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/features/crm/format'

export function AppHeader({
  onOpenMobileNav,
  onOpenSearch,
}: {
  onOpenMobileNav: () => void
  onOpenSearch: () => void
}) {
  const { user, logout } = useAuth()
  const { refresh, loading, firefliesOk } = useCrmData()
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        title="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/40"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search accounts, contacts, programs…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] font-medium sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden sm:inline-flex">
              <StatusBadge tone={firefliesOk === false ? 'danger' : firefliesOk ? 'success' : 'neutral'}>
                Fireflies {firefliesOk === null ? '…' : firefliesOk ? 'online' : 'offline'}
              </StatusBadge>
            </span>
          </TooltipTrigger>
          <TooltipContent>Fireflies meeting-notes webhook health</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={refresh}
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCcw className={loading ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh CRM data</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email ?? '—'}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{user?.role?.name ?? '—'}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
