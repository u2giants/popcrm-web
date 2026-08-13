import { supabase } from '@/lib/supabase'
import type {
  AdminUserSummary,
  CrmAiModelConfig,
  Buyer,
  CrmDepartment,
  CrmEmailMessage,
  CrmIgnoreRule,
  CrmIngestedDomain,
  CrmLicensorApprovalThread,
  CrmMeetingNote,
  CrmNote,
  CrmOpportunity,
  CrmTask,
  Retailer,
} from '@/lib/types'
import { rowsOrReport } from './searchResults'

// ---------------------------------------------------------------------------
// CRM data access over the shared Supabase backend (see u2giants/shared-db).
//
//   • Reads go through the browser-safe `api.crm_*` views (security_invoker,
//     RLS-enforced, no raw email bodies / transcripts / ingest payloads).
//   • crm.* operational writes go directly to the `crm` schema tables (baseline
//     crm_write RLS lets sales/licensing/admin write them).
//   • Canonical company/contact (customer/contact) writes go through the guarded
//     api.crm_update_customer / api.crm_update_contact RPCs.
//
// View rows are flat (company_id + company_name, ...); adapters below rebuild the
// nested {id, name} shapes the existing UI/types expect, so pages stay unchanged.
// Curated customers come from api.crm_customer_list. Email-domain triage
// comes from api.crm_ingested_domain_list and is promoted into customers only
// after human review — see fetchRetailers/fetchIngestedDomains.
// ---------------------------------------------------------------------------

const CUSTOMER_STATUSES = ['ACTIVE_CUSTOMER', 'POTENTIAL_CUSTOMER']

type Row = Record<string, unknown>
type Order = { col: string; asc?: boolean }
export type CustomerSegment = 'active' | 'dismissed' | 'all'
export type CustomerSegmentCounts = Record<CustomerSegment, number> & { triage: number }
export type ContactSegment = 'customer' | 'department' | 'triage' | 'all'
export type ContactSegmentCounts = Record<ContactSegment, number>
export type EmailSegment = 'company' | 'department' | 'program' | 'triage' | 'all'
export type EmailSegmentCounts = Record<EmailSegment, number>
export interface CrmSearchResults {
  customers: Retailer[]
  contacts: Buyer[]
  opportunities: CrmOpportunity[]
  emails: CrmEmailMessage[]
}

// Dynamic table/view names, generic Row payloads, and newly-added customer
// contracts can outrun generated types, so these helpers use the untyped surface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = supabase as any

// Admin-only user directory (all active profiles + role types) for the
// impersonation picker. Backed by api.crm_admin_user_list(), which hard-gates
// on the administrator role; a non-admin caller gets an insufficient_privilege
// error rather than data.
export async function fetchAdminUserList(): Promise<AdminUserSummary[]> {
  const { data, error } = await anyDb.schema('api').rpc('crm_admin_user_list')
  if (error) throw error
  const rows: Row[] = Array.isArray(data) ? data : []
  return rows.map((r): AdminUserSummary => ({
    id: r.id as string,
    email: (r.email ?? null) as string | null,
    display_name: (r.display_name ?? null) as string | null,
    avatar_url: (r.avatar_url ?? null) as string | null,
    status: (r.status ?? null) as string | null,
    roles: Array.isArray(r.roles) ? (r.roles as string[]) : [],
    apps: Array.isArray(r.apps) ? (r.apps as string[]) : [],
    crm_access: Boolean(r.crm_access),
  }))
}

// Build a nested relation object ({id, name, ...extra}) or null when no id.
function rel(id: unknown, name: unknown, extra: Row = {}): Row | null {
  return id ? { id: id as string, name: (name ?? null) as string | null, ...extra } : null
}

// A relation value from the UI may arrive as an id string, a nested object, or null.
function relId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in (value as Row)) return ((value as Row).id as string) ?? null
  return null
}

// Page through an API view to preserve the old fetch-all behavior.
async function fetchAllRows(view: string, order: Order[] = []): Promise<Row[]> {
  const PAGE = 1000
  const out: Row[] = []
  let from = 0
  for (;;) {
    let q = anyDb.schema("api").from(view).select('*').range(from, from + PAGE - 1)
    for (const o of order) q = q.order(o.col, { ascending: o.asc ?? true, nullsFirst: false })
    const { data, error } = await q
    if (error) throw error
    const rows = (data ?? []) as Row[]
    out.push(...rows)
    if (rows.length < PAGE) break
    from += PAGE
  }
  return out
}

async function fetchRows(view: string, order: Order[] = [], limit?: number): Promise<Row[]> {
  if (limit === undefined || limit < 0) return fetchAllRows(view, order)
  let q = anyDb.schema("api").from(view).select('*').limit(limit)
  for (const o of order) q = q.order(o.col, { ascending: o.asc ?? true, nullsFirst: false })
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Row[]
}

async function fetchRowsEq(view: string, column: string, value: string, order: Order[] = [], limit?: number): Promise<Row[]> {
  const PAGE = 1000
  const out: Row[] = []
  let from = 0
  for (;;) {
    const cappedEnd = limit !== undefined && limit >= 0 ? Math.min(from + PAGE - 1, limit - 1) : from + PAGE - 1
    let q = anyDb.schema("api").from(view).select('*').eq(column, value).range(from, cappedEnd)
    for (const o of order) q = q.order(o.col, { ascending: o.asc ?? true, nullsFirst: false })
    const { data, error } = await q
    if (error) throw error
    const rows = (data ?? []) as Row[]
    out.push(...rows)
    if (rows.length < PAGE || (limit !== undefined && limit >= 0 && out.length >= limit)) break
    from += PAGE
  }
  return limit !== undefined && limit >= 0 ? out.slice(0, limit) : out
}

function isMissingApiObject(error: unknown): boolean {
  const e = error as { code?: string; message?: string; details?: string }
  const text = `${e.message ?? ''} ${e.details ?? ''}`.toLowerCase()
  return e.code === '42P01' || e.code === 'PGRST205' || text.includes('could not find') || text.includes('does not exist')
}

function searchPattern(raw: string): string | null {
  const term = raw.trim().replace(/[,%()]/g, ' ').replace(/\s+/g, ' ')
  return term ? `%${term}%` : null
}

function ilikeAny(columns: string[], pattern: string): string {
  return columns.map((column) => `${column}.ilike.${pattern}`).join(',')
}

function applyCustomerSegment(q: ReturnType<typeof anyDb.schema>, segment: CustomerSegment) {
  if (segment === 'active') return q.in('customer_status', CUSTOMER_STATUSES)
  if (segment === 'dismissed') return q.eq('customer_status', 'OTHER')
  return q
}

async function fetchCustomerSegmentRows(segment: CustomerSegment, limit = -1): Promise<Row[]> {
  const { data, error } = await anyDb
    .schema("api")
    .rpc('crm_customer_segment_list', { p_segment: segment, p_limit: limit })
  if (!error) return (data ?? []) as Row[]
  if (!isMissingApiObject(error)) throw error

  if (segment === 'all') return fetchRows('crm_customer_list', [{ col: 'name' }], limit)
  const PAGE = 1000
  const out: Row[] = []
  let from = 0
  for (;;) {
    const cappedEnd = limit >= 0 ? Math.min(from + PAGE - 1, limit - 1) : from + PAGE - 1
    const q = applyCustomerSegment(
      anyDb.schema("api").from('crm_customer_list').select('*').order('name').range(from, cappedEnd),
      segment,
    )
    const { data, error } = await q
    if (error) throw error
    const rows = (data ?? []) as Row[]
    out.push(...rows)
    if (rows.length < PAGE || (limit >= 0 && out.length >= limit)) break
    from += PAGE
  }
  return limit >= 0 ? out.slice(0, limit) : out
}

async function countCustomerSegment(segment: CustomerSegment): Promise<number> {
  const q = applyCustomerSegment(
    anyDb.schema("api").from('crm_customer_list').select('*', { count: 'exact', head: true }),
    segment,
  )
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}

// Rename UI keys to columns (handles relation id coercion); drop undefined.
function mapValues(values: Row, map: Record<string, string>, relations: string[]): Row {
  const out: Row = {}
  for (const [key, raw] of Object.entries(values)) {
    if (raw === undefined) continue
    const col = map[key] ?? key
    out[col] = relations.includes(key) ? relId(raw) : raw
  }
  return out
}

// RPC args are typed optional (string | undefined); coerce null/undefined out.
const arg = (x: unknown): string | undefined => (x === null || x === undefined ? undefined : (x as string))

async function insertReturning<T>(
  table: string,
  payload: Row,
  view: string,
  adapt: (r: Row) => T,
): Promise<T> {
  const { data, error } = await anyDb.schema("crm").from(table).insert(payload).select("id").single()
  if (error) throw error
  const id = data.id as string
  const back = await anyDb.schema("api").from(view).select("*").eq("id", id).maybeSingle()
  if (back.error) throw back.error
  return adapt((back.data ?? { id, ...payload }) as Row)
}

async function updateRow(table: string, id: string, payload: Row): Promise<void> {
  const { error } = await anyDb.schema("crm").from(table).update(payload).eq("id", id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Adapters: api view row -> existing UI type
// ---------------------------------------------------------------------------
const toOpportunity = (r: Row): CrmOpportunity => ({
  id: r.id as string,
  name: (r.name ?? null) as string | null,
  amount: (r.amount ?? null) as string | number | null,
  close_date: (r.close_date ?? null) as string | null,
  stage: (r.stage ?? null) as string | null,
  program_type: (r.program_type ?? null) as string | null,
  season_year: (r.season_year ?? null) as string | null,
  division: (r.division ?? null) as string | null,
  production_po_number: (r.production_po_number ?? null) as string | null,
  sales_order_number: (r.sales_order_number ?? null) as string | null,
  hard_delivery_date: (r.hard_delivery_date ?? null) as string | null,
  ai_summary: (r.ai_summary ?? null) as string | null,
  ai_state: (r.ai_state ?? null) as string | null,
  retailer: rel(r.company_id, r.company_name, { display_name: r.company_display_name ?? null, customer_status: r.company_customer_status ?? null, domain: r.company_domain ?? null }),
  contact: rel(r.contact_id, r.contact_name, { email: r.contact_email ?? null }),
  department: rel(r.department_id, r.department_name),
  factory: rel(r.factory_id, r.factory_name, { display_name: r.factory_display_name ?? null, status: r.factory_status ?? null }),
  project: r.project_id ? { id: r.project_id as string, title: (r.project_title ?? null) as string | null } : null,
}) as unknown as CrmOpportunity

const toRetailer = (r: Row): Retailer => ({
  id: r.id as string,
  name: (r.name ?? null) as unknown as string,
  display_name: (r.display_name ?? null) as string | null,
  status: (r.status ?? null) as string | null,
  domain: (r.domain ?? null) as string | null,
  logo_url: (r.logo_url ?? null) as string | null,
  customer_status: (r.customer_status ?? null) as string | null,
  chain_type: (r.chain_type ?? null) as string | null,
  routing_aliases: (r.routing_aliases ?? null) as string | null,
  is_potential: (r.is_potential ?? null) as boolean | null,
})

const toIngestedDomain = (r: Row): CrmIngestedDomain => ({
  id: r.id as string,
  domain: (r.domain ?? '') as string,
  display_name: (r.display_name ?? null) as string | null,
  status: (r.status ?? null) as string | null,
  email_count: (r.email_count ?? null) as number | null,
  first_seen_at: (r.first_seen_at ?? null) as string | null,
  last_seen_at: (r.last_seen_at ?? null) as string | null,
  last_sender: (r.last_sender ?? null) as string | null,
  sample_subject: (r.sample_subject ?? null) as string | null,
  promoted_customer_id: (r.promoted_customer_id ?? null) as string | null,
  promoted_company_name: (r.promoted_company_name ?? null) as string | null,
  updated_at: (r.updated_at ?? null) as string | null,
})

const toBuyer = (r: Row): Buyer => ({
  id: r.id as string,
  name: (r.name ?? null) as unknown as string,
  first_name: (r.first_name ?? null) as string | null,
  last_name: (r.last_name ?? null) as string | null,
  email: (r.email ?? null) as string | null,
  phone: (r.phone ?? null) as string | null,
  job_title: (r.job_title ?? null) as string | null,
  contact_type: (r.contact_type ?? null) as string | null,
  scope: (r.scope ?? null) as string | null,
  retailer: rel(r.company_id, r.company_name, { display_name: r.company_display_name ?? null, customer_status: r.company_customer_status ?? null, domain: r.company_domain ?? null }),
  department: rel(r.department_id, r.department_name),
}) as unknown as Buyer

const toDepartment = (r: Row): CrmDepartment => ({
  id: r.id as string,
  name: (r.name ?? null) as unknown as string,
  category: (r.category ?? null) as string | null,
  division: (r.division ?? null) as string | null,
  active: (r.active ?? null) as boolean | null,
  retailer: rel(r.company_id, r.company_name, { display_name: r.company_display_name ?? null, domain: r.company_domain ?? null }),
  primary_buyer: rel(r.primary_contact_id, r.primary_contact_name, { email: r.primary_contact_email ?? null }),
}) as unknown as CrmDepartment

const toEmail = (r: Row): CrmEmailMessage => ({
  id: r.id as string,
  subject: (r.subject ?? null) as string | null,
  sender: (r.sender ?? null) as string | null,
  recipients: (r.recipients ?? null) as string | null,
  received_at: (r.received_at ?? null) as string | null,
  routing_status: (r.routing_status ?? null) as string | null,
  routing_method: (r.routing_method ?? null) as string | null,
  body_preview: (r.body_preview ?? null) as string | null,
  retailer: rel(r.company_id, r.company_name, { display_name: r.company_display_name ?? null, domain: r.company_domain ?? null }),
  department: rel(r.department_id, r.department_name),
  opportunity: rel(r.opportunity_id, r.opportunity_name, { stage: r.opportunity_stage ?? null }),
}) as unknown as CrmEmailMessage

const toMeeting = (r: Row): CrmMeetingNote => ({
  id: r.id as string,
  name: (r.name ?? null) as string | null,
  date: (r.date ?? null) as string | null,
  participants: (r.participants ?? null) as string | null,
  summary: (r.summary ?? null) as string | null,
  action_items: (r.action_items ?? null) as string | null,
  source: (r.source ?? null) as string | null,
  fireflies_transcript_id: (r.fireflies_transcript_id ?? null) as string | null,
  retailer: rel(r.company_id, r.company_name, { display_name: r.company_display_name ?? null, customer_status: r.company_customer_status ?? null, domain: r.company_domain ?? null }),
  department: rel(r.department_id, r.department_name),
  contact: rel(r.contact_id, r.contact_name, { email: r.contact_email ?? null }),
}) as unknown as CrmMeetingNote

const toNote = (r: Row): CrmNote => ({
  id: r.id as string,
  title: (r.title ?? null) as string | null,
  body: (r.body ?? null) as string | null,
  action_items: (r.action_items ?? null) as string | null,
  source: (r.source ?? null) as string | null,
  fireflies_transcript_id: (r.fireflies_transcript_id ?? null) as string | null,
  retailer: rel(r.company_id, r.company_name, { display_name: r.company_display_name ?? null, domain: r.company_domain ?? null }),
  contact: rel(r.contact_id, r.contact_name, { email: r.contact_email ?? null }),
  opportunity: rel(r.opportunity_id, r.opportunity_name, { stage: r.opportunity_stage ?? null }),
  department: rel(r.department_id, r.department_name),
}) as unknown as CrmNote

const toTask = (r: Row): CrmTask => ({
  id: r.id as string,
  title: (r.title ?? null) as string | null,
  body: (r.body ?? null) as string | null,
  status: (r.status ?? null) as string | null,
  due_at: (r.due_at ?? null) as string | null,
  retailer: rel(r.company_id, r.company_name, { display_name: r.company_display_name ?? null, domain: r.company_domain ?? null }),
  contact: rel(r.contact_id, r.contact_name, { email: r.contact_email ?? null }),
  opportunity: rel(r.opportunity_id, r.opportunity_name, { stage: r.opportunity_stage ?? null }),
  department: rel(r.department_id, r.department_name),
  assignee: r.assignee_profile_id
    ? { id: r.assignee_profile_id as string, name: (r.assignee_name ?? null) as string | null, email: (r.assignee_email ?? null) as string | null }
    : null,
}) as unknown as CrmTask

const toApproval = (r: Row): CrmLicensorApprovalThread => ({
  id: r.id as string,
  name: (r.name ?? null) as string | null,
  property_name: (r.property_name ?? null) as string | null,
  stage: (r.stage ?? null) as string | null,
  submitted_date: (r.submitted_date ?? null) as string | null,
  response_date: (r.response_date ?? null) as string | null,
  due_date: (r.due_date ?? null) as string | null,
  licensor_comments: (r.licensor_comments ?? null) as string | null,
  opportunity: rel(r.opportunity_id, r.opportunity_name, { stage: r.opportunity_stage ?? null }),
}) as unknown as CrmLicensorApprovalThread

const toAiConfig = (r: Row): CrmAiModelConfig => ({
  id: r.id as string,
  name: (r.name ?? null) as string | null,
  email_routing_model: (r.email_routing_model ?? null) as string | null,
  fireflies_routing_model: (r.fireflies_routing_model ?? null) as string | null,
  transcript_split_model: (r.transcript_split_model ?? null) as string | null,
  opportunity_summary_model: (r.opportunity_summary_model ?? null) as string | null,
})

const toIgnoreRule = (r: Row): CrmIgnoreRule => ({
  id: r.id as string,
  name: (r.name ?? null) as string | null,
  pattern: (r.pattern ?? null) as string | null,
  match_type: (r.match_type ?? null) as string | null,
  emails_skipped: (r.emails_skipped ?? null) as number | null,
})

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------
const OPP_MAP = { amount: 'estimated_value', retailer: 'company_id', contact: 'contact_id', department: 'department_id', factory: 'factory_id', project: 'project_id', owner: 'owner_profile_id' }
const OPP_RELS = ['retailer', 'contact', 'department', 'factory', 'project', 'owner']

export async function fetchOpportunities(limit = -1): Promise<CrmOpportunity[]> {
  const rows = await fetchRows('crm_opportunity_list', [{ col: 'stage' }, { col: 'name' }], limit)
  return rows.map(toOpportunity)
}

export async function setOpportunityStage(id: string, stage: string) {
  const { error } = await supabase.schema('api').rpc('crm_set_opportunity_stage', {
    p_opportunity_id: id,
    p_stage: stage,
  })
  if (error) throw error
}

export async function updateOpportunity(id: string, values: Partial<CrmOpportunity>) {
  await updateRow('opportunity', id, mapValues(values as Row, OPP_MAP, OPP_RELS))
}

export async function askOpportunityAi(id: string, question: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  const res = await fetch('https://crm-fireflies.designflow.app/s/opportunity-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ opportunityId: id, question }),
  })
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  const json = (await res.json()) as { answer?: string }
  return json.answer || ''
}

// ---------------------------------------------------------------------------
// Customers / companies (curated customers vs full ingested registry)
// ---------------------------------------------------------------------------
export async function fetchRetailers(limit = -1): Promise<Retailer[]> {
  const rows = await fetchCustomerSegmentRows('active', limit)
  return rows.map(toRetailer)
}

/**
 * Picker-safe CRM customers: api.crm_customer_picker_list
 * (global active/potential AND CRM extension active). Use for every combobox /
 * assign UI. Do not use crm_customer_segment_list('all') for pickers — that
 * includes inactive hub rows and ignores CRM-local inactivation.
 */
export async function fetchCustomerPickerList(limit = -1): Promise<Retailer[]> {
  let q = anyDb
    .schema('api')
    .from('crm_customer_picker_list')
    .select('id,name,display_name,core_status,crm_status,updated_at')
    .order('display_name', { ascending: true, nullsFirst: false })
    .order('name')
  if (limit >= 0) q = q.limit(limit)
  const { data, error } = await q
  if (error) throw error
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    name: (r.name ?? '') as string,
    display_name: (r.display_name ?? null) as string | null,
    status: (r.core_status ?? null) as string | null,
    domain: null,
    logo_url: null,
    customer_status: null,
    chain_type: null,
    routing_aliases: null,
    is_potential: String(r.core_status ?? '').toLowerCase() === 'potential',
  }))
}

export async function fetchIngestedDomains(limit = -1): Promise<CrmIngestedDomain[]> {
  const PAGE = 1000
  const out: Row[] = []
  let from = 0
  for (;;) {
    const cappedEnd = limit >= 0 ? Math.min(from + PAGE - 1, limit - 1) : from + PAGE - 1
    const { data, error } = await anyDb
      .schema('api')
      .from('crm_ingested_domain_list')
      .select('*')
      .is('promoted_customer_id', null)
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .range(from, cappedEnd)
    if (error) throw error
    const rows = (data ?? []) as Row[]
    out.push(...rows)
    if (rows.length < PAGE || (limit >= 0 && out.length >= limit)) break
    from += PAGE
  }
  const rows = limit >= 0 ? out.slice(0, limit) : out
  return rows.map(toIngestedDomain)
}

export async function fetchIngestedDomainCount(): Promise<number> {
  const { count, error } = await anyDb
    .schema('api')
    .from('crm_ingested_domain_list')
    .select('*', { count: 'exact', head: true })
    .is('promoted_customer_id', null)
  if (error) throw error
  return count ?? 0
}

/**
 * Deliberately retired. crm.promote_ingested_domain was dropped by
 * 20260629034600 because ingested domains must never become core.customer
 * rows. Keep the function name so call sites fail loudly with a clear message
 * instead of a PostgREST 404.
 */
export async function promoteIngestedDomain(domain: string, name: string): Promise<string> {
  throw new Error(
    `Promoting an ingested email domain to a Customer is no longer available (domain=${domain}, name=${name}). Ingested domains stay in CRM triage only and must not create or link to core.customer. Create a Customer through the normal curated path if needed.`,
  )
}

export async function fetchCustomerSegment(segment: CustomerSegment, limit = -1): Promise<Retailer[]> {
  const rows = await fetchCustomerSegmentRows(segment, limit)
  return rows.map(toRetailer)
}

export async function fetchCustomerSegmentCounts(): Promise<CustomerSegmentCounts> {
  const { data, error } = await anyDb.schema("api").rpc('crm_customer_segment_counts')
  if (!error) {
    const row = ((Array.isArray(data) ? data[0] : data) ?? {}) as Row
    return {
      active: Number(row.active ?? 0),
      triage: Number(row.triage ?? 0),
      dismissed: Number(row.dismissed ?? 0),
      all: Number(row.all ?? 0),
    }
  }
  if (!isMissingApiObject(error)) throw error

  const [active, triage, dismissed, all] = await Promise.all([
    countCustomerSegment('active'),
    fetchIngestedDomainCount(),
    countCustomerSegment('dismissed'),
    countCustomerSegment('all'),
  ])
  return { active, triage, dismissed, all }
}

export async function updateRetailer(id: string, values: Partial<Retailer>) {
  const v = values as Row
  const { error } = await anyDb.schema('api').rpc('crm_update_customer', {
    p_customer_id: id,
    p_name: arg(v.name),
    p_domain: arg(v.domain),
    p_customer_status: arg(v.customer_status),
    p_chain_type: arg(v.chain_type),
    p_routing_aliases: arg(v.routing_aliases),
  })
  if (error) throw error
}

export async function setRetailerLogo(id: string, logoUrl: string | null): Promise<void> {
  const { error } = await anyDb.schema('api').rpc('crm_set_customer_logo', {
    p_customer_id: id,
    p_logo_url: logoUrl,
  })
  if (error) throw error
}

function logoExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName
  if (file.type === 'image/svg+xml') return 'svg'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/png') return 'png'
  return 'jpg'
}

export async function uploadRetailerLogo(id: string, file: File): Promise<string> {
  const ext = logoExtension(file)
  const path = `${id}/full-logo-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('crm-customer-logos')
    .upload(path, file, { cacheControl: '31536000', upsert: true, contentType: file.type || undefined })
  if (error) throw error
  const { data } = supabase.storage.from('crm-customer-logos').getPublicUrl(path)
  return data.publicUrl
}

// ---------------------------------------------------------------------------
// Contacts / buyers
// ---------------------------------------------------------------------------
export async function fetchBuyers(limit = -1): Promise<Buyer[]> {
  // Filtering/ordering this security_invoker view through PostgREST can time out
  // because company_customer_status/name are derived across joined RLS tables.
  // Pull the browser-safe rows unfiltered and let the client segment/sort them.
  const rows = await fetchRows('crm_contact_list', [], limit)
  return rows
    .filter((r) => CUSTOMER_STATUSES.includes((r.company_customer_status ?? '') as string))
    .map(toBuyer)
}

export async function fetchIngestedContacts(limit = -1): Promise<Buyer[]> {
  // Keep this unordered for the same reason as fetchBuyers; DataTable applies the
  // visible sort client-side.
  const rows = await fetchRows('crm_contact_list', [], limit)
  return rows.map(toBuyer)
}

function rowContactSegment(r: Row): Exclude<ContactSegment, 'all'> {
  const isCustomer = CUSTOMER_STATUSES.includes((r.company_customer_status ?? '') as string)
  if (!isCustomer) return 'triage'
  return r.department_id ? 'department' : 'customer'
}

export async function fetchContactSegment(segment: Exclude<ContactSegment, 'all'>, limit = -1): Promise<Buyer[]> {
  try {
    const rows = await fetchRowsEq('crm_contact_segment_list', 'crm_segment', segment, [], limit)
    return rows.map(toBuyer)
  } catch (error) {
    if (!isMissingApiObject(error)) throw error
    const rows = await fetchRows('crm_contact_list', [], -1)
    const filtered = rows.filter((r) => rowContactSegment(r) === segment)
    return (limit >= 0 ? filtered.slice(0, limit) : filtered).map(toBuyer)
  }
}

export async function fetchAllContacts(limit = -1): Promise<Buyer[]> {
  try {
    const rows = await fetchRows('crm_contact_segment_list', [], limit)
    return rows.map(toBuyer)
  } catch (error) {
    if (!isMissingApiObject(error)) throw error
    return fetchIngestedContacts(limit)
  }
}

export async function fetchContactSegmentCounts(): Promise<ContactSegmentCounts> {
  try {
    const rows = await fetchRows('crm_contact_segment_counts', [], -1)
    const counts: ContactSegmentCounts = { customer: 0, department: 0, triage: 0, all: 0 }
    for (const row of rows) {
      const segment = row.crm_segment as ContactSegment
      if (segment in counts) counts[segment] = Number(row.contact_count ?? 0)
    }
    return counts
  } catch (error) {
    if (!isMissingApiObject(error)) throw error
    const rows = await fetchRows('crm_contact_list', [], -1)
    const counts: ContactSegmentCounts = { customer: 0, department: 0, triage: 0, all: rows.length }
    for (const row of rows) counts[rowContactSegment(row)] += 1
    return counts
  }
}

export async function updateBuyer(id: string, values: Partial<Buyer>) {
  const v = values as Row
  const args = {
    p_contact_id: id,
    p_first_name: arg(v.first_name),
    p_last_name: arg(v.last_name),
    p_full_name: arg(v.name),
    p_email: arg(v.email),
    p_phone: arg(v.phone),
    p_job_title: arg(v.job_title),
    p_customer_id: arg(relId(v.retailer)),
    p_crm_department_id: arg(relId(v.department)),
    p_contact_type: arg(v.contact_type),
    p_scope: arg(v.scope),
    p_clear_company: 'retailer' in v && !relId(v.retailer),
    p_clear_crm_department: 'department' in v && !relId(v.department),
    p_clear_contact_type: 'contact_type' in v && !v.contact_type,
    p_clear_scope: 'scope' in v && !v.scope,
  }
  const { error } = await supabase.schema('api').rpc('crm_update_contact', args)
  if (error && isMissingApiObject(error)) {
    const { error: fallbackError } = await supabase.schema('api').rpc('crm_update_contact', {
      p_contact_id: args.p_contact_id,
      p_first_name: args.p_first_name,
      p_last_name: args.p_last_name,
      p_full_name: args.p_full_name,
      p_email: args.p_email,
      p_phone: args.p_phone,
      p_job_title: args.p_job_title,
      p_customer_id: args.p_customer_id,
      p_crm_department_id: args.p_crm_department_id,
      p_contact_type: args.p_contact_type,
      p_scope: args.p_scope,
    })
    if (fallbackError) throw fallbackError
    return
  }
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------
const DEPT_MAP = { retailer: 'company_id', primary_buyer: 'primary_contact_id', active: 'is_active', sort: 'sort_order' }
const DEPT_RELS = ['retailer', 'primary_buyer']

export async function fetchDepartments(limit = -1): Promise<CrmDepartment[]> {
  const rows = await fetchRows('crm_department_list', [{ col: 'name' }], limit)
  return rows.map(toDepartment)
}

export async function updateDepartment(id: string, values: Partial<CrmDepartment>) {
  await updateRow('department', id, mapValues(values as Row, DEPT_MAP, DEPT_RELS))
}

export async function createDepartment(values: Partial<CrmDepartment>) {
  return insertReturning('department', mapValues(values as Row, DEPT_MAP, DEPT_RELS), 'crm_department_list', toDepartment)
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.schema('crm').from('department').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Email routing
// ---------------------------------------------------------------------------
const EMAIL_MAP = { retailer: 'company_id', department: 'department_id', opportunity: 'opportunity_id' }
const EMAIL_RELS = ['retailer', 'department', 'opportunity']

export async function fetchEmailMessages(limit = -1): Promise<CrmEmailMessage[]> {
  const rowLimit = limit >= 0 ? limit : 500
  const { data, error } = await anyDb.schema("api").rpc('crm_email_routing_recent', { p_limit: rowLimit })
  if (!error) return ((data ?? []) as Row[]).map(toEmail)
  if (!isMissingApiObject(error)) throw error

  const rows = await fetchRows('crm_email_routing_queue', [{ col: 'received_at', asc: false }], rowLimit)
  return rows.map(toEmail)
}

function emailSegmentOf(row: Row): Exclude<EmailSegment, 'all'> {
  const status = row.routing_status as string | null | undefined
  if (status && status !== 'ROUTED' && status !== 'SKIPPED') return 'triage'
  if (row.opportunity_id) return 'program'
  if (row.department_id) return 'department'
  if (row.company_id) return 'company'
  return 'triage'
}

export async function fetchEmailSegmentCounts(): Promise<EmailSegmentCounts> {
  const { data, error } = await anyDb.schema("api").rpc('crm_email_routing_segment_counts')
  if (!error) {
    const row = ((Array.isArray(data) ? data[0] : data) ?? {}) as Row
    return {
      company: Number(row.company ?? 0),
      department: Number(row.department ?? 0),
      program: Number(row.program ?? 0),
      triage: Number(row.triage ?? 0),
      all: Number(row.all ?? 0),
    }
  }
  if (!isMissingApiObject(error)) throw error

  const PAGE = 1000
  const counts: EmailSegmentCounts = { company: 0, department: 0, program: 0, triage: 0, all: 0 }
  let from = 0
  for (;;) {
    const { data, error } = await anyDb
      .schema("api")
      .from('crm_email_routing_queue')
      .select('routing_status,company_id,department_id,opportunity_id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    const rows = (data ?? []) as Row[]
    for (const row of rows) {
      counts[emailSegmentOf(row)] += 1
      counts.all += 1
    }
    if (rows.length < PAGE) break
    from += PAGE
  }
  return counts
}

export async function updateEmailMessage(id: string, values: Partial<CrmEmailMessage>) {
  await updateRow('email_message', id, mapValues(values as Row, EMAIL_MAP, EMAIL_RELS))
}

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------
const MEETING_MAP = { name: 'title', date: 'meeting_at', summary: 'body', retailer: 'company_id', department: 'department_id', contact: 'contact_id' }
const MEETING_RELS = ['retailer', 'department', 'contact']

export async function fetchMeetingNotes(limit = -1): Promise<CrmMeetingNote[]> {
  const rows = await fetchRows('crm_meeting_list', [{ col: 'date', asc: false }], limit)
  return rows.map(toMeeting)
}

export async function updateMeetingNote(id: string, values: Partial<CrmMeetingNote>) {
  await updateRow('meeting_note', id, mapValues(values as Row, MEETING_MAP, MEETING_RELS))
}

// ---------------------------------------------------------------------------
// Ignore rules
// ---------------------------------------------------------------------------
export async function fetchIgnoreRules(): Promise<CrmIgnoreRule[]> {
  const rows = await fetchRows('crm_ignore_rule_list', [{ col: 'name' }], -1)
  return rows.map(toIgnoreRule)
}

export async function createIgnoreRule(values: Partial<CrmIgnoreRule>) {
  return insertReturning('ignore_rule', { ...(values as Row) }, 'crm_ignore_rule_list', toIgnoreRule)
}

// ---------------------------------------------------------------------------
// AI model config
// ---------------------------------------------------------------------------
export async function fetchAiModelConfigs(): Promise<CrmAiModelConfig[]> {
  const rows = await fetchRows('crm_ai_model_config_list', [{ col: 'name' }], -1)
  return rows.map(toAiConfig)
}

export async function updateAiModelConfig(id: string, values: Partial<CrmAiModelConfig>) {
  await updateRow('ai_model_config', id, { ...(values as Row) })
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
const NOTE_MAP = { retailer: 'company_id', contact: 'contact_id', opportunity: 'opportunity_id', department: 'department_id' }
const NOTE_RELS = ['retailer', 'contact', 'opportunity', 'department']

export async function fetchNotes(limit = -1): Promise<CrmNote[]> {
  const rows = await fetchRows('crm_note_list', [{ col: 'created_at', asc: false }], limit)
  return rows.map(toNote)
}

export async function createNote(values: Partial<CrmNote>) {
  return insertReturning('note', mapValues(values as Row, NOTE_MAP, NOTE_RELS), 'crm_note_list', toNote)
}

export async function updateNote(id: string, values: Partial<CrmNote>) {
  await updateRow('note', id, mapValues(values as Row, NOTE_MAP, NOTE_RELS))
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
const TASK_MAP = { retailer: 'company_id', contact: 'contact_id', opportunity: 'opportunity_id', department: 'department_id', assignee: 'assignee_profile_id' }
const TASK_RELS = ['retailer', 'contact', 'opportunity', 'department', 'assignee']

export async function fetchTasks(limit = -1): Promise<CrmTask[]> {
  const rows = await fetchRows('crm_task_list', [{ col: 'status' }, { col: 'due_at' }], limit)
  return rows.map(toTask)
}

export async function createTask(values: Partial<CrmTask>) {
  return insertReturning('task', mapValues(values as Row, TASK_MAP, TASK_RELS), 'crm_task_list', toTask)
}

export async function updateTask(id: string, values: Partial<CrmTask>) {
  await updateRow('task', id, mapValues(values as Row, TASK_MAP, TASK_RELS))
}

// ---------------------------------------------------------------------------
// Licensor approval threads
// ---------------------------------------------------------------------------
const APPROVAL_MAP = { opportunity: 'opportunity_id' }
const APPROVAL_RELS = ['opportunity']

export async function fetchApprovalThreads(limit = -1): Promise<CrmLicensorApprovalThread[]> {
  const rows = await fetchRows('crm_approval_queue', [{ col: 'stage' }, { col: 'submitted_date', asc: false }], limit)
  return rows.map(toApproval)
}

export async function updateApprovalThread(id: string, values: Partial<CrmLicensorApprovalThread>) {
  await updateRow('licensor_approval_thread', id, mapValues(values as Row, APPROVAL_MAP, APPROVAL_RELS))
}

// ---------------------------------------------------------------------------
// Global CRM search
// ---------------------------------------------------------------------------
export async function searchCrm(query: string, limitPerGroup = 8): Promise<CrmSearchResults> {
  const pattern = searchPattern(query)
  if (!pattern) return { customers: [], contacts: [], opportunities: [], emails: [] }

  const [customers, contacts, opportunities, emails] = await Promise.all([
    // Status-aware picker contract — never surface global-inactive or
    // CRM-inactive rows in global CommandSearch.
    anyDb
      .schema("api")
      .from('crm_customer_picker_list')
      .select('id,name,display_name,core_status,crm_status,updated_at')
      .or(ilikeAny(['name', 'display_name'], pattern))
      .order('name')
      .limit(limitPerGroup),
    anyDb
      .schema("api")
      .from('crm_contact_list')
      .select('*')
      .or(ilikeAny(['name', 'email', 'job_title', 'company_name'], pattern))
      .limit(limitPerGroup),
    anyDb
      .schema("api")
      .from('crm_opportunity_list')
      .select('*')
      .or(ilikeAny(['name', 'company_name', 'department_name', 'production_po_number', 'sales_order_number'], pattern))
      .order('stage', { nullsFirst: false })
      .order('name')
      .limit(limitPerGroup),
    anyDb
      .schema("api")
      .from('crm_email_routing_queue')
      .select('*')
      .or(ilikeAny(['subject', 'sender', 'recipients', 'company_name', 'department_name', 'opportunity_name'], pattern))
      .order('received_at', { ascending: false, nullsFirst: false })
      .limit(limitPerGroup),
  ])

  // Search groups are independent. A slow email query must not blank a valid
  // Customer result (and every degraded group is reported loudly).
  const customerRows = rowsOrReport('customers', customers)
  const contactRows = rowsOrReport('contacts', contacts)
  const opportunityRows = rowsOrReport('opportunities', opportunities)
  const emailRows = rowsOrReport('emails', emails)

  return {
    customers: (customerRows as Row[]).map((r) => ({
      id: r.id as string,
      name: (r.name ?? '') as string,
      display_name: (r.display_name ?? null) as string | null,
      status: (r.core_status ?? null) as string | null,
      domain: null,
      logo_url: null,
      customer_status: null,
      chain_type: null,
      routing_aliases: null,
      is_potential: String(r.core_status ?? '').toLowerCase() === 'potential',
    })),
    contacts: (contactRows as Row[]).map(toBuyer),
    opportunities: (opportunityRows as Row[]).map(toOpportunity),
    emails: (emailRows as Row[]).map(toEmail),
  }
}

// ---------------------------------------------------------------------------
// Overview + Sidebar server aggregates (Phase 7A/7B)
//
// These replace the seven unbounded list fetches that useCrmStatsQuery used to
// run. Every number is now computed in the database by a purpose-built,
// browser-safe contract (see docs/overview-aggregate-inventory.md and
// shared-db migrations 20260812130000 / 20260812211000).
//
// The groups are deliberately separate calls: an email-domain outage must not
// blank the people/pipeline/work KPIs, and each bounded panel is independently
// callable. Every contract is hard-gated on app.has_app_access('crm') and
// raises insufficient_privilege rather than returning an empty result, so a
// permission failure surfaces loudly instead of reading as "zero".
//
// Email-derived contracts intentionally read the newest 500 messages, exactly
// matching the window the browser used before. Widening it is separate work.
// ---------------------------------------------------------------------------
export interface CrmOverviewCounts {
  customers: number
  contacts: number
  openOpportunities: number
  meetings: number
  openTasks: number
  pendingApprovals: number
}

export interface CrmOverviewEmailCounts {
  total: number
  needsRouting: number
  routed: number
  skipped: number
  companyOnly: number
  companyDept: number
  unrouted: number
  noCompany: number
  other: number
}

export interface CrmOverviewStageCount {
  stage: string
  count: number
}

export interface CrmOverviewVolumeWeek {
  weekStart: string
  ingested: number
  routed: number
}

export interface CrmOverviewRecentEmail {
  id: string
  subject: string | null
  sender: string | null
  routing_status: string | null
}

export interface CrmOverviewRecentMeeting {
  id: string
  name: string | null
  company: { id: string; name: string | null } | null
  date: string | null
}

export interface CrmOverviewPendingApproval {
  id: string
  name: string | null
  property_name: string | null
  opportunity: { id: string; name: string | null } | null
  stage: string | null
}

// bigint columns arrive as JSON numbers (or strings on very large values);
// normalize once so no caller has to guess.
function count(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : 0
}

async function overviewRows(fn: string, args?: Row): Promise<Row[]> {
  const { data, error } = await anyDb.schema('api').rpc(fn, args ?? {})
  if (error) throw error
  return (Array.isArray(data) ? data : data ? [data] : []) as Row[]
}

export async function fetchOverviewCounts(): Promise<CrmOverviewCounts> {
  const [row = {}] = await overviewRows('crm_overview_counts')
  return {
    customers: count(row.customers),
    contacts: count(row.contacts),
    openOpportunities: count(row.open_opportunities),
    meetings: count(row.meetings),
    openTasks: count(row.open_tasks),
    pendingApprovals: count(row.pending_approvals),
  }
}

export async function fetchOverviewEmailCounts(): Promise<CrmOverviewEmailCounts> {
  const [row = {}] = await overviewRows('crm_overview_email_counts')
  return {
    total: count(row.total),
    needsRouting: count(row.needs_routing),
    routed: count(row.routed),
    skipped: count(row.skipped),
    companyOnly: count(row.company_only),
    companyDept: count(row.company_dept),
    unrouted: count(row.unrouted),
    noCompany: count(row.no_company),
    other: count(row.other),
  }
}

export async function fetchOverviewPipelineStages(): Promise<CrmOverviewStageCount[]> {
  const rows = await overviewRows('crm_overview_pipeline_stages')
  return rows.map((r) => ({ stage: (r.stage ?? '') as string, count: count(r.count) }))
}

export async function fetchOverviewEmailVolume(weeks = 12): Promise<CrmOverviewVolumeWeek[]> {
  const rows = await overviewRows('crm_overview_email_volume', { p_weeks: weeks })
  return rows.map((r) => ({
    weekStart: (r.week_start ?? '') as string,
    ingested: count(r.ingested),
    routed: count(r.routed),
  }))
}

export async function fetchOverviewRecentUnrouted(limit = 6): Promise<CrmOverviewRecentEmail[]> {
  const rows = await overviewRows('crm_overview_recent_unrouted', { p_limit: limit })
  return rows.map((r) => ({
    id: r.id as string,
    subject: (r.subject ?? null) as string | null,
    sender: (r.sender ?? null) as string | null,
    routing_status: (r.routing_status ?? null) as string | null,
  }))
}

export async function fetchOverviewRecentMeetings(limit = 6): Promise<CrmOverviewRecentMeeting[]> {
  const rows = await overviewRows('crm_overview_recent_meetings', { p_limit: limit })
  return rows.map((r) => ({
    id: r.id as string,
    name: (r.name ?? null) as string | null,
    company: rel(r.company_id, r.company_name) as { id: string; name: string | null } | null,
    date: (r.date ?? null) as string | null,
  }))
}

export async function fetchOverviewPendingApprovals(limit = 6): Promise<CrmOverviewPendingApproval[]> {
  const rows = await overviewRows('crm_overview_pending_approvals', { p_limit: limit })
  return rows.map((r) => ({
    id: r.id as string,
    name: (r.name ?? null) as string | null,
    property_name: (r.property_name ?? null) as string | null,
    opportunity: rel(r.opportunity_id, r.opportunity_name) as { id: string; name: string | null } | null,
    stage: (r.stage ?? null) as string | null,
  }))
}
