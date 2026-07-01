import { NavLink } from 'react-router-dom'
import { Route } from 'lucide-react'
import { NAV_SECTIONS } from '@/app/navigation'
import { useCrmStatsQuery, useFirefliesHealth } from '@/features/crm/queries'
import { isApprovalResolved, needsRouting } from '@/features/crm/constants'
import { cn } from '@/lib/utils'

function SidebarContent({
  onNavigate,
  variant = 'desktop',
}: {
  onNavigate?: () => void
  variant?: 'desktop' | 'mobile'
}) {
  const statsQuery = useCrmStatsQuery()
  const fireflies = useFirefliesHealth()
  const statsData = statsQuery.data
  const stats = {
    needsRouting: statsData?.emails.filter((e) => needsRouting(e.routing_status)).length ?? 0,
    openTasks: statsData?.tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELED').length ?? 0,
    pendingApprovals: statsData?.approvals.filter((a) => !isApprovalResolved(a.stage)).length ?? 0,
  }

  const badges: Record<string, number> = {
    '/email': stats.needsRouting,
    '/triage': stats.needsRouting,
    '/tasks': stats.openTasks,
    '/approvals': stats.pendingApprovals,
  }

  const healthOk = fireflies.data !== false

  // `mobileOnly` items (e.g. Quick Triage) surface only in the mobile nav sheet.
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => variant === 'mobile' || !item.mobileOnly),
  })).filter((section) => section.items.length > 0)

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}>

      {/* Brand lockup */}
      <div
        className="flex h-[52px] shrink-0 items-center gap-[10px] px-4"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white"
          style={{
            background: 'linear-gradient(140deg, var(--sidebar-primary), oklch(0.560 0.170 270))',
            boxShadow: '0 2px 8px color-mix(in oklch, var(--sidebar-primary) 45%, transparent)',
          }}
        >
          <Route className="size-[15px]" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[13px] font-[650] tracking-[-0.01em]">POP CRM</span>
          <span className="text-[10.5px]" style={{ color: 'var(--sidebar-muted)' }}>
            Customer Operations
          </span>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-[10px]">
        {sections.map((section) => (
          <div key={section.label}>
            <div
              className="px-[20px] pb-[6px] pt-[14px] text-[10px] font-[600] uppercase tracking-[0.07em]"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
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
                      'relative flex w-full items-center gap-[11px] py-[7px] text-[13px] font-[500] transition-colors duration-[120ms]',
                      isActive
                        ? 'border-l-[3px] pl-[17px] pr-[10px] text-white'
                        : 'border-l-[3px] border-transparent pl-[17px] pr-[10px] hover:text-sidebar-accent-foreground',
                    )
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          borderColor: 'var(--sidebar-primary)',
                          background: 'color-mix(in oklch, var(--sidebar-primary) 18%, var(--sidebar-accent))',
                          boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--sidebar-primary) 30%, transparent)',
                        }
                      : undefined
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Colored icon tile */}
                      <span
                        className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-white transition-transform duration-[120ms] group-hover:scale-[1.06]"
                        style={{
                          background: `linear-gradient(150deg, ${item.iconColor}, color-mix(in oklch, ${item.iconColor} 72%, black))`,
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.25)',
                          opacity: isActive ? 1 : 0.92,
                        }}
                      >
                        <Icon className="size-[15px]" />
                      </span>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {badge ? (
                        <span
                          className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[10.5px] font-[650] tabular-nums text-white"
                          style={{
                            background: item.badgeMuted
                              ? 'var(--sidebar-accent)'
                              : 'var(--sidebar-primary)',
                            color: item.badgeMuted ? 'var(--sidebar-foreground)' : 'white',
                          }}
                        >
                          {badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* System health footer */}
      <div
        className="flex shrink-0 items-center gap-[9px] px-[12px] py-[10px]"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <span
          className="size-[7px] shrink-0 rounded-full"
          style={{
            background: healthOk ? 'var(--success)' : 'var(--warning)',
            boxShadow: healthOk
              ? '0 0 0 3px color-mix(in oklch, var(--success) 22%, transparent)'
              : '0 0 0 3px color-mix(in oklch, var(--warning) 22%, transparent)',
          }}
        />
        <div className="min-w-0" style={{ color: 'var(--sidebar-muted)', fontSize: 11, lineHeight: 1.25 }}>
          <b style={{ color: 'var(--sidebar-foreground)', fontWeight: 600, display: 'block', fontSize: 11.5 }}>
            {healthOk ? 'All systems normal' : 'Check Fireflies'}
          </b>
          Supabase · qsllyeztdwjgirsysgai.supabase.co
        </div>
      </div>
    </div>
  )
}

export function AppSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return <SidebarContent onNavigate={onNavigate} variant="mobile" />
}

export function AppSidebar() {
  return (
    <aside className="hidden w-[232px] shrink-0 lg:block" style={{ borderRight: '1px solid var(--sidebar-border)' }}>
      <SidebarContent />
    </aside>
  )
}
