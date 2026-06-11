import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface ComboOption {
  value: string
  label: string
  hint?: string
}

// Searchable single-select that stays fast with thousands of options
// (filters + caps the rendered list). Replaces native <select> for relations.
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches',
  allowClear = true,
  clearLabel = 'Unassigned',
  className,
  disabled,
  maxRender = 50,
}: {
  options: ComboOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowClear?: boolean
  clearLabel?: string
  className?: string
  disabled?: boolean
  maxRender?: number
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q
      ? options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q))
      : options
    return matches.slice(0, maxRender)
  }, [options, query, maxRender])

  function pick(next: string) {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery('') }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-64 p-0"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {allowClear ? (
            <button
              type="button"
              onClick={() => pick('')}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Check className={cn('size-4', value ? 'opacity-0' : 'opacity-100')} />
              {clearLabel}
            </button>
          ) : null}
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => pick(o.value)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Check className={cn('size-4 shrink-0', value === o.value ? 'opacity-100' : 'opacity-0')} />
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.hint ? <span className="shrink-0 text-xs text-muted-foreground">{o.hint}</span> : null}
            </button>
          ))}
          {!filtered.length ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
          ) : null}
          {options.length > filtered.length ? (
            <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">
              Showing {filtered.length} of {options.length.toLocaleString()} — refine your search
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
