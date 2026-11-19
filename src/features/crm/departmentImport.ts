// CSV department import: row 1 holds customer names, each column below lists
// that customer's departments. Names are stored in sentence case.

export interface DepartmentImportCustomer {
  id: string
  name: string
  display_name?: string | null
}

export interface DepartmentImportPlan {
  toCreate: { customerId: string; customerName: string; name: string }[]
  existing: number
  /** Header names with no unique customer match (not found, or two customers share the name). */
  unmatchedCustomers: string[]
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

// Buying-role acronyms stay upper case (GMM, DMM) as does DIY.
const ACRONYMS = new Set(['gmm', 'dmm', 'diy'])

export function sentenceCase(value: string): string {
  const s = value.trim().replace(/\s+/g, ' ').toLowerCase()
    .split(' ').map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w)).join(' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const key = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

export function planDepartmentImport(
  text: string,
  customers: DepartmentImportCustomer[],
  existingDepartments: { customerId: string | null; name: string | null }[],
): DepartmentImportPlan {
  const [header = [], ...body] = parseCsv(text.replace(/^\uFEFF/, ''))
  // A name shared by two different customers is ambiguous: picking either one
  // silently would attach departments to the wrong company, so such headers
  // are reported as unmatched instead (#58).
  const AMBIGUOUS = Symbol('ambiguous')
  const byName = new Map<string, DepartmentImportCustomer | typeof AMBIGUOUS>()
  const register = (k: string, c: DepartmentImportCustomer) => {
    if (!k) return
    const existing = byName.get(k)
    if (existing === undefined || existing === c) byName.set(k, c)
    else if (existing !== AMBIGUOUS) byName.set(k, AMBIGUOUS)
  }
  for (const c of customers) {
    register(key(c.name), c)
    if (c.display_name) register(key(c.display_name), c)
  }
  const have = new Set(existingDepartments.map((d) => `${d.customerId}|${key(d.name ?? '')}`))
  const plan: DepartmentImportPlan = { toCreate: [], existing: 0, unmatchedCustomers: [] }
  header.forEach((rawCustomer, col) => {
    if (!rawCustomer.trim()) return
    const names = body.map((r) => r[col] ?? '').filter((v) => v.trim())
    const customer = byName.get(key(rawCustomer))
    if (!customer || customer === AMBIGUOUS) {
      if (names.length) plan.unmatchedCustomers.push(rawCustomer.trim())
      return
    }
    for (const raw of names) {
      const id = `${customer.id}|${key(raw)}`
      if (have.has(id)) { plan.existing++; continue }
      have.add(id)
      plan.toCreate.push({ customerId: customer.id, customerName: customer.display_name || customer.name, name: sentenceCase(raw) })
    }
  })
  return plan
}
