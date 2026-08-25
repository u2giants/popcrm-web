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
  currentRetailer?: Retailer | null,
): ComboOption[] {
  const options = retailers
    .filter((r) => isSelectableCustomer(r.status) || (!!currentId && r.id === currentId))
    .map((r) => ({ value: r.id, label: customerLabel(r), hint: hint?.(r) }))
  if (currentId && !options.some((o) => o.value === currentId)) {
    const current = currentRetailer ?? retailers.find((r) => r.id === currentId)
    options.push({
      value: currentId,
      label: current ? customerLabel(current) : currentId,
      hint: current ? hint?.(current) : undefined,
    })
  }
  return options
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

/**
 * Build a retailer id map from the picker-safe list, then fold in any
 * already-assigned relations from page rows so historical/inactive labels
 * still resolve after the picker feed no longer includes them.
 */
export function buildRetailerById(
  pickerRetailers: Retailer[],
  assigned: Array<{ id?: string | null; name?: string | null; display_name?: string | null; status?: string | null } | null | undefined> = [],
): Map<string, Retailer> {
  const map = new Map<string, Retailer>()
  for (const r of pickerRetailers) map.set(r.id, r)
  for (const rel of assigned) {
    if (!rel?.id || map.has(rel.id)) continue
    map.set(rel.id, {
      id: rel.id,
      name: (rel.name ?? rel.id) as string,
      display_name: rel.display_name ?? null,
      status: rel.status ?? 'inactive',
      domain: null,
      logo_url: null,
      customer_status: null,
      chain_type: null,
      routing_aliases: null,
    })
  }
  return map
}

/**
 * Effective CRM classification for a company.
 *
 * The CRM's own `customer_status` is the ONLY axis that says whether a company
 * is a customer — it is curated by people. The hub axis is not a substitute:
 * `status = 'active'` merely means the ERP account record is active, and the
 * 2026-07-15 ERP import created 779 companies (vendors, licensors, freight
 * carriers) with `company_type = 'customer'`, `status = 'active'`. Inferring
 * "Active Customer" from that wrongly promoted the likes of COLD LION
 * TECHNOLOGIES and Charles M Schulz Creative Associates. Do not re-add it.
 *
 * The one narrow fallback that stays: a company the hub explicitly flags as a
 * prospect (`is_potential = true` / `status = 'potential'`) reads as Potential
 * Customer, because that flag is a deliberate mark, not an import default.
 * Everything else with no CRM classification is UNASSIGNED ("New Company") and
 * belongs in the Unclassified tab until somebody classifies it.
 */
export function effectiveCustomerStatus(
  r: Pick<Retailer, 'customer_status' | 'status' | 'is_potential'>,
): string {
  if (r.customer_status) return r.customer_status
  if ((r.status ?? '').toLowerCase() === 'potential' || r.is_potential === true) return 'POTENTIAL_CUSTOMER'
  return 'UNASSIGNED'
}
