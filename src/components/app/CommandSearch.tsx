import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useCrmData } from '@/features/crm/CrmDataContext'
import { relatedName, textOf } from '@/features/crm/format'
import { cn } from '@/lib/utils'

interface Result {
  id: string
  group: string
  label: string
  hint?: string
  icon: typeof Search
  to: string
}

// Global command palette. Searches accounts, contacts, opportunities and emails,
// and deep-links to the relevant page with the record preselected via query param.
export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { retailers, buyers, opportunities, emails } = useCrmData()
  const [query, setQuery] = useState('')

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Result[] = []
    for (const r of retailers) {
      if (textOf(r.name, r.domain).includes(q)) {
        out.push({ id: `r-${r.id}`, group: 'Accounts', label: r.name, hint: r.domain ?? undefined, icon: Building2, to: `/accounts?retailer=${r.id}` })
      }
      if (out.length > 30) break
    }
    for (const b of buyers) {
      if (textOf(b.name, b.email, relatedName(b.retailer)).includes(q)) {
        out.push({ id: `b-${b.id}`, group: 'Contacts', label: b.name, hint: b.email ?? undefined, icon: Contact, to: `/contacts?contact=${b.id}` })
      }
      if (out.length > 60) break
    }
    for (const o of opportunities) {
      if (textOf(o.name, relatedName(o.retailer), o.production_po_number, o.sales_order_number).includes(q)) {
        out.push({ id: `o-${o.id}`, group: 'Pipeline', label: o.name || 'Untitled program', hint: relatedName(o.retailer), icon: Route, to: `/pipeline?opportunity=${o.id}` })
      }
      if (out.length > 90) break
    }
    for (const e of emails) {
      if (textOf(e.subject, e.sender, relatedName(e.retailer)).includes(q)) {
        out.push({ id: `e-${e.id}`, group: 'Email', label: e.subject || '(no subject)', hint: e.sender ?? undefined, icon: MailWarning, to: `/email?message=${e.id}` })
      }
      if (out.length > 120) break
    }
    return out.slice(0, 40)
  }, [query, retailers, buyers, opportunities, emails])

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
        <DialogDescription className="sr-only">Search accounts, contacts, programs and email</DialogDescription>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, contacts, programs, email…"
            className="h-12 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Start typing to search across the CRM.
            </p>
          ) : !results.length ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matches for “{query}”.</p>
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
