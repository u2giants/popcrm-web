export interface DirectusUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar: string | null
  role: { id: string; name: string } | null
}

export interface Retailer {
  id: string
  name: string
  domain: string | null
  customer_status: string | null
  chain_type: string | null
  routing_aliases: string | null
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
  assignee: string | DirectusUser | null
}

export interface CrmLicensorApprovalThread {
  id: string
  name: string | null
  licensor_name: string | null
  approval_status: string | null
  submitted_at: string | null
  approved_at: string | null
  latest_comment: string | null
  opportunity: string | CrmOpportunity | null
}

export interface Schema {
  retailer: Retailer[]
  buyer: Buyer[]
  factory: Factory[]
  project: Project[]
  crm_department: CrmDepartment[]
  crm_opportunity: CrmOpportunity[]
  crm_email_message: CrmEmailMessage[]
  crm_meeting_note: CrmMeetingNote[]
  crm_ignore_rule: CrmIgnoreRule[]
  crm_ai_model_config: CrmAiModelConfig[]
  crm_note: CrmNote[]
  crm_task: CrmTask[]
  crm_licensor_approval_thread: CrmLicensorApprovalThread[]
  directus_users: DirectusUser[]
}
