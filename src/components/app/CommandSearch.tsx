import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Contact,
  CornerDownLeft,
  MailWarning,
  Route,
  Search,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { searchCrm } from '@/features/crm/api'
import { crmQueryDefaults } from '@/features/crm/queries'
import { relatedName } from '@/features/crm/format'
import { cn } from '@/lib/utils'

interface Result {
  id: string
  group: string
  label: string
  hint?: string
  icon: typeof Search
  to: string
}

// Global command palette. Searches customers, contacts, opportunities and emails,
// and deep-links to the relevant page with the record preselected via query param.
export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const searchTerm = query.trim()
  const searchQ = useQuery({
    queryKey: ['crm', 'commandSearch', searchTerm],
    queryFn: () => searchCrm(searchTerm, 10),
    enabled: open && searchTerm.length > 0,
    ...crmQueryDefaults,
    staleTime: 15_000,
  })

  const results = useMemo<Result[]>(() => {
    const data = searchQ.data
    if (!data) return []
    const out: Result[] = []
    for (const r of data.accounts) {
      out.push({ id: `r-${r.id}`, group: 'Customers', label: r.name, hint: r.domain ?? undefined, icon: Building2, to: `/customers?retailer=${r.id}` })
    }
    for (const b of data.contacts) {
      out.push({ id: `b-${b.id}`, group: 'Contacts', label: b.name, hint: b.email ?? relatedName(b.retailer), icon: Contact, to: `/contacts?contact=${b.id}` })
    }
    for (const o of data.opportunities) {
      out.push({ id: `o-${o.id}`, group: 'Pipeline', label: o.name || 'Untitled program', hint: relatedName(o.retailer), icon: Route, to: `/pipeline?opportunity=${o.id}` })
    }
    for (const e of data.emails) {
      out.push({ id: `e-${e.id}`, group: 'Email', label: e.subject || '(no subject)', hint: e.sender ?? relatedName(e.retailer), icon: MailWarning, to: `/email?message=${e.id}` })
    }
    return out.slice(0, 40)
  }, [searchQ.data])

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>()
    for (const r of results) {
      const arr = map.get(r.group) ?? []
      arr.push(r)
      map.set(r.group, arr)
    }
    return Array.from(map.entries())
  }, [results])

  function go(to: string) {
    setQuery('')
    onClose()
    navigate(to)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setQuery(''); onClose() } }}>
      <DialogContent showCloseButton={false} className="top-24 max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search the CRM</DialogTitle>
        <DialogDescription className="sr-only">Search customers, contacts, programs and email</DialogDescription>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, contacts, programs, email…"
            className="h-12 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {!searchTerm ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Start typing to search across the CRM.
            </p>
          ) : searchQ.isPending || searchQ.isFetching ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Searching…</p>
          ) : searchQ.isError ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Search failed. Try again.</p>
          ) : !results.length ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matches for “{searchTerm}”.</p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{group}</p>
                {items.map((r) => {
                  const Icon = r.icon
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => go(r.to)}
                      className={cn(
                        'group flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{r.label}</span>
                      {r.hint ? <span className="shrink-0 truncate text-xs text-muted-foreground">{r.hint}</span> : null}
                      <CornerDownLeft className="size-3.5 shrink-0 opacity-0 group-hover:opacity-60" />
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
