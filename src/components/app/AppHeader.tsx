import { AlignJustify, Menu, Moon, RefreshCcw, Search, Sun } from 'lucide-react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/auth'
import { crmKeys, useFirefliesHealth } from '@/features/crm/queries'
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

const COMMIT_HASH = typeof __COMMIT_HASH__ === 'string' ? __COMMIT_HASH__ : ''
const COMMIT_DATE = (() => {
  if (typeof __COMMIT_DATE__ !== 'string' || !__COMMIT_DATE__) return ''
  const d = new Date(__COMMIT_DATE__)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d)
})()

export function AppHeader({
  onOpenMobileNav,
  onOpenSearch,
  theme,
  onToggleTheme,
  density,
  onToggleDensity,
}: {
  onOpenMobileNav: () => void
  onOpenSearch: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  density: 'comfortable' | 'compact'
  onToggleDensity: () => void
}) {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const crmFetches = useIsFetching({ queryKey: crmKeys.all })
  const fireflies = useFirefliesHealth()
  const firefliesOk = fireflies.data ?? null
  const refreshing = crmFetches > 0
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User'
  const refresh = () => void queryClient.invalidateQueries({ queryKey: crmKeys.all })

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-[10px] border-b bg-card px-[18px]">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        title="Open navigation"
      >
        <Menu className="size-[17px]" />
      </Button>

      {/* Search bar — opens command palette */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-[34px] w-full max-w-[420px] items-center gap-[9px] rounded-[9px] border bg-background px-[11px] text-[13px] text-muted-foreground transition-colors duration-[120ms] hover:border-border-strong"
      >
        <Search className="size-[15px] shrink-0" />
        <span className="flex-1 text-left">Search accounts, contacts, programs…</span>
        <kbd className="hidden rounded border bg-muted px-[5px] text-[10.5px] font-[600] sm:inline">⌘K</kbd>
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

        {/* Build identity */}
        {COMMIT_HASH ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden flex-col items-end leading-tight md:flex">
                <span className="font-mono text-[10.5px] text-muted-foreground">#{COMMIT_HASH}</span>
                <span className="text-[10px] text-muted-foreground">{COMMIT_DATE}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Build commit · {COMMIT_DATE}</TooltipContent>
          </Tooltip>
        ) : null}

        {/* Density toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onToggleDensity}
              title={density === 'compact' ? 'Comfortable density' : 'Compact density'}
            >
              <AlignJustify className="size-[17px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{density === 'compact' ? 'Switch to comfortable' : 'Switch to compact'}</TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="size-[17px]" />
              ) : (
                <Moon className="size-[17px]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>

        {/* Refresh */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={refresh}
              disabled={refreshing}
              title="Refresh data"
            >
              <RefreshCcw className={refreshing ? 'size-[17px] animate-spin' : 'size-[17px]'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh CRM data</TooltipContent>
        </Tooltip>

        {/* Avatar / user menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-[30px]">
                <AvatarFallback className="text-[11px] font-[650]">{initials(name)}</AvatarFallback>
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
