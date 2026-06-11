import { NavLink } from 'react-router-dom'
import { CircleDot } from 'lucide-react'
import { NAV_ITEMS } from '@/app/navigation'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { cn } from '@/lib/utils'

// Sidebar contents shared by the desktop rail and the mobile drawer.
export function AppSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { stats } = useCrmData()

  // Per-item badge counts surface where work is waiting.
  const badges: Record<string, number> = {
    '/email': stats.needsRouting,
    '/tasks': stats.openTasks,
    '/approvals': stats.pendingApprovals,
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CircleDot className="size-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">POP CRM</span>
          <span className="text-[11px] text-muted-foreground">Customer Operations</span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const badge = badges[item.to]
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/12 px-1.5 text-[11px] font-semibold text-primary">
                  {badge}
                </span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-muted-foreground">
        Backed by Directus · data.designflow.app
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border lg:block">
      <AppSidebarContent />
    </aside>
  )
}
