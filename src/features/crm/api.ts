import { createItem, readItems, updateItem } from '@directus/sdk'
import { directus } from '@/lib/directus'
import type {
  CrmAiModelConfig,
  Buyer,
  CrmDepartment,
  CrmEmailMessage,
  CrmIgnoreRule,
  CrmLicensorApprovalThread,
  CrmMeetingNote,
  CrmNote,
  CrmOpportunity,
  CrmTask,
  Retailer,
} from '@/lib/types'

export async function fetchOpportunities(): Promise<CrmOpportunity[]> {
  return directus.request(
    readItems('crm_opportunity', {
      fields: [
        'id',
        'name',
        'amount',
        'close_date',
        'stage',
        'program_type',
        'season_year',
        'division',
        'production_po_number',
        'sales_order_number',
        'hard_delivery_date',
        'ai_summary',
        'ai_state',
        { retailer: ['id', 'name', 'customer_status'] },
        { contact: ['id', 'name', 'email'] },
        { department: ['id', 'name'] },
        { factory: ['id', 'name'] },
        { project: ['id', 'title'] },
      ],
      sort: ['stage', 'name'],
      limit: -1,
    }),
  ) as Promise<CrmOpportunity[]>
}

export async function setOpportunityStage(id: string, stage: string) {
  return directus.request(updateItem('crm_opportunity', id, { stage }))
}

export async function updateOpportunity(id: string, values: Partial<CrmOpportunity>) {
  return directus.request(updateItem('crm_opportunity', id, values as never))
}

export async function fetchRetailers(limit = 300): Promise<Retailer[]> {
  return directus.request(
    readItems('retailer', {
      fields: ['id', 'name', 'domain', 'customer_status', 'chain_type', 'routing_aliases'],
      sort: ['name'],
      limit,
    }),
  ) as Promise<Retailer[]>
}

export async function updateRetailer(id: string, values: Partial<Retailer>) {
  return directus.request(updateItem('retailer', id, values as never))
}

export async function fetchBuyers(limit = 300): Promise<Buyer[]> {
  return directus.request(
    readItems('buyer', {
      fields: [
        'id',
        'name',
        'email',
        'phone',
        'job_title',
        'contact_type',
        'scope',
        { retailer: ['id', 'name'] },
        { department: ['id', 'name'] },
      ],
      sort: ['name'],
      limit,
    }),
  ) as Promise<Buyer[]>
}

export async function updateBuyer(id: string, values: Partial<Buyer>) {
  return directus.request(updateItem('buyer', id, values as never))
}

export async function fetchDepartments(limit = -1): Promise<CrmDepartment[]> {
  return directus.request(
    readItems('crm_department', {
      fields: [
        'id',
        'name',
        'category',
        'division',
        'active',
        { retailer: ['id', 'name'] },
        { primary_buyer: ['id', 'name', 'email'] },
      ],
      sort: ['name'],
      limit,
    }),
  ) as Promise<CrmDepartment[]>
}

export async function fetchEmailMessages(limit = 300): Promise<CrmEmailMessage[]> {
  return directus.request(
    readItems('crm_email_message', {
      fields: [
        'id',
        'subject',
        'sender',
        'recipients',
        'received_at',
        'routing_status',
        'routing_method',
        'body_preview',
        { retailer: ['id', 'name'] },
        { department: ['id', 'name'] },
        { opportunity: ['id', 'name', 'stage'] },
      ],
      sort: ['-received_at'],
      limit,
    }),
  ) as Promise<CrmEmailMessage[]>
}

export async function updateEmailMessage(id: string, values: Partial<CrmEmailMessage>) {
  return directus.request(updateItem('crm_email_message', id, values as never))
}

export async function fetchMeetingNotes(limit = 100): Promise<CrmMeetingNote[]> {
  return directus.request(
    readItems('crm_meeting_note', {
      fields: [
        'id',
        'name',
        'date',
        'participants',
        'summary',
        'action_items',
        'source',
        'fireflies_transcript_id',
        { retailer: ['id', 'name'] },
        { department: ['id', 'name'] },
        { contact: ['id', 'name', 'email'] },
      ],
      sort: ['-date'],
      limit,
    }),
  ) as Promise<CrmMeetingNote[]>
}

export async function fetchIgnoreRules(): Promise<CrmIgnoreRule[]> {
  return directus.request(
    readItems('crm_ignore_rule', {
      fields: ['id', 'name', 'pattern', 'match_type', 'emails_skipped'],
      sort: ['name'],
      limit: -1,
    }),
  ) as Promise<CrmIgnoreRule[]>
}

export async function createIgnoreRule(values: Partial<CrmIgnoreRule>) {
  return directus.request(createItem('crm_ignore_rule', values as never)) as Promise<CrmIgnoreRule>
}

export async function fetchAiModelConfigs(): Promise<CrmAiModelConfig[]> {
  return directus.request(
    readItems('crm_ai_model_config', {
      fields: ['id', 'name', 'email_routing_model', 'fireflies_routing_model', 'transcript_split_model', 'opportunity_summary_model'],
      sort: ['name'],
      limit: -1,
    }),
  ) as Promise<CrmAiModelConfig[]>
}

export async function updateAiModelConfig(id: string, values: Partial<CrmAiModelConfig>) {
  return directus.request(updateItem('crm_ai_model_config', id, values as never))
}

export async function fetchNotes(limit = 200): Promise<CrmNote[]> {
  return directus.request(
    readItems('crm_note', {
      fields: [
        'id',
        'title',
        'body',
        'action_items',
        'source',
        'fireflies_transcript_id',
        { retailer: ['id', 'name'] },
        { contact: ['id', 'name', 'email'] },
        { opportunity: ['id', 'name', 'stage'] },
        { department: ['id', 'name'] },
      ],
      sort: ['-id'],
      limit,
    }),
  ) as Promise<CrmNote[]>
}

export async function createNote(values: Partial<CrmNote>) {
  return directus.request(createItem('crm_note', values as never)) as Promise<CrmNote>
}

export async function updateNote(id: string, values: Partial<CrmNote>) {
  return directus.request(updateItem('crm_note', id, values as never))
}

export async function fetchTasks(limit = 200): Promise<CrmTask[]> {
  return directus.request(
    readItems('crm_task', {
      fields: [
        'id',
        'title',
        'body',
        'status',
        'due_at',
        { retailer: ['id', 'name'] },
        { contact: ['id', 'name', 'email'] },
        { opportunity: ['id', 'name', 'stage'] },
        { department: ['id', 'name'] },
        { assignee: ['id', 'first_name', 'last_name', 'email'] },
      ],
      sort: ['status', 'due_at'],
      limit,
    }),
  ) as Promise<CrmTask[]>
}

export async function createTask(values: Partial<CrmTask>) {
  return directus.request(createItem('crm_task', values as never)) as Promise<CrmTask>
}

export async function updateTask(id: string, values: Partial<CrmTask>) {
  return directus.request(updateItem('crm_task', id, values as never))
}

export async function fetchApprovalThreads(limit = 200): Promise<CrmLicensorApprovalThread[]> {
  return directus.request(
    readItems('crm_licensor_approval_thread', {
      fields: ['id', 'name', 'property_name', 'stage', 'submitted_date', 'response_date', 'due_date', 'licensor_comments', { opportunity: ['id', 'name', 'stage'] }],
      sort: ['stage', '-submitted_date'],
      limit,
    }),
  ) as Promise<CrmLicensorApprovalThread[]>
}

export async function updateApprovalThread(id: string, values: Partial<CrmLicensorApprovalThread>) {
  return directus.request(updateItem('crm_licensor_approval_thread', id, values as never))
}
