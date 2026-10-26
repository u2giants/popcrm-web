// Business names for the shared role and app codes. Roles and app access are
// shared across CRM, PIM, DAM and PLM, so a change here applies everywhere.

export const ROLE_LABEL: Record<string, string> = {
  administrator: 'Administrator',
  sales: 'Salesperson',
  licensing: 'Licensing',
  designer: 'Designer',
  viewer: 'Viewer',
  vendor: 'Vendor',
}

export const ROLE_HELP: Record<string, string> = {
  administrator: 'Full access, including Settings and viewing as other people',
  sales: 'Can be assigned customer departments',
  licensing: 'Licensing team member',
  designer: 'Design team member',
  viewer: 'Read-only access',
  vendor: 'Outside vendor',
}

export const APP_LABEL: Record<string, string> = {
  crm: 'CRM',
  pm: 'PIM',
  dam: 'DAM',
  plm: 'PLM',
  admin: 'Admin tools',
}

export const OTHER_APPS = ['pm', 'dam', 'plm', 'admin'] as const

export function roleLabel(slug: string) {
  return ROLE_LABEL[slug] ?? slug
}

export function appLabel(app: string) {
  return APP_LABEL[app] ?? app
}

export function personName(u: { display_name: string | null; email: string | null } | null | undefined) {
  return u?.display_name || u?.email || 'Unknown'
}
