// App identity, sourced from Supabase Auth + app.profile (via api.current_user_profile).
// Field names kept Directus-compatible (first_name/last_name/avatar/role) so existing
// UI (AppHeader, EmailRoutingPage, relatedName) keeps working unchanged.
export interface AppUser {
  id: string
  name?: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar: string | null
  title?: string | null
  role: { id: string; name: string } | null
  roles?: string[]
}

// Admin-only user directory row from api.crm_admin_user_list() — powers the
// "Impersonate / view as" picker. Not the signed-in identity (that is AppUser).
export interface AdminUserSummary {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  status: string | null
  roles: string[]
  apps: string[]
  crm_access: boolean
}

export interface Retailer {
  id: string
  name: string
  domain: string | null
  logo_url?: string | null
  customer_status: string | null
  chain_type: string | null
  routing_aliases: string | null
  is_potential?: boolean | null
}

export interface CrmIngestedDomain {
  id: string
  domain: string
  display_name: string | null
  status: string | null
  email_count: number | null
  first_seen_at: string | null
  last_seen_at: string | null
  last_sender: string | null
  sample_subject: string | null
  promoted_customer_id: string | null
  promoted_company_name: string | null
  updated_at: string | null
}

export interface Buyer {
  id: string
  name: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  job_title: string | null
  contact_type: string | null
  scope: string | null
  retailer: string | Retailer | null
  department: string | CrmDepartment | null
}

export interface Factory {
  id: string
  name: string
  location: string | null
  contact_name: string | null
  contact_email: string | null
}

export interface Project {
  id: string
  title: string | null
}

export interface CrmDepartment {
  id: string
  name: string
  category: string | null
  division: string | null
  active: boolean | null
  retailer: string | Retailer | null
  primary_buyer: string | Buyer | null
}

export interface CrmOpportunity {
  id: string
  name: string | null
  amount: string | number | null
  close_date: string | null
  stage: string | null
  program_type: string | null
  season_year: string | null
  division: string | null
  production_po_number: string | null
  sales_order_number: string | null
  hard_delivery_date: string | null
  ai_summary: string | null
  ai_state: string | null
  retailer: string | Retailer | null
  contact: string | Buyer | null
  department: string | CrmDepartment | null
  factory: string | Factory | null
  project: string | Project | null
}

export interface CrmEmailMessage {
  id: string
  subject: string | null
  sender: string | null
  recipients: string | null
  received_at: string | null
  routing_status: string | null
  routing_method: string | null
  body_preview: string | null
  retailer: string | Retailer | null
  department: string | CrmDepartment | null
  opportunity: string | CrmOpportunity | null
}

export interface CrmMeetingNote {
  id: string
  name: string | null
  date: string | null
  participants: string | null
  summary: string | null
  action_items: string | null
  source: string | null
  fireflies_transcript_id: string | null
  retailer: string | Retailer | null
  department: string | CrmDepartment | null
  contact: string | Buyer | null
}

export interface CrmIgnoreRule {
  id: string
  name: string | null
  pattern: string | null
  match_type: string | null
  emails_skipped: number | null
}

export interface CrmAiModelConfig {
  id: string
  name: string | null
  email_routing_model: string | null
  fireflies_routing_model: string | null
  transcript_split_model: string | null
  opportunity_summary_model: string | null
}

export interface CrmNote {
  id: string
  title: string | null
  body: string | null
  action_items: string | null
  source: string | null
  fireflies_transcript_id: string | null
  retailer: string | Retailer | null
  contact: string | Buyer | null
  opportunity: string | CrmOpportunity | null
  department: string | CrmDepartment | null
}

export interface CrmTask {
  id: string
  title: string | null
  body: string | null
  status: string | null
  due_at: string | null
  retailer: string | Retailer | null
  contact: string | Buyer | null
  opportunity: string | CrmOpportunity | null
  department: string | CrmDepartment | null
  assignee: string | AppUser | null
}

export interface CrmLicensorApprovalThread {
  id: string
  name: string | null
  property_name: string | null
  stage: string | null
  submitted_date: string | null
  response_date: string | null
  due_date: string | null
  licensor_comments: string | null
  opportunity: string | CrmOpportunity | null
}
