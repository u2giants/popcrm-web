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
  department_count: number
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

// A department at a customer. Salespeople are assigned per department, not
// per customer (owner rule, 2026-10-26).
export interface AssignableDepartment {
  id: string
  name: string
  division: string | null
  category: string | null
  status: string | null
  is_active: boolean
  customer_id: string
  customer_name: string
  customer_display_name: string | null
  customer_status: string | null
  salesperson_profile_id: string | null
}

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
    department_count: Number(r.department_count ?? 0),
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

export async function assignDepartments(departmentIds: string[], profileId: string | null): Promise<number> {
  return Number(await rpc('crm_admin_assign_departments', { p_department_ids: departmentIds, p_profile_id: profileId }))
}

export async function fetchAccessHistory(limit = 200): Promise<AccessEvent[]> {
  const rows = (await rpc('crm_admin_access_history', { p_limit: limit })) as Row[] | null
  return (rows ?? []) as unknown as AccessEvent[]
}

export async function fetchDepartmentAssignments(): Promise<AssignableDepartment[]> {
  const rows = (await rpc('crm_admin_department_assignments')) as AssignableDepartment[] | null
  return rows ?? []
}
