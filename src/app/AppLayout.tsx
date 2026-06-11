import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AppSidebar, AppSidebarContent } from '@/components/app/AppSidebar'
import { AppHeader } from '@/components/app/AppHeader'
import { CommandSearch } from '@/components/app/CommandSearch'

export function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState(false)

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

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <AppSidebar />

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">POP CRM primary navigation</SheetDescription>
          <AppSidebarContent onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMobileNav={() => setMobileNav(true)} onOpenSearch={() => setSearch(true)} />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <CommandSearch open={search} onClose={() => setSearch(false)} />
    </div>
  )
}
