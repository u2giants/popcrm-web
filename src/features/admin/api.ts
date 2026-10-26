import { supabase } from '@/lib/supabase'

// Admin-only data access for Settings → People, Customer assignments and
// Access history. Every call goes through an api.crm_admin_* security-definer
// function that hard-gates on the administrator role server-side; the browser
// gating in SettingsPage is presentation only.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = supabase as any

type Row = Record<string, unknown>

export interface AdminRole {
  slug: string
  name: string
  description: string | null
}

export interface AdminUser {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  status: string
  created_at: string | null
  last_sign_in_at: string | null
  roles: string[]
  apps: string[]
  crm_access: boolean
  salesperson_customer_count: number
  owner_customer_count: number
}

export interface AccessEvent {
  at: string
  kind: 'role' | 'app'
  action: 'granted' | 'revoked'
  value: string
  profile_id: string
  profile_name: string | null
  actor_name: string | null
}

export interface AssignableCustomer {
  id: string
  name: string
  display_name: string | null
  status: string | null
  primary_salesperson_profile_id: string | null
  account_owner_profile_id: string | null
}

export type AssignmentField = 'salesperson' | 'account_owner'

function strings(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : []
}

export function toAdminUser(r: Row): AdminUser {
  return {
    id: r.id as string,
    email: (r.email ?? null) as string | null,
    display_name: (r.display_name ?? null) as string | null,
    avatar_url: (r.avatar_url ?? null) as string | null,
    status: (r.status ?? 'active') as string,
    created_at: (r.created_at ?? null) as string | null,
    last_sign_in_at: (r.last_sign_in_at ?? null) as string | null,
    roles: strings(r.roles),
    apps: strings(r.apps),
    crm_access: Boolean(r.crm_access),
    salesperson_customer_count: Number(r.salesperson_customer_count ?? 0),
    owner_customer_count: Number(r.owner_customer_count ?? 0),
  }
}

async function rpc(fn: string, args?: Row): Promise<unknown> {
  const { data, error } = await anyDb.schema('api').rpc(fn, args ?? {})
  if (error) throw error
  return data
}

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  const rows = (await rpc('crm_admin_role_list')) as Row[] | null
  return (rows ?? []).map((r) => ({
    slug: r.slug as string,
    name: (r.name ?? r.slug) as string,
    description: (r.description ?? null) as string | null,
  }))
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const rows = (await rpc('crm_admin_user_directory')) as Row[] | null
  return (rows ?? []).map(toAdminUser)
}

export async function setUserRoles(profileId: string, roles: string[]): Promise<AdminUser> {
  return toAdminUser((await rpc('crm_admin_set_user_roles', { p_profile_id: profileId, p_roles: roles })) as Row)
}

export async function setUserAppAccess(profileId: string, app: string, enabled: boolean): Promise<AdminUser> {
  return toAdminUser(
    (await rpc('crm_admin_set_app_access', { p_profile_id: profileId, p_app: app, p_enabled: enabled })) as Row,
  )
}

export async function setUserStatus(profileId: string, status: 'active' | 'inactive'): Promise<AdminUser> {
  return toAdminUser((await rpc('crm_admin_set_user_status', { p_profile_id: profileId, p_status: status })) as Row)
}

export async function assignCustomers(
  customerIds: string[],
  profileId: string | null,
  field: AssignmentField,
): Promise<number> {
  return Number(
    await rpc('crm_admin_assign_customers', { p_customer_ids: customerIds, p_profile_id: profileId, p_field: field }),
  )
}

export async function fetchAccessHistory(limit = 200): Promise<AccessEvent[]> {
  const rows = (await rpc('crm_admin_access_history', { p_limit: limit })) as Row[] | null
  return (rows ?? []) as unknown as AccessEvent[]
}

// Customers for the assignment grid. Reads the same caller-gated list view the
// Customers page uses, paging past PostgREST's 1000-row cap.
export async function fetchAssignableCustomers(): Promise<AssignableCustomer[]> {
  const PAGE = 1000
  const out: AssignableCustomer[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await anyDb
      .schema('api')
      .from('crm_customer_list')
      .select('id,name,display_name,status,primary_salesperson_profile_id,account_owner_profile_id')
      .order('name')
      .range(from, from + PAGE - 1)
    if (error) throw error
    const rows = (data ?? []) as AssignableCustomer[]
    out.push(...rows)
    if (rows.length < PAGE) return out
  }
}
