import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AppSidebar, AppSidebarContent } from '@/components/app/AppSidebar'
import { AppHeader } from '@/components/app/AppHeader'
import { ImpersonationBar } from '@/components/app/ImpersonationBar'
import { CommandSearch } from '@/components/app/CommandSearch'
import { ErrorBoundary } from '@/components/app/ErrorBoundary'

// localStorage access can throw (storage disabled, Safari private mode, quota
// exhausted). Reads fall back to their defaults so the layout still renders —
// issue #44: an unusable storage must not blank the app on load. Failed writes
// only skip persistence; the in-session choice keeps working.
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Preference stays in memory for this session; there is nothing to recover to.
  }
}

function initTheme(): 'light' | 'dark' {
  const stored = readStored('popcrm_theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initDensity(): 'comfortable' | 'compact' {
  return readStored('popcrm_density') === 'compact' ? 'compact' : 'comfortable'
}

export function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(initTheme)
  const [density, setDensity] = useState<'comfortable' | 'compact'>(initDensity)
  const location = useLocation()

  // ⌘K / Ctrl-K opens the global command palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Sync .dark class to <html> and persist choice.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    writeStored('popcrm_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    document.documentElement.classList.toggle('density-compact', density === 'compact')
    writeStored('popcrm_density', density)
  }, [density])

  function toggleDensity() {
    setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <ImpersonationBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
      <AppSidebar />

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-[232px] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">POP CRM primary navigation</SheetDescription>
          <AppSidebarContent onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          onOpenMobileNav={() => setMobileNav(true)}
          onOpenSearch={() => setSearch(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          density={density}
          onToggleDensity={toggleDensity}
        />
        <main className="min-h-0 flex-1 overflow-hidden">
          {/* Keyed by pathname: a boundary that caught an error remounts clean
              when staff navigate away, so one dead screen never blocks the app. */}
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <CommandSearch open={search} onClose={() => setSearch(false)} />
      </div>
    </div>
  )
}
