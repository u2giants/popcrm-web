import { readItems, updateItem } from '@directus/sdk'
import { directus } from '@/lib/directus'
import type {
  Buyer,
  CrmEmailMessage,
  CrmMeetingNote,
  CrmOpportunity,
  Retailer,
} from '@/lib/types'

export const OPPORTUNITY_STAGES = [
  'DIRECTIVE_RECEIVED',
  'DESIGN_IN_PROGRESS',
  'BUYER_REVIEW',
  'PRICING_AND_SAMPLING',
  'AWAITING_SALES_ORDER',
  'IN_PRODUCTION',
  'SHIPPED',
  'CLOSED',
] as const

export function label(value: string | null | undefined) {
  if (!value) return 'Unspecified'
  return value.toLowerCase().split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')
}

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

export async function fetchRetailers(limit = 300): Promise<Retailer[]> {
  return directus.request(
    readItems('retailer', {
      fields: ['id', 'name', 'domain', 'customer_status', 'chain_type', 'routing_aliases'],
      sort: ['name'],
      limit,
    }),
  ) as Promise<Retailer[]>
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
        { retailer: ['id', 'name'] },
        { department: ['id', 'name'] },
        { contact: ['id', 'name', 'email'] },
      ],
      sort: ['-date'],
      limit,
    }),
  ) as Promise<CrmMeetingNote[]>
}

export function relatedName(value: string | { name?: string | null; title?: string | null } | null | undefined) {
  if (!value) return '—'
  if (typeof value === 'string') return '—'
  return value.name || value.title || '—'
}
