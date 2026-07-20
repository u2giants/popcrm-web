// Domain constants and status→presentation mappings for the CRM.
// Keep these token-driven (no ad-hoc Tailwind colors): badge variants and
// stage chip classes map to the shared design tokens in src/index.css.
import { label } from './format'

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

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number]

export const ROUTING_STATUSES = [
  'UNROUTED',
  'COMPANY_ONLY',
  'COMPANY_DEPT',
  'CUSTOMER_EMAIL_NO_COMPANY',
  'ROUTED',
  'SKIPPED',
] as const

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const

// Imported legacy choices for retailer.customer_status / retailer.chain_type.
// Order = display order.
export const CUSTOMER_STATUSES = [
  'ACTIVE_CUSTOMER',
  'POTENTIAL_CUSTOMER',
  'OTHER',
  'UNASSIGNED',
] as const

export const CHAIN_TYPES = [
  'OFF_PRICE',
  'SPECIALTY',
  'VALUE',
  'MASS_MARKET',
  'GROCERY_DRUG',
  'ECOM',
  'CLUB',
  'OTHER',
] as const

// Customer-status display labels. Context-specific (NOT global label() overrides):
// `OTHER` means "Other" for chain_type/contact_type, but "Not a Customer" here.
// `UNASSIGNED`, empty and null all collapse to the single "New Company" bucket.
export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  ACTIVE_CUSTOMER: 'Active Customer',
  POTENTIAL_CUSTOMER: 'Potential Customer',
  OTHER: 'Not a Customer',
  UNASSIGNED: 'New Company',
}

export function customerStatusLabel(status: string | null | undefined): string {
  if (!status) return 'New Company'
  return CUSTOMER_STATUS_LABEL[status] ?? label(status)
}

// Customer status → badge tone. Green = active customer, yellow = potential,
// blue = New Company (untriaged, needs review), gray = Not a Customer
// (reviewed, no CRM action needed). No red — none of these is an alert.
export function customerStatusTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case 'ACTIVE_CUSTOMER':
      return 'success'
    case 'POTENTIAL_CUSTOMER':
      return 'warning'
    case 'OTHER':
      return 'neutral'
    default:
      // UNASSIGNED / empty / null = New Company
      return 'info'
  }
}

// Each chain type gets a distinct OKLCH hue so the chips read apart at a glance.
export const CHAIN_HUE: Record<string, number> = {
  OFF_PRICE: 25,
  SPECIALTY: 300,
  VALUE: 145,
  MASS_MARKET: 255,
  GROCERY_DRUG: 95,
  ECOM: 200,
  CLUB: 340,
  OTHER: 60,
}

export const MATCH_TYPES = ['CONTAINS', 'STARTS_WITH', 'EXACT'] as const

export const AI_MODELS = [
  'GPT_5_4',
  'GPT_5_4_MINI',
  'GPT_5_4_NANO',
  'GEMINI_3_1_PRO',
  'GEMINI_3_FLASH',
  'GEMINI_3_1_FLASH_LITE',
  'GEMINI_3_1_FLASH_IMAGE',
  'GEMINI_2_FLASH',
  'CLAUDE_SONNET_4_6',
  'CLAUDE_HAIKU_4_5',
] as const

export const AI_MODEL_FIELDS = [
  'email_routing_model',
  'fireflies_routing_model',
  'transcript_split_model',
  'opportunity_summary_model',
] as const

// A message still needs human routing unless it is fully ROUTED or SKIPPED.
export function needsRouting(status: string | null | undefined) {
  return !!status && status !== 'ROUTED' && status !== 'SKIPPED'
}

// Map a pipeline stage to the token-backed stage-chip palette (see index.css).
export function stageChipClass(stage: string | null | undefined): string {
  switch (stage) {
    case 'DIRECTIVE_RECEIVED':
      return 'bg-stage-dev text-stage-dev-fg'
    case 'DESIGN_IN_PROGRESS':
      return 'bg-stage-concept text-stage-concept-fg'
    case 'BUYER_REVIEW':
      return 'bg-stage-review text-stage-review-fg'
    case 'PRICING_AND_SAMPLING':
      return 'bg-stage-onhold text-stage-onhold-fg'
    case 'AWAITING_SALES_ORDER':
      return 'bg-stage-production text-stage-production-fg'
    case 'IN_PRODUCTION':
      return 'bg-stage-approved text-stage-approved-fg'
    case 'SHIPPED':
      return 'bg-stage-shipped text-stage-shipped-fg'
    case 'CLOSED':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

// Generic tone for a status string, used by CrmStatusBadge. Tone → token classes
// live in CrmStatusBadge so color stays centralized.
export function routingTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case 'ROUTED':
      return 'success'
    case 'SKIPPED':
      return 'neutral'
    case 'COMPANY_ONLY':
    case 'COMPANY_DEPT':
      return 'info'
    case 'UNROUTED':
    case 'CUSTOMER_EMAIL_NO_COMPANY':
      return 'danger'
    default:
      return 'warning'
  }
}

export function taskTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case 'DONE':
      return 'success'
    case 'IN_PROGRESS':
      return 'info'
    case 'CANCELED':
      return 'neutral'
    default:
      return 'warning'
  }
}

// The approval `stage` is a free-form legacy string (no fixed enum), so
// tone is matched on keywords rather than exact values.
export function approvalTone(stage: string | null | undefined): StatusTone {
  const s = (stage ?? '').toLowerCase()
  if (/(approv|complete|signed)/.test(s)) return 'success'
  if (/(reject|declin|denied)/.test(s)) return 'danger'
  if (/(revis|hold|change)/.test(s)) return 'warning'
  if (/(submit|review|pending|sent)/.test(s)) return 'info'
  return 'neutral'
}

// An approval is "resolved" once its stage reads as approved/rejected/closed.
export function isApprovalResolved(stage: string | null | undefined): boolean {
  const s = (stage ?? '').toLowerCase()
  return /(approv|reject|declin|denied|complete|closed|signed)/.test(s)
}

export const WORKER_CADENCE = [
  { label: 'Outlook ingest', cadence: 'every 15 min' },
  { label: 'Reroute pass', cadence: 'every 6 hours' },
  { label: 'Contact sync', cadence: 'daily' },
  { label: 'Opportunity summaries', cadence: 'every 6 hours' },
] as const

export const FIREFLIES_HEALTH_URL = 'https://crm-fireflies.designflow.app/health'
