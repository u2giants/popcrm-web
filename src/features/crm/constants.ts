// Domain constants and status→presentation mappings for the CRM.
// Keep these token-driven (no ad-hoc Tailwind colors): badge variants and
// stage chip classes map to the shared design tokens in src/index.css.

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

export const APPROVAL_STATUSES = [
  'PENDING',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'REVISION_REQUESTED',
] as const

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

export function approvalTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    case 'REVISION_REQUESTED':
      return 'warning'
    case 'SUBMITTED':
      return 'info'
    default:
      return 'neutral'
  }
}

export const WORKER_CADENCE = [
  { label: 'Outlook ingest', cadence: 'every 15 min' },
  { label: 'Reroute pass', cadence: 'every 6 hours' },
  { label: 'Contact sync', cadence: 'daily' },
  { label: 'Opportunity summaries', cadence: 'every 6 hours' },
] as const

export const FIREFLIES_HEALTH_URL = 'https://crm-fireflies.designflow.app/health'
