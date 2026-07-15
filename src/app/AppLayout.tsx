import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AppSidebar, AppSidebarContent } from '@/components/app/AppSidebar'
import { AppHeader } from '@/components/app/AppHeader'
import { ImpersonationBar } from '@/components/app/ImpersonationBar'
import { CommandSearch } from '@/components/app/CommandSearch'

function initTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('popcrm_theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initDensity(): 'comfortable' | 'compact' {
  return localStorage.getItem('popcrm_density') === 'compact' ? 'compact' : 'comfortable'
}

export function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(initTheme)
  const [density, setDensity] = useState<'comfortable' | 'compact'>(initDensity)

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
    localStorage.setItem('popcrm_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    document.documentElement.classList.toggle('density-compact', density === 'compact')
    localStorage.setItem('popcrm_density', density)
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
          <Outlet />
        </main>
      </div>

      <CommandSearch open={search} onClose={() => setSearch(false)} />
      </div>
    </div>
  )
}
