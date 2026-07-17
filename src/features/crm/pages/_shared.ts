import { label, customerLabel } from '@/features/crm/format'
import type { ComboOption } from '@/components/app/Combobox'
import type { EditOption } from '@/components/app/DataTable'
import type { Retailer } from '@/lib/types'

// Build a sorted, de-duplicated list of filter options from a record set.
export function uniqueValues<T>(
  rows: T[],
  pick: (row: T) => string | null | undefined,
): { value: string; label: string }[] {
  const seen = new Set<string>()
  for (const row of rows) {
    const v = pick(row)
    if (v) seen.add(v)
  }
  return Array.from(seen)
    .sort()
    .map((v) => ({ value: v, label: label(v) }))
}

// Hub entity statuses a customer/vendor picker may offer by default. Most
// ERP-imported rows are 'inactive' and stay hidden; anything without a status
// yet (API contracts that don't expose it) stays visible.
const PICKER_ENTITY_STATUSES = new Set(['active', 'potential'])

export function isSelectableCustomer(status: string | null | undefined): boolean {
  return !status || PICKER_ENTITY_STATUSES.has(status.toLowerCase())
}

// Customer combobox options labeled with display_name ?? name, filtered to
// active/potential. The currently-referenced row is always kept so an existing
// value on an inactive customer still renders its name.
export function customerPickerOptions(
  retailers: Retailer[],
  currentId?: string,
  hint?: (r: Retailer) => string | undefined,
): ComboOption[] {
  return retailers
    .filter((r) => isSelectableCustomer(r.status) || (!!currentId && r.id === currentId))
    .map((r) => ({ value: r.id, label: customerLabel(r), hint: hint?.(r) }))
}

// Same defaults as a DataTable inline-edit list: picker customers plus an
// explicit clear row first.
export function customerEditOptions(retailers: Retailer[], clearLabel = 'Unassigned'): EditOption[] {
  return [{ value: '', label: clearLabel }, ...customerPickerOptions(retailers)]
}

// Append the row's current customer when the active/potential filter hid it,
// so the edit dropdown keeps showing the assigned (possibly inactive) value.
export function withCurrentCustomer(
  options: EditOption[],
  currentId: string,
  retailerById: Map<string, Retailer>,
): EditOption[] {
  if (!currentId || options.some((o) => o.value === currentId)) return options
  const current = retailerById.get(currentId)
  return [...options, { value: currentId, label: current ? customerLabel(current) : currentId }]
}
