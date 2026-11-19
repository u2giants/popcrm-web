// CRM companion worker for the shared Supabase backend.
//
// This file is the active runtime for POP CRM host workers and the Fireflies
// webhook/chat server. It lives in popcrm-web so the retired backend can remain
// legacy rollback/reference context only.
//
// Legacy collection/field mapping into shared Supabase:
//   retailer / ingested_domains -> core.customer       (customers = customer_status in ACTIVE/POTENTIAL)
//   buyer / ingested_contact    -> core.contact (+ core.contact_company for scope/type/department)
//   crm_department              -> crm.department      (retailer->company_id, primary_buyer->primary_contact_id)
//   crm_opportunity             -> crm.opportunity     (retailer->company_id, department->department_id, project->project_id)
//   crm_email_message           -> crm.email_message   (retailer->company_id, department->department_id, opportunity->opportunity_id)
//   crm_meeting_note            -> crm.meeting_note     (name->title, date->meeting_at, summary->body)
//   crm_ignore_rule             -> crm.ignore_rule
//   crm_ai_model_config         -> crm.ai_model_config
//   crm_meeting_note_attendee   -> (no shared table yet) stored as participants text + metadata
//
// Commands:
//   outlook-ingest | reroute | fireflies-server | contact-sync | summarize | apply-ignore-rules
//
// Env:
//   SUPABASE_URL=https://tcscehehgeiijilylezv.supabase.co   (preview first)
//   SUPABASE_SERVICE_ROLE_KEY=<server-only>                 (NEVER expose to the browser)
//   MS_TENANT_ID/MS_CLIENT_ID/MS_CLIENT_SECRET or AZURE_* ; OUTLOOK_MAILBOX ; OUTLOOK_GATED
//   FIREFLIES_API_KEY, FIREFLIES_WEBHOOK_SECRET, OPENROUTER_API_KEY, PORT=8787
//   SCALEDOWN_API_KEY, SCALEDOWN_ROUTING_MIN_CONFIDENCE (email routing fallback)
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import {
  createUserScopedSupabaseClient,
  createWorkerBoundaries,
  domainCandidates,
  domainOf,
  extractAddresses,
  normalizeFirefliesWebhookPayload,
  normalizeSubject,
  fetchWithPolicy,
  resolveHttpBodyLimits,
  resolveUpstreamSettings,
  respondToOpportunityChatRequest,
  mayReroute,
  validateCommandEnvironment,
} from './lib/worker-foundation.mjs'
import {
  SCALEDOWN_URL,
  buildScaledownRoutingRequest,
  pickScaledownRetailer,
  resolveScaledownMinConfidence,
  retailerOptions,
} from './lib/scaledown-router.mjs'

let SUPABASE_URL
let SERVICE_ROLE_KEY
let sb
let crm
let core
let httpBodyLimits
let upstreamSettings
let scaledownMinConfidence
let runtimeEnv = process.env
let boundaries = createWorkerBoundaries()

function loadEnvironmentFile(env = process.env) {
  if (!env.POPPIM_ENV_FILE) return
  for (const line of readFileSync(env.POPPIM_ENV_FILE, 'utf8').split('\n')) {
    const s = line.trim()
    if (!s || s.startsWith('#') || !s.includes('=')) continue
    const i = s.indexOf('=')
    const k = s.slice(0, i).trim()
    let v = s.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (env[k] === undefined) env[k] = v
  }
}

export function initializeRuntime(env = process.env, overrides = {}) {
  // `supabaseClient` swaps the real client for an injected one (tests); every
  // other override feeds the boundaries object as before.
  const { supabaseClient, ...boundaryOverrides } = overrides
  runtimeEnv = env
  SUPABASE_URL = env.SUPABASE_URL
  SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
  boundaries = createWorkerBoundaries(boundaryOverrides)
  sb = supabaseClient || createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket },
  })
  crm = (table) => sb.schema('crm').from(table)
  core = (table) => sb.schema('core').from(table)
  upstreamSettings = resolveUpstreamSettings(env)
  scaledownMinConfidence = resolveScaledownMinConfidence(env.SCALEDOWN_ROUTING_MIN_CONFIDENCE)
  if (!boundaryOverrides.graphCursorStore) {
    boundaries.graphCursorStore = createGraphCursorStore(sb)
  }
  // A fresh runtime must not serve a previous run's cached reference data.
  referenceCache.clear()
}

function upstreamFetch(operation, url, init, { timeoutMs, retryTransient = false } = {}) {
  return fetchWithPolicy(boundaries.fetch, url, init, {
    operation,
    timeoutMs,
    retryTransient,
    maxAttempts: retryTransient ? upstreamSettings.UPSTREAM_MAX_ATTEMPTS : 1,
    baseDelayMs: upstreamSettings.UPSTREAM_RETRY_BASE_DELAY_MS,
    maxDelayMs: upstreamSettings.UPSTREAM_RETRY_MAX_DELAY_MS,
    retryWaitBudgetMs: upstreamSettings.UPSTREAM_RETRY_WAIT_BUDGET_MS,
  })
}

const must = (res) => { if (res.error) throw new Error(res.error.message); return res.data }

// PostgREST enforces a server-side row ceiling (db-max-rows), so a single
// .limit(100000) silently returns only the first page and the rest of the
// table is never seen. Every full-table read pages explicitly instead.
//
// Paging is keyset, not offset: reroute and applyIgnoreRules update the very
// rows their own filter selects, and each committed update shifts every later
// row up one offset, so offset paging would jump past exactly as many rows as
// the job just changed. Seeking on the last id read is immune to that and to
// concurrently ingested rows. buildQuery must return a fresh builder per call.
//
// ROW_PAGE_SIZE stays below the server ceiling so that a short page always
// means "end of table" and never "the server truncated us".
const ROW_PAGE_SIZE = 500
async function fetchAllRows(buildQuery, { keyColumn = 'id', pageSize = ROW_PAGE_SIZE } = {}) {
  const rows = []
  let after = null
  for (;;) {
    let q = buildQuery().order(keyColumn, { ascending: true }).limit(pageSize)
    if (after !== null) q = q.gt(keyColumn, after)
    let res = await q
    // A statement timeout under transient database load is retried with backoff.
    for (let attempt = 1; res.error && /statement timeout/i.test(res.error.message) && attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 5000 * attempt))
      q = buildQuery().order(keyColumn, { ascending: true }).limit(pageSize)
      if (after !== null) q = q.gt(keyColumn, after)
      res = await q
    }
    const page = must(res)
    rows.push(...page)
    if (page.length < pageSize) return rows
    after = page[page.length - 1][keyColumn]
  }
}

// Routing reads the same reference data (ignore rules, the customer list) for
// every single message. That was invisible while a run only ever saw ~1000
// messages; now that paging is fixed, reroute walks 12k+ and the repeat reads
// dominate its runtime. Cache them briefly: long enough to make a batch run
// cheap, short enough that live ingest still picks up an edit made minutes ago.
const REFERENCE_TTL_MS = 60_000
const referenceCache = new Map()
async function cachedReference(key, load) {
  const now = Date.now()
  const hit = referenceCache.get(key)
  if (hit && now - hit.at < REFERENCE_TTL_MS) return hit.value
  // Per-domain keys make this map unbounded in the long-running
  // fireflies-server, so drop expired entries whenever we miss.
  for (const [k, entry] of referenceCache) if (now - entry.at >= REFERENCE_TTL_MS) referenceCache.delete(k)
  const value = await load()
  referenceCache.set(key, { at: Date.now(), value })
  return value
}

const AMBIGUOUS_DOMAIN = Symbol('ambiguous customer domain')
const INTERNAL_DOMAIN = 'popcre.com'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const LOGIN_BASE = 'https://login.microsoftonline.com'
const PAGE_SIZE = 50
const GRAPH_HOST = 'graph.microsoft.com'
const OUTLOOK_CURSOR_PURPOSE = 'microsoft-graph-mail-delta'
const OUTLOOK_CURSOR_CONCURRENCY_RETRY_MAX = 2
// A message is retried on later ingest runs up to this many attempts before it
// is quarantined (recorded and skipped) so the cursor can advance.
const OUTLOOK_MESSAGE_FAILURE_LIMIT = 3
const DEFAULT_OUTLOOK_QUARANTINE_FILE = '/home/ai/.crm-worker-outlook-quarantine.json'
const OUTLOOK_QUARANTINE_ERROR_MAX = 500
const FIREFLIES_BASE = 'https://api.fireflies.ai/graphql'
const CUSTOMERS = ['ACTIVE_CUSTOMER', 'POTENTIAL_CUSTOMER']

const NOISE_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'clickup.com',
  'teams.mail.microsoft.com', 'fireflies.ai', 'sharepointonline.com', 'avanan-mail.net',
])
const NOISE_PREFIXES = ['notification.', 'news.', 'nl.']
const CONTACT_SYNC_NOISE_DOMAINS = new Set([
  ...NOISE_DOMAINS, 'live.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com', 'msn.com',
  'ymail.com', 'googlemail.com', 'protonmail.com', 'proton.me', 'zoho.com', 'mail.com',
  'gmx.com', 'fastmail.com',
])
const NOISE_SENDER_PATTERNS = ['no-reply@', 'noreply@', 'donotreply@', 'notifications@', 'support@', 'billing@']
const PO_PATTERN = /\b([DS]\d{4})\b/gi
const DEFAULT_SO_PATTERNS = [
  /\bSO[\s#?-]?(\d{5,12})\b/gi,
  /\bSales\s+Order[\s:#?-]*(\d{5,12})\b/gi,
  /\bOrder\s*[:#]?\s*(\d{6,12})\b/gi,
]
const DEFAULT_PO_PATTERNS = [
  /\bPO[\s#?-]?(\d{5,12})\b/gi,
  /\bPurchase\s+Order[\s:#?-]*(\d{5,12})\b/gi,
  PO_PATTERN,
]
const NO_CUSTOMER_DOMAIN = 'NO_CUSTOMER_DOMAIN'
const ROUTABLE_STATUSES = ['UNROUTED', 'COMPANY_ONLY', 'COMPANY_DEPT', 'CUSTOMER_EMAIL_NO_COMPANY']
const MODEL_VALUE_MAP = {
  GPT_5_4: 'openai/gpt-5.4', GPT_5_4_MINI: 'openai/gpt-5.4-mini', GPT_5_4_NANO: 'openai/gpt-5.4-nano',
  GEMINI_3_1_PRO: 'google/gemini-3.1-pro-preview', GEMINI_3_FLASH: 'google/gemini-3-flash-preview',
  GEMINI_3_1_FLASH_LITE: 'google/gemini-3.1-flash-lite-preview', GEMINI_3_1_FLASH_IMAGE: 'google/gemini-3.1-flash-image-preview',
  GEMINI_2_FLASH: 'google/gemini-2.0-flash-001', CLAUDE_SONNET_4_6: 'anthropic/claude-sonnet-4-6', CLAUDE_HAIKU_4_5: 'anthropic/claude-haiku-4-5',
}
const SHARED_DOMAIN_RULES = [
  { domain: 'ros.com', subsidiaries: [{ keywords: ['DDS', "DD'S", 'NYBO'], retailerNameFragments: ["DD's", 'DDs'] }] },
]
const COMPANY_NAME_STOPWORDS = new Set([
  'corp', 'inc', 'llc', 'ltd', 'company', 'group', 'holdings', 'enterprises', 'international',
  'global', 'national', 'american', 'retail', 'wholesale', 'trading', 'stores', 'store', 'brands',
  'outlet', 'outlets', 'factory',
])

// --- Pure helpers retained from the legacy worker; no backend coupling --------
function isNoiseDomain(domain) { return NOISE_DOMAINS.has(domain) || NOISE_PREFIXES.some((p) => domain.startsWith(p)) }
function isNoiseSender(address, isCustomerDomain = false) {
  const lower = String(address || '').toLowerCase()
  if (lower.startsWith('info@') && !isCustomerDomain) return true
  return NOISE_SENDER_PATTERNS.some((p) => lower.startsWith(p))
}
function compiledRetailerPatterns(patternText) {
  const out = []
  for (const line of String(patternText || '').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    try { out.push(new RegExp(trimmed, 'gi')) } catch (error) { console.warn(`Invalid retailer S.O. pattern "${trimmed}": ${error.message}`) }
  }
  return out
}
function runNumberPatterns(text, patterns) {
  const found = new Set()
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(String(text || ''))) !== null) {
      const value = String(match[1] || match[0] || '').trim().toUpperCase()
      if (value) found.add(value)
      if (match[0] === '') pattern.lastIndex += 1
    }
  }
  return [...found]
}
function extractOrderNumbers(text, retailerPatterns = '') {
  const custom = compiledRetailerPatterns(retailerPatterns)
  return {
    soNumbers: runNumberPatterns(text, [...DEFAULT_SO_PATTERNS, ...custom]),
    poNumbers: runNumberPatterns(text, [...DEFAULT_PO_PATTERNS, ...custom]),
  }
}
function fuzzyScore(query, target) {
  const tokens = String(query || '').toLowerCase().split(/\W+/).filter((t) => t.length > 2)
  const targetLower = String(target || '').toLowerCase()
  if (!tokens.length) return 0
  return tokens.filter((t) => targetLower.includes(t)).length / tokens.length
}
function companyNameScore(subject, companyName) {
  const tokens = String(companyName || '').toLowerCase().split(/\W+/).filter((t) => t.length >= 4 && !COMPANY_NAME_STOPWORDS.has(t))
  const subjectLower = String(subject || '').toLowerCase()
  if (!tokens.length) return 0
  return tokens.filter((t) => subjectLower.includes(t)).length / tokens.length
}
function resolveModel(stored) { return MODEL_VALUE_MAP[stored] || stored }
function participantAddresses(message) {
  return [
    message.from?.emailAddress?.address,
    ...(message.toRecipients || []).map((r) => r.emailAddress?.address),
    ...(message.ccRecipients || []).map((r) => r.emailAddress?.address),
  ].filter(Boolean).map((x) => x.toLowerCase())
}
function displayNameMap(message) {
  const map = {}
  const add = (e) => { if (e?.address && e?.name) map[e.address.toLowerCase()] = e.name }
  add(message.from?.emailAddress)
  for (const r of message.toRecipients || []) add(r.emailAddress)
  for (const r of message.ccRecipients || []) add(r.emailAddress)
  return map
}
function splitAliases(value) { return String(value || '').split(/[,\n;]/).map((x) => x.trim()).filter(Boolean) }
function aliasMatchesSubject(alias, normalizedSubject) {
  const a = String(alias || '').trim().toLowerCase()
  if (!a || a.includes('@') || a.includes('.')) return false
  return new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(normalizedSubject)
}
function domainToCompanyName(domain) {
  const stem = String(domain || '').split('.')[0] || domain
  return stem.split(/[-_]/).map((p) => p[0]?.toUpperCase() + p.slice(1)).join(' ')
}
function personNameFromEmail(email) {
  return String(email || '').split('@')[0].split(/[._-]/).filter(Boolean).map((p) => p[0]?.toUpperCase() + p.slice(1)).join(' ') || email
}
export function applySharedDomainRule(domain, candidateRows, displayNames) {
  const rule = SHARED_DOMAIN_RULES.find((r) => r.domain === domain)
  if (!rule || candidateRows.length < 2) return null
  const names = Object.values(displayNames || {}).join(' ').toUpperCase()
  for (const subsidiary of rule.subsidiaries) {
    if (!subsidiary.keywords.some((k) => names.includes(k.toUpperCase()))) continue
    const row = candidateRows.find((r) => subsidiary.retailerNameFragments.some((f) => String(r.name || '').toLowerCase().includes(f.toLowerCase())))
    if (row) return row
  }
  return null
}
function pickUniqueBest(scoredRows, threshold) {
  const sorted = scoredRows.filter((r) => r.score >= threshold).sort((a, b) => b.score - a.score)
  if (!sorted.length) return null
  if (sorted.length > 1 && sorted[0].score === sorted[1].score) return null
  return sorted[0].row
}

// --- Supabase query helpers ---------------------------------------------------
// PostgREST `or` clause escapes commas/parens poorly, so candidates are simple
// domain fragments; ilike uses * as the wildcard.
function domainOrClause(candidates) {
  return candidates.flatMap((c) => [`domain.ilike.*${c}*`, `routing_aliases.ilike.*${c}*`]).join(',')
}

async function matchingRetailersByDomain(domain, displayNames = {}) {
  const candidates = domainCandidates(domain)
  if (!candidates.length) return null
  // The candidate rows depend only on the domain, so they are cacheable; only
  // the banner choice below depends on this message's display names. Without
  // this, reroute issued one customer query per message (12k+ per run) and
  // ingest re-queried the same handful of domains all day.
  const rows = await cachedReference(`customers:domain:${domain}`, async () => must(await core('customer')
    .select('id,name,domain,routing_aliases,customer_status')
    .in('customer_status', CUSTOMERS)
    .or(domainOrClause(candidates))
    .limit(20)))
  if (rows.length === 1) return rows[0]
  const banner = candidates.map((c) => applySharedDomainRule(c, rows, displayNames)).find(Boolean)
  if (banner) return banner
  // A domain routed by hand (listed in a customer's routing aliases from the
  // Email Routing page) beats the customer whose own domain merely contains it.
  const routed = rows.filter((r) => splitAliases(r.routing_aliases).some((a) => candidates.includes(a.toLowerCase())))
  if (routed.length === 1) return routed[0]
  // No banner signal — which is normal on reroute, where the stored message has
  // no sender display names to read. Fall back to the customer that owns the
  // domain outright rather than dropping the message; a banner still wins when
  // its own signal is present. Genuinely ambiguous domains (nobody owns it)
  // stay unrouted rather than being guessed at.
  return rows.find((r) => candidates.includes(String(r.domain || '').toLowerCase())) || null
}

async function matchRetailerByAlias(normalizedSubject) {
  const rows = await cachedReference('customers:aliases', async () => must(await core('customer')
    .select('id,name,routing_aliases')
    .in('customer_status', CUSTOMERS)
    .not('routing_aliases', 'is', null)
    .limit(5000)))
  const matches = rows.filter((r) => splitAliases(r.routing_aliases).some((a) => aliasMatchesSubject(a, normalizedSubject)))
  return matches.length === 1 ? matches[0] : null
}

async function matchRetailerByCompanyName(subject) {
  const rows = await cachedReference('customers:names', async () =>
    must(await core('customer').select('id,name').in('customer_status', CUSTOMERS).limit(5000)))
  return pickUniqueBest(rows.map((r) => ({ row: r, score: companyNameScore(subject, r.name) })), 0.7)
}

async function matchRetailerBySubjectHistory(normalizedSubject) {
  if (!normalizedSubject || normalizedSubject.length < 8) return null
  const probe = normalizedSubject.slice(0, 80)
  const rows = must(await crm('email_message')
    .select('id,subject,company_id')
    .in('routing_status', ['ROUTED', 'COMPANY_ONLY', 'COMPANY_DEPT'])
    .not('company_id', 'is', null)
    .ilike('subject', `%${probe}%`)
    .limit(50))
  const ids = [...new Set(rows.filter((r) => normalizeSubject(r.subject).toLowerCase() === normalizedSubject).map((r) => r.company_id).filter(Boolean))]
  return ids.length === 1 ? { id: ids[0] } : null
}

async function findDepartment(retailer, addresses) {
  if (!retailer || !addresses.length) return null
  const contacts = must(await core('contact').select('id').in('email', addresses).limit(500))
  const contactIds = contacts.map((c) => c.id)
  if (!contactIds.length) return null
  const ccs = must(await core('contact_company')
    .select('crm_department_id,scope')
    .eq('company_id', retailer)
    .eq('scope', 'DEPARTMENT')
    .in('contact_id', contactIds)
    .not('crm_department_id', 'is', null)
    .limit(100))
  const deptIds = [...new Set(ccs.map((c) => c.crm_department_id))]
  return deptIds.length === 1 ? deptIds[0] : null
}

export async function matchOpportunity({ retailer, department, searchText }) {
  let retailerPatterns = ''
  if (retailer) {
    const rows = must(await core('customer').select('so_patterns').eq('id', retailer).limit(1))
    retailerPatterns = rows[0]?.so_patterns || ''
  }
  const { soNumbers, poNumbers } = extractOrderNumbers(searchText, retailerPatterns)
  for (const po of poNumbers) {
    let q = crm('opportunity').select('id,company_id,department_id').or(`production_po_number.eq.${po},import_po_number.eq.${po}`).limit(2)
    if (retailer) q = q.eq('company_id', retailer)
    const rows = must(await q)
    if (rows.length === 1) return { method: 'PO_NUMBER', row: { id: rows[0].id, retailer: rows[0].company_id, department: rows[0].department_id } }
  }

  // Every open program is in play when no customer is known, so the read pages
  // through the whole set instead of trusting a single page-limited response.
  const activeRows = await fetchAllRows(() => {
    let q = crm('opportunity').select('id,name,company_id,department_id,sales_order_number,production_po_number').not('stage', 'in', '(CLOSED,SHIPPED)')
    if (retailer) q = q.eq('company_id', retailer)
    return q
  })
  const lowerNumbers = soNumbers.map((x) => x.toLowerCase())
  const so = activeRows.find((r) => r.sales_order_number && lowerNumbers.includes(String(r.sales_order_number).toLowerCase()))
  if (so) return { method: 'SALES_ORDER_NUMBER', row: { id: so.id, retailer: so.company_id, department: so.department_id } }

  const fuzzy = pickUniqueBest(activeRows.map((r) => ({ row: r, score: Math.max(fuzzyScore(searchText, r.name), fuzzyScore(searchText, r.production_po_number)) })), 0.72)
  if (fuzzy) return { method: department ? 'OPPORTUNITY_FUZZY_DEPARTMENT' : 'OPPORTUNITY_FUZZY', row: { id: fuzzy.id, retailer: fuzzy.company_id, department: fuzzy.department_id } }
  return null
}

async function routingModel(task = 'email_routing_model') {
  const rows = must(await crm('ai_model_config').select(`id,${task}`).limit(1))
  return resolveModel(rows[0]?.[task] || 'GEMINI_2_FLASH')
}

// Convert a route result's relation keys to crm.* column names.
function routeColumns(route) {
  const out = {}
  if ('routing_status' in route) out.routing_status = route.routing_status
  if ('routing_method' in route) out.routing_method = route.routing_method
  if ('retailer' in route) out.company_id = route.retailer || null
  if ('department' in route) out.department_id = route.department || null
  if ('opportunity' in route) out.opportunity_id = route.opportunity || null
  return out
}

async function normalizeRoute(route) {
  const out = {
    retailer: null,
    department: null,
    opportunity: null,
    ...route,
  }
  if (out.opportunity) {
    const [opp] = must(await crm('opportunity').select('company_id,department_id').eq('id', out.opportunity).limit(1))
    if (opp) {
      out.retailer = opp.company_id || out.retailer || null
      out.department = opp.department_id || null
      out.routing_status = 'ROUTED'
    }
  }
  if (out.department) {
    const [dept] = must(await crm('department').select('company_id').eq('id', out.department).limit(1))
    if (dept?.company_id) {
      if (!out.retailer) out.retailer = dept.company_id
      if (out.retailer !== dept.company_id) {
        console.warn(`route normalized: dropped department ${out.department} because it belongs to ${dept.company_id}, not ${out.retailer}`)
        out.department = null
        if (!out.opportunity && out.routing_status === 'COMPANY_DEPT') out.routing_status = out.retailer ? 'COMPANY_ONLY' : 'UNROUTED'
      }
    } else {
      out.department = null
      if (!out.opportunity && out.routing_status === 'COMPANY_DEPT') out.routing_status = out.retailer ? 'COMPANY_ONLY' : 'UNROUTED'
    }
  }
  return out
}

let scaledownKeyMissingLogged = false

// Picks a retailer with ScaleDown when the deterministic rules found none.
// Returns a retailer id or null; below-cutoff answers are discarded.
async function scaledownRetailerFallback({ subject, bodyText, addresses }) {
  if (!runtimeEnv.SCALEDOWN_API_KEY?.trim()) {
    if (!scaledownKeyMissingLogged) console.warn('email AI routing disabled: SCALEDOWN_API_KEY is not set')
    scaledownKeyMissingLogged = true
    return null
  }
  const retailers = must(await core('customer').select('id,name,domain').in('customer_status', CUSTOMERS).order('name').limit(1000))
  if (!retailers.length) return null
  const options = retailerOptions(retailers)
  let res
  try {
    res = await upstreamFetch('ScaleDown email routing', SCALEDOWN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': runtimeEnv.SCALEDOWN_API_KEY },
      body: JSON.stringify(buildScaledownRoutingRequest({ subject, bodyText, addresses, options })),
    }, { timeoutMs: upstreamSettings.SCALEDOWN_FETCH_TIMEOUT_MS })
  } catch (error) {
    console.warn(`email AI routing skipped: ${error.message}`)
    return null
  }
  if (!res.ok) {
    console.warn(`email AI routing skipped: ScaleDown HTTP ${res.status}`)
    return null
  }
  let body
  try {
    body = await res.json()
  } catch (error) {
    console.warn(`email AI routing skipped: ScaleDown returned invalid JSON (${error.message})`)
    return null
  }
  return pickScaledownRetailer(body, options, scaledownMinConfidence)
}

async function summarizeOpportunity(opportunityId) {
  if (!opportunityId || !runtimeEnv.OPENROUTER_API_KEY) return false
  const [opportunity] = must(await crm('opportunity').select('id,name,stage,company_id,department_id,production_po_number,sales_order_number,project_id').eq('id', opportunityId).limit(1))
  if (!opportunity) return false
  const emails = must(await crm('email_message').select('subject,sender,received_at,body_preview,routing_method').eq('opportunity_id', opportunityId).order('received_at', { ascending: false }).limit(60))
  if (!emails.length) return false
  const model = await routingModel('opportunity_summary_model')
  const res = await upstreamFetch('OpenRouter opportunity summary', 'https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runtimeEnv.OPENROUTER_API_KEY}`, 'HTTP-Referer': SUPABASE_URL, 'X-Title': 'POP CRM Opportunity Summary' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: ['Summarize this CRM opportunity for a customer manager.', 'Return strict JSON with: summary, nextStep, risk, status, people, actionItems, blockers, decisions, timeline, updatedAt.', 'Preserve active facts from the email history. Keep summary human-readable and concise.'].join(' ') },
        { role: 'user', content: JSON.stringify({ opportunity, emails }) },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  }, { timeoutMs: upstreamSettings.OPENROUTER_FETCH_TIMEOUT_MS })
  if (!res.ok) throw new Error(`OpenRouter opportunity summary failed: HTTP ${res.status}`)
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenRouter opportunity summary returned no content')
  let parsed
  try { parsed = JSON.parse(content) } catch { parsed = { summary: content } }
  must(await crm('opportunity').update({ ai_summary: parsed.summary || content, ai_state: JSON.stringify({ ...parsed, updatedAt: new Date().toISOString() }) }).eq('id', opportunityId))
  return true
}

async function chatOpportunity(opportunityId, question) {
  if (!opportunityId || !question || !runtimeEnv.OPENROUTER_API_KEY) return ''
  const [opportunity] = must(await crm('opportunity').select('id,name,stage,ai_summary,ai_state,company_id,department_id,project_id,production_po_number,sales_order_number').eq('id', opportunityId).limit(1))
  if (!opportunity) return ''
  // Resolve display names (cross-schema, so fetched separately).
  const [company] = opportunity.company_id ? must(await core('customer').select('name').eq('id', opportunity.company_id).limit(1)) : [null]
  const [department] = opportunity.department_id ? must(await crm('department').select('name').eq('id', opportunity.department_id).limit(1)) : [null]
  const context = { ...opportunity, retailer_name: company?.name || null, department_name: department?.name || null }
  const [emails, notes, tasks] = await Promise.all([
    crm('email_message').select('subject,sender,received_at,body_preview,routing_method').eq('opportunity_id', opportunityId).order('received_at', { ascending: false }).limit(40).then(must),
    crm('note').select('title,body,action_items,source').eq('opportunity_id', opportunityId).order('created_at', { ascending: false }).limit(25).then(must),
    crm('task').select('title,body,status,due_at').eq('opportunity_id', opportunityId).order('status').order('due_at').limit(25).then(must),
  ])
  const model = await routingModel('opportunity_summary_model')
  const res = await upstreamFetch('OpenRouter opportunity chat', 'https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runtimeEnv.OPENROUTER_API_KEY}`, 'HTTP-Referer': SUPABASE_URL, 'X-Title': 'POP CRM Opportunity Chat' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Answer as a CRM assistant using only the provided CRM context. If the context is insufficient, say what is missing. Keep the answer concise and action-oriented.' },
        { role: 'user', content: JSON.stringify({ question, opportunity: context, emails, notes, tasks }) },
      ],
      temperature: 0.2,
    }),
  }, { timeoutMs: upstreamSettings.OPENROUTER_FETCH_TIMEOUT_MS })
  if (!res.ok) throw new Error(`OpenRouter chat failed: HTTP ${res.status}`)
  const json = await res.json()
  return String(json.choices?.[0]?.message?.content || '').trim()
}

async function updateOpportunitySummary(opportunityId) {
  try { await summarizeOpportunity(opportunityId) } catch (error) { console.warn(`summary skipped for ${opportunityId}: ${error.message}`) }
}

export async function routeEmail({ subject, bodyText, addresses, displayNames = {}, task = 'email_routing_model', allowAi = true }) {
  const searchText = `${subject || ''} ${bodyText || ''}`
  const normalizedSubject = normalizeSubject(subject).toLowerCase()
  const domains = [...new Set(addresses.map(domainOf).filter((d) => d && d !== INTERNAL_DOMAIN))]
  const nonNoiseDomains = domains.filter((d) => !isNoiseDomain(d))
  const bodyAddresses = extractAddresses(bodyText)
  const allAddresses = [...new Set([...addresses, ...bodyAddresses])].map((x) => x.toLowerCase())

  const ignoreRules = await cachedReference('ignore_rules', async () =>
    must(await crm('ignore_rule').select('id,pattern,match_type,rule_type').limit(5000)))
  for (const rule of ignoreRules.filter((candidate) => ruleTypeOf(candidate) === 'SUBJECT')) {
    const pattern = String(rule.pattern || '').toLowerCase()
    if (!pattern) continue
    const matchType = rule.match_type || 'CONTAINS'
    if (
      (matchType === 'EXACT' && normalizedSubject === pattern) ||
      (matchType === 'STARTS_WITH' && normalizedSubject.startsWith(pattern)) ||
      (matchType === 'CONTAINS' && normalizedSubject.includes(pattern))
    ) return { routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' }
  }

  let retailer = null
  let routingMethod = 'EMAIL_DOMAIN'
  let customerDomainPresent = false

  const aliasRetailer = await matchRetailerByAlias(normalizedSubject)
  if (aliasRetailer) { retailer = aliasRetailer.id; routingMethod = 'SUBJECT_ALIAS' }

  for (const domain of nonNoiseDomains) {
    const row = await matchingRetailersByDomain(domain, displayNames)
    if (row) {
      customerDomainPresent = true
      if (!retailer) { retailer = row.id; routingMethod = 'EMAIL_DOMAIN' }
    }
  }

  if (!retailer && bodyText) {
    const threadDomains = [...new Set(extractAddresses(bodyText).map(domainOf).filter((d) => d && d !== INTERNAL_DOMAIN && !isNoiseDomain(d)))]
    const matches = []
    for (const domain of threadDomains) {
      const row = await matchingRetailersByDomain(domain, displayNames)
      if (row && !matches.includes(row.id)) matches.push(row.id)
    }
    if (matches.length === 1) { retailer = matches[0]; routingMethod = 'THREAD_EMAIL_DOMAIN' }
  }

  // Only email that carries a customer domain is sales email. A customer domain
  // either matches a customer outright or is classified Active/Potential
  // Customer on the Customers page but not yet routed to one (it then waits in
  // the Email Routing Domains tab). Everything else is skipped as not
  // customer-related; reroute rechecks those once a domain gets routed.
  const bodyDomains = [...new Set(bodyAddresses.map(domainOf).filter((d) => d && d !== INTERNAL_DOMAIN && !isNoiseDomain(d)))]
  if (task === 'email_routing_model' && !customerDomainPresent && !retailer && !(await hasClassifiedCustomerDomain([...nonNoiseDomains, ...bodyDomains]))) {
    return { routing_status: 'SKIPPED', routing_method: NO_CUSTOMER_DOMAIN }
  }

  if (!retailer) {
    const subjectHistory = await matchRetailerBySubjectHistory(normalizedSubject)
    if (subjectHistory) { retailer = subjectHistory.id; routingMethod = 'SUBJECT_HISTORY' }
  }

  const addressRule = matchingAddressRule(ignoreRules, addresses, customerDomainPresent)
  if (addressRule) return { routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' }

  if (!retailer) {
    const companyName = await matchRetailerByCompanyName(subject)
    if (companyName) { retailer = companyName.id; routingMethod = 'COMPANY_NAME_FUZZY' }
  }

  const department = await findDepartment(retailer, allAddresses)
  const opportunity = await matchOpportunity({ retailer, department, searchText })
  if (opportunity) {
    return {
      routing_status: 'ROUTED',
      routing_method: opportunity.method,
      opportunity: opportunity.row.id,
      retailer: opportunity.row.retailer || retailer || null,
      department: opportunity.row.department || null,
    }
  }

  if (!retailer && addresses.some((a) => isNoiseSender(a, customerDomainPresent))) return { routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' }
  if (!retailer && !nonNoiseDomains.length) return { routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' }

  if (retailer && department) return { routing_status: 'COMPANY_DEPT', routing_method: routingMethod, retailer, department }
  if (retailer) return { routing_status: 'COMPANY_ONLY', routing_method: routingMethod, retailer }

  const aiRetailer = allowAi ? await scaledownRetailerFallback({ subject, bodyText, addresses: allAddresses }) : null
  if (aiRetailer) {
    const aiDepartment = await findDepartment(aiRetailer, allAddresses)
    const aiOpportunity = await matchOpportunity({ retailer: aiRetailer, department: aiDepartment, searchText })
    if (aiOpportunity) return { routing_status: 'ROUTED', routing_method: 'AI_ROUTER', opportunity: aiOpportunity.row.id, retailer: aiOpportunity.row.retailer || aiRetailer, department: aiOpportunity.row.department || null }
    if (aiDepartment) return { routing_status: 'COMPANY_DEPT', routing_method: 'AI_ROUTER', retailer: aiRetailer, department: aiDepartment }
    return { routing_status: 'COMPANY_ONLY', routing_method: 'AI_ROUTER', retailer: aiRetailer }
  }

  return { routing_status: 'UNROUTED' }
}

// --- Microsoft Graph (unchanged) ----------------------------------------------
async function graphToken() {
  const tenant = runtimeEnv.AZURE_TENANT_ID || runtimeEnv.MS_TENANT_ID
  const client = runtimeEnv.AZURE_CLIENT_ID || runtimeEnv.MS_CLIENT_ID
  const secret = runtimeEnv.AZURE_CLIENT_SECRET || runtimeEnv.MS_CLIENT_SECRET
  if (!tenant || !client || !secret) throw new Error('Missing Microsoft Graph credentials')
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: client, client_secret: secret, scope: 'https://graph.microsoft.com/.default' })
  const res = await upstreamFetch('Microsoft Graph token', `${LOGIN_BASE}/${tenant}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }, { timeoutMs: upstreamSettings.GRAPH_FETCH_TIMEOUT_MS, retryTransient: true })
  if (!res.ok) throw new Error(`Graph token failed: HTTP ${res.status}`)
  return (await res.json()).access_token
}
function outlookCursorKey(mailbox) {
  return `outlook-ingest:${String(mailbox).trim().toLowerCase()}`
}

export function resolveOutlookDeltaSettings(env) {
  const value = env.OUTLOOK_DELTA_EXPIRED_RESYNC_MAX
  if (value !== undefined && !/^[0-3]$/.test(value)) {
    throw new Error('OUTLOOK_DELTA_EXPIRED_RESYNC_MAX must be an integer from 0 through 3')
  }
  return { maxExpiredTokenResyncs: value === undefined ? 1 : Number(value) }
}

function cursorRpcResult(result, operation) {
  if (!result?.error) return result?.data
  const error = new Error(`Outlook cursor ${operation} failed`)
  error.code = result.error.code
  throw error
}

export function createGraphCursorStore(client) {
  return {
    load: async (cursorKey) => cursorRpcResult(
      await client.schema('crm').rpc('load_worker_delta_cursor', { p_cursor_key: cursorKey }),
      'load',
    ),
    save: async ({ cursorKey, mailbox, deltaLink, expectedVersion }) => cursorRpcResult(
      await client.schema('crm').rpc('save_worker_delta_cursor', {
        p_cursor_key: cursorKey,
        p_purpose: OUTLOOK_CURSOR_PURPOSE,
        p_owner_identity: mailbox,
        p_delta_link: deltaLink,
        p_expected_version: expectedVersion,
      }),
      'save',
    ),
  }
}

export function validateGraphDeltaLink(value) {
  let url
  try { url = new URL(value) } catch { throw new Error('Microsoft Graph returned an invalid continuation link') }
  if (url.protocol !== 'https:' || url.hostname !== GRAPH_HOST || url.port || url.username || url.password) {
    throw new Error('Microsoft Graph returned an untrusted continuation link')
  }
  return url.toString()
}

function initialDeltaUrl(mailbox) {
  const selectFields = ['id', 'subject', 'receivedDateTime', 'bodyPreview', 'body', 'from', 'toRecipients', 'ccRecipients', 'isRead'].join(',')
  return `${GRAPH_BASE}/users/${encodeURIComponent(mailbox)}/mailFolders/inbox/messages/delta?$select=${selectFields}&$top=${PAGE_SIZE}`
}

function isExpiredDeltaResponse(response) {
  return response.status === 410
}

async function fetchGraphDeltaPage(accessToken, url) {
  const trustedUrl = validateGraphDeltaLink(url)
  const res = await upstreamFetch('Microsoft Graph mail delta', trustedUrl, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }, { timeoutMs: upstreamSettings.GRAPH_FETCH_TIMEOUT_MS, retryTransient: true })
  if (!res.ok) {
    const error = new Error(`Microsoft Graph mail delta failed: HTTP ${res.status}`)
    error.status = res.status
    error.expiredDeltaToken = isExpiredDeltaResponse(res)
    throw error
  }
  return res.json()
}

async function loadOutlookCursor(cursorKey) {
  return boundaries.graphCursorStore.load(cursorKey)
}

async function saveOutlookCursor({ cursorKey, mailbox, deltaLink, expectedVersion }) {
  return boundaries.graphCursorStore.save({ cursorKey, mailbox, deltaLink, expectedVersion })
}

// `gated` keeps purely internal mail out of the CRM. This is an INTERIM rule:
// per shared-db docs/business-rules/email-capture-and-program-linkage.md, once a
// message can be linked to a program by subject-line data that linkage decides
// capture and overrides this test, because internal-only mail belonging to a
// program is worth keeping. When that lands, evaluate program linkage BEFORE
// this check — filtering here first would discard exactly the mail it is meant
// to keep.
async function processOutlookMessage(message, { gated }) {
  if (message['@removed']) return 'tombstone'
  if (!message.id) throw new Error('Microsoft Graph returned a mail change without an id')
  // The unique key is (external_source, external_id); older rows may lack outlook_message_id.
  const existing = must(await crm('email_message').select('id').eq('outlook_message_id', message.id).limit(1))
  if (existing.length) return 'duplicate'
  const existingExternal = must(await crm('email_message').select('id').eq('external_source', 'outlook').eq('external_id', message.id).limit(1))
  if (existingExternal.length) return 'duplicate'
  const addresses = participantAddresses(message)
  if (gated && !addresses.some((addr) => !addr.endsWith(`@${INTERNAL_DOMAIN}`))) return 'gated'
  const bodyText = message.body?.content || message.bodyPreview || ''
  const route = await normalizeRoute(await routeEmail({ subject: message.subject || '', bodyText, addresses, displayNames: displayNameMap(message) }))
  let retailerPatterns = ''
  if (route.retailer) {
    const rows = must(await core('customer').select('so_patterns').eq('id', route.retailer).limit(1))
    retailerPatterns = rows[0]?.so_patterns || ''
  }
  const detected = extractOrderNumbers(bodyText, retailerPatterns)
  must(await crm('email_message').insert({
    subject: message.subject || '(no subject)',
    sender: message.from?.emailAddress?.address || '',
    recipients: [...(message.toRecipients || []), ...(message.ccRecipients || [])].map((r) => r.emailAddress?.address).filter(Boolean).join(', '),
    received_at: message.receivedDateTime || null,
    body_preview: message.bodyPreview || '',
    outlook_message_id: message.id,
    detected_so_numbers: detected.soNumbers.join(', '),
    detected_po_numbers: detected.poNumbers.join(', '),
    external_id: message.id,
    external_source: 'outlook',
    ...routeColumns(route),
  }))
  if (route.opportunity) await updateOpportunitySummary(route.opportunity)
  return 'created'
}

function freshOutlookCounts() {
  return { pages: 0, fetched: 0, created: 0, duplicate: 0, tombstone: 0, gated: 0, quarantined: 0 }
}

function clampQuarantineError(error) {
  return String(error || '').slice(0, OUTLOOK_QUARANTINE_ERROR_MAX)
}

// Durable per-message failure tracking for Outlook ingest. Attempt counts must
// survive run restarts, and no database contract exists for them, so they live
// in one JSON state file (OUTLOOK_QUARANTINE_FILE, default below): an
// `attempts` map (message id -> count/mailbox/error/updatedAt) and a
// `quarantined` map (message id -> mailbox/error/quarantinedAt). A missing file
// is a normal first run and starts empty; any other read or parse failure
// throws so the run fails loudly instead of silently forgetting quarantine
// history. Quarantine keeps the attempt count, so a message that still fails
// when a full rebuild replays it is re-quarantined immediately instead of
// blocking the mailbox for another three runs.
export function createOutlookFailureStore({ file = DEFAULT_OUTLOOK_QUARANTINE_FILE, now = () => new Date().toISOString() } = {}) {
  let state = null
  const load = () => {
    if (state) return state
    let raw
    try {
      raw = readFileSync(file, 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') {
        state = { version: 1, attempts: {}, quarantined: {} }
        return state
      }
      throw error
    }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch { parsed = null }
    const validMap = (value) => value === undefined || value === null || (typeof value === 'object' && !Array.isArray(value))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !validMap(parsed.attempts) || !validMap(parsed.quarantined)) {
      throw new Error(`Outlook quarantine state file ${file} is unreadable; fix or remove it before the next ingest run`)
    }
    state = { version: 1, attempts: parsed.attempts || {}, quarantined: parsed.quarantined || {} }
    return state
  }
  const persist = () => writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  return {
    recordFailure: async ({ messageId, mailbox, error }) => {
      const current = load()
      const previous = Math.max(0, Math.trunc(Number(current.attempts[messageId]?.count)) || 0)
      const count = previous + 1
      current.attempts[messageId] = { count, mailbox, error: clampQuarantineError(error), updatedAt: now() }
      persist()
      return count
    },
    quarantine: async ({ messageId, mailbox, error }) => {
      const current = load()
      current.quarantined[messageId] = { mailbox, error: clampQuarantineError(error), quarantinedAt: now() }
      persist()
    },
    clear: async (messageId) => {
      const current = load()
      if (!(messageId in current.attempts) && !(messageId in current.quarantined)) return
      delete current.attempts[messageId]
      delete current.quarantined[messageId]
      persist()
    },
  }
}

export async function runOutlookDeltaSync({
  accessToken,
  mailbox,
  cursor,
  fetchPage,
  processMessage,
  saveCursor,
  reloadCursor,
  failureStore = null,
  maxExpiredTokenResyncs = 1,
  maxConcurrencyRetries = OUTLOOK_CURSOR_CONCURRENCY_RETRY_MAX,
  warn = console.warn,
}) {
  let url = validateGraphDeltaLink(cursor?.delta_link || initialDeltaUrl(mailbox))
  let expectedVersion = cursor?.version || null
  let expiredResyncs = 0
  let concurrencyRetries = 0
  let counts = freshOutlookCounts()

  // One bad message must not block a mailbox indefinitely. Each failure is
  // counted in the durable failure store; before the limit the run still
  // aborts (the cursor stays put and the next run retries the message), and at
  // the limit the message is quarantined — recorded, loudly logged, and
  // skipped — so the cursor can advance and ingestion keeps flowing. Without a
  // failure store the original contract holds: any failure aborts the run.
  const processMessageGuarded = async (message) => {
    let result
    try {
      result = await processMessage(message)
    } catch (error) {
      if (!failureStore || !message?.id) throw error
      const messageId = String(message.id)
      const description = error?.message || String(error)
      const attempts = await failureStore.recordFailure({ messageId, mailbox, error: description })
      if (attempts < OUTLOOK_MESSAGE_FAILURE_LIMIT) throw error
      await failureStore.quarantine({ messageId, mailbox, error: description })
      warn(`outlook-ingest: ${mailbox}: message ${messageId} failed ${attempts} times and is quarantined (skipped so the cursor can advance): ${description}`)
      return 'quarantined'
    }
    if (failureStore && message?.id) await failureStore.clear(String(message.id))
    return result
  }

  // Checkpoint and final saves share the same compare-and-set: a P0001
  // refusal means another worker moved the cursor, and the whole walk replays
  // from the reloaded state with fresh operator totals.
  const saveCursorWithCas = async (link) => {
    try {
      return { saved: await saveCursor({ deltaLink: link, expectedVersion }) }
    } catch (error) {
      if (error?.code !== 'P0001' || !reloadCursor || concurrencyRetries >= maxConcurrencyRetries) {
        if (error?.code === 'P0001') throw new Error('Outlook cursor concurrency retry limit exhausted', { cause: error })
        throw error
      }
      return { refused: error }
    }
  }
  const replayFromReloadedCursor = async () => {
    concurrencyRetries += 1
    warn(`outlook-ingest: another worker advanced the cursor; safely replaying from current state (${concurrencyRetries}/${maxConcurrencyRetries})`)
    const current = await reloadCursor()
    url = validateGraphDeltaLink(current?.delta_link || initialDeltaUrl(mailbox))
    expectedVersion = current?.version || null
    counts = freshOutlookCounts()
  }

  while (true) {
    let page
    try {
      page = await fetchPage(accessToken, url)
    } catch (error) {
      if (!error?.expiredDeltaToken || expiredResyncs >= maxExpiredTokenResyncs) throw error
      expiredResyncs += 1
      warn(`outlook-ingest: saved Microsoft Graph cursor expired; starting bounded full inbox delta rebuild (${expiredResyncs}/${maxExpiredTokenResyncs})`)
      url = initialDeltaUrl(mailbox)
      counts = freshOutlookCounts()
      continue
    }
    counts.pages += 1
    const messages = Array.isArray(page.value) ? page.value : []
    counts.fetched += messages.length
    for (const message of messages) {
      const result = await processMessageGuarded(message)
      if (!Object.hasOwn(counts, result)) throw new Error('Outlook message processor returned an unknown result')
      counts[result] += 1
    }
    if (page['@odata.nextLink']) {
      url = validateGraphDeltaLink(page['@odata.nextLink'])
      // Checkpoint after each completed page: a run killed mid-walk (the
      // systemd unit caps it at 10 minutes) resumes at the next unread page
      // instead of restarting the whole backlog from the pre-walk cursor.
      // Saving the continuation link here keeps the database contract's
      // ordering — every message on every completed page is already persisted,
      // and inserts are idempotent on the Graph message id, so replaying a
      // checkpointed page is harmless.
      const checkpoint = await saveCursorWithCas(url)
      if (checkpoint.refused) {
        await replayFromReloadedCursor()
        continue
      }
      expectedVersion = checkpoint.saved?.version || expectedVersion
      if (checkpoint.saved?.advanced !== true) warn('outlook-ingest: cursor save succeeded without forward progress')
      continue
    }
    if (!page['@odata.deltaLink']) throw new Error('Microsoft Graph delta response ended without a delta link')
    const deltaLink = validateGraphDeltaLink(page['@odata.deltaLink'])
    const outcome = await saveCursorWithCas(deltaLink)
    if (outcome.refused) {
      await replayFromReloadedCursor()
      continue
    }
    const saved = outcome.saved
    if (saved?.advanced !== true) warn('outlook-ingest: cursor save succeeded without forward progress')
    return { ...counts, cursorAdvanced: saved?.advanced === true, cursorVersion: saved?.version || null }
  }
}

// Mailboxes to ingest. OUTLOOK_MAILBOXES takes a comma-separated list so a new
// salesperson is an env change, not a code change; OUTLOOK_MAILBOX stays
// supported for the original single-mailbox setup. Each mailbox keeps its own
// delta cursor, so one failing mailbox cannot rewind another.
export function resolveOutlookMailboxes(env = {}) {
  const raw = env.OUTLOOK_MAILBOXES || env.OUTLOOK_MAILBOX || 'adweck@popcre.com'
  const seen = new Set()
  for (const entry of String(raw).split(',')) {
    const mailbox = entry.trim().toLowerCase()
    if (mailbox) seen.add(mailbox)
  }
  return [...seen]
}

async function outlookIngest() {
  const mailboxes = resolveOutlookMailboxes(runtimeEnv)
  let failures = 0
  for (const mailbox of mailboxes) {
    try {
      await outlookIngestMailbox(mailbox)
    } catch (error) {
      failures += 1
      console.error(`outlook-ingest: ${mailbox} failed: ${error.message}`)
    }
  }
  if (failures) throw new Error(`outlook-ingest: ${failures}/${mailboxes.length} mailboxes failed`)
}

async function outlookIngestMailbox(mailbox) {
  const gated = runtimeEnv.OUTLOOK_GATED === 'true'
  const { maxExpiredTokenResyncs } = resolveOutlookDeltaSettings(runtimeEnv)
  const failureStore = createOutlookFailureStore({ file: runtimeEnv.OUTLOOK_QUARANTINE_FILE?.trim() || DEFAULT_OUTLOOK_QUARANTINE_FILE })
  const token = await graphToken()
  const cursorKey = outlookCursorKey(mailbox)
  const cursor = await loadOutlookCursor(cursorKey)
  const result = await runOutlookDeltaSync({
    accessToken: token,
    mailbox,
    cursor,
    fetchPage: fetchGraphDeltaPage,
    processMessage: (message) => processOutlookMessage(message, { gated }),
    saveCursor: ({ deltaLink, expectedVersion }) => saveOutlookCursor({ cursorKey, mailbox, deltaLink, expectedVersion }),
    reloadCursor: () => loadOutlookCursor(cursorKey),
    failureStore,
    maxExpiredTokenResyncs,
  })
  console.log(`outlook-ingest: ${mailbox}: ${result.created} created, ${result.duplicate} duplicates, ${result.tombstone} tombstones, ${result.gated} gated, ${result.quarantined} quarantined, ${result.fetched} fetched across ${result.pages} pages; cursor saved`)
}

// One reroute write, as a compare-and-set: it only lands while the row still
// carries the routing status and company the decision was made from. A
// zero-row result means someone changed the row mid-run; that is neither an
// overwrite nor an error, only a decision made on a stale snapshot.
export function buildRerouteWrite(updateBuilder, row) {
  let query = updateBuilder.eq('id', row.id).eq('routing_status', row.routing_status).select('id')
  return row.company_id ? query.eq('company_id', row.company_id) : query.is('company_id', null)
}

export async function runReroute({ fetchRows, routeMessage, updateRow, log = console.log, warn = console.warn }) {
  const rows = await fetchRows()
  let updated = 0
  let changedUnderneath = 0
  let evaluated = 0
  let failed = 0
  for (const row of rows) {
    const route = await routeMessage(row)
    evaluated += 1
    const recheck = row.routing_status === 'SKIPPED'
    // Unassigned mail without a customer domain leaves Needs company; mail a
    // person already gave a company is never demoted, and a manual company
    // choice is never moved.
    const demote = !row.company_id && route.routing_method === NO_CUSTOMER_DOMAIN && row.routing_status === 'UNROUTED'
    const apply = recheck ? route.routing_status !== 'SKIPPED' : demote || mayReroute(row, route)
    if (apply) {
      try {
        const written = await updateRow(row, route)
        if (written > 0) updated += 1
        else if (written === 0) changedUnderneath += 1
      } catch (error) {
        failed += 1
        warn(`reroute skipped ${row.id}: ${error.message}`)
      }
    }
    if (evaluated % 500 === 0) log(`reroute: ${evaluated}/${rows.length} evaluated, ${updated} improved`)
  }
  log(`reroute: ${evaluated} messages evaluated, ${updated} improved, ${changedUnderneath} changed underneath${failed ? `, ${failed} failed` : ''}`)
  // The run finishes the remaining rows first, then reports the failures by
  // exiting non-zero: a job whose writes were rejected must show as failed.
  if (failed) throw new Error(`reroute: ${failed} of ${evaluated} message updates failed`)
  return { evaluated, updated, changedUnderneath, failed }
}

async function reroute() {
  const columns = 'id,subject,body_preview,sender,recipients,routing_status,routing_method,company_id'
  // Improved programs are collected while walking and summarised once each
  // after the loop: 40 improved messages of one program cost one paid
  // summary, not 40.
  const summarizedOpportunities = new Set()
  await runReroute({
    fetchRows: async () => [
      ...await fetchAllRows(() => crm('email_message').select(columns).in('routing_status', ROUTABLE_STATUSES)),
      // Recheck mail skipped for having no customer domain: a domain routed since
      // may now make it sales email.
      ...await fetchAllRows(() => crm('email_message').select(columns).eq('routing_status', 'SKIPPED').eq('routing_method', NO_CUSTOMER_DOMAIN)),
    ],
    routeMessage: async (row) => {
      const addresses = extractAddresses(`${row.sender || ''} ${row.recipients || ''}`)
      return normalizeRoute(await routeEmail({ subject: row.subject || '', bodyText: row.body_preview || '', addresses, allowAi: process.env.CRM_REROUTE_AI === 'true' }))
    },
    updateRow: async (row, route) => {
      const written = must(await buildRerouteWrite(crm('email_message').update(routeColumns(route)), row))
      if (written.length && route.opportunity) summarizedOpportunities.add(route.opportunity)
      return written.length
    },
  })
  for (const opportunityId of summarizedOpportunities) await updateOpportunitySummary(opportunityId)
}

// Domains classified Active/Potential Customer on the Customers page.
async function hasClassifiedCustomerDomain(domains) {
  if (!domains.length) return false
  const classified = await cachedReference('ingested_domains:customer', async () => new Set(
    (await fetchAllRows(() => crm('ingested_domain').select('id,domain').in('status', ['ACTIVE_CUSTOMER', 'POTENTIAL_CUSTOMER'])))
      .map((r) => String(r.domain || '').toLowerCase())))
  return domains.some((d) => domainCandidates(d).some((c) => classified.has(c)))
}

async function recordIngestedDomain(domain, sender = null, subject = null, displayName = null) {
  must(await sb.schema('crm').rpc('record_ingested_domain', {
    p_domain: domain,
    p_sender: sender,
    p_subject: subject,
    p_display_name: displayName,
  }))
}

// A shared domain (a parent and its banner, e.g. ros.com for Ross Stores and
// dd's) legitimately matches more than one customer. Routing disambiguates per
// message with SHARED_DOMAIN_RULES, but contact sync has no message to judge by,
// so it must never guess: it owns the domain to whichever customer carries it as
// its own `domain`, and otherwise reports the ambiguity instead of picking one.
async function customerForDomain(domain) {
  const candidates = domainCandidates(domain)
  const existing = must(await core('customer')
    .select('id,name,domain,routing_aliases,customer_status')
    .in('customer_status', CUSTOMERS)
    .or(domainOrClause(candidates))
    .limit(20))
  if (!existing.length) return null
  if (existing.length === 1) return existing[0].id
  const owner = existing.find((r) => candidates.includes(String(r.domain || '').toLowerCase()))
  if (owner) return owner.id
  console.warn(`contact-sync: ${domain} matches ${existing.length} customers and none owns it as its domain (${existing.map((r) => r.name).join(', ')}); leaving its contacts alone`)
  return AMBIGUOUS_DOMAIN
}

async function contactSync() {
  const rows = await fetchAllRows(() => crm('email_message').select('id,subject,sender,recipients'))
  const subjectByDomain = new Map()
  const senderByDomain = new Map()
  const emailCountByDomain = new Map()
  for (const row of rows) {
    const rowDomains = new Set()
    for (const address of extractAddresses(`${row.sender || ''} ${row.recipients || ''}`)) {
      const domain = domainOf(address)
      if (!domain) continue
      if (!subjectByDomain.has(domain) && row.subject) subjectByDomain.set(domain, row.subject)
      if (!senderByDomain.has(domain)) senderByDomain.set(domain, address)
      rowDomains.add(domain)
    }
    for (const domain of rowDomains) emailCountByDomain.set(domain, (emailCountByDomain.get(domain) || 0) + 1)
  }
  const addresses = [...new Set(rows.flatMap((row) => extractAddresses(`${row.sender || ''} ${row.recipients || ''}`)))]
    .filter((address) => {
      const domain = domainOf(address)
      return domain && domain !== INTERNAL_DOMAIN && !CONTACT_SYNC_NOISE_DOMAINS.has(domain) && !isNoiseDomain(domain) && !isNoiseSender(address)
    })
  let retailersCreated = 0
  let buyersCreated = 0
  let failures = 0
  const retailerByDomain = new Map()
  for (const address of addresses) {
    try {
      const domain = domainOf(address)
      if (!retailerByDomain.has(domain)) {
        const customerId = await customerForDomain(domain)
        if (customerId === AMBIGUOUS_DOMAIN) {
          retailerByDomain.set(domain, null)
          continue
        }
        if (!customerId) {
          await recordIngestedDomain(domain, senderByDomain.get(domain) || address, subjectByDomain.get(domain) || null, domainToCompanyName(domain))
          // The RPC adds 1 per call; a daily re-run must not inflate it, so pin the true email total.
          must(await crm('ingested_domain').update({ email_count: emailCountByDomain.get(domain) || 1 }).eq('domain', domain))
          retailersCreated += 1
        }
        retailerByDomain.set(domain, customerId)
      }
      const customerId = retailerByDomain.get(domain)
      if (!customerId) continue
      const existing = must(await core('contact').select('id').eq('email', address).limit(1))
      if (existing.length) continue
      const contact = must(await core('contact').insert({
        full_name: personNameFromEmail(address),
        email: address,
      }).select('id').single())
      must(await core('contact_company').upsert({
        contact_id: contact.id,
        company_id: customerId,
        relationship_type: 'buyer',
        scope: 'COMPANY_WIDE',
        contact_type: 'OTHER',
      }, { onConflict: 'contact_id,company_id,relationship_type', ignoreDuplicates: true }))
      buyersCreated += 1
    } catch (error) {
      failures += 1
      console.error(`contact-sync: ${address} failed: ${error.message}`)
    }
  }
  console.log(`contact-sync: ${retailersCreated} ingested domains recorded, ${buyersCreated} customer contacts created, ${addresses.length} addresses evaluated${failures ? `, ${failures} failed` : ''}`)
  if (failures) throw new Error(`contact-sync: ${failures} address syncs failed`)
}

async function recordUnknownDomainsFromAddresses(addresses, subject = null, displayNameByDomain = new Map()) {
  const domains = [...new Set(addresses.map(domainOf))]
    .filter((domain) => domain && domain !== INTERNAL_DOMAIN && !CONTACT_SYNC_NOISE_DOMAINS.has(domain) && !isNoiseDomain(domain))
  let recorded = 0
  for (const domain of domains) {
    if (await customerForDomain(domain)) continue
    await recordIngestedDomain(domain, null, subject, displayNameByDomain.get(domain) || domainToCompanyName(domain))
    recorded += 1
  }
  return recorded
}

// The stored summary timestamp is the updatedAt written inside ai_state by
// summarizeOpportunity — no dedicated column exists yet (OPEN on #65: a
// shared-db summary-timestamp column is the eventual home).
function summaryTimestampOf(opportunity) {
  if (!opportunity?.ai_state) return null
  try {
    const at = Date.parse(JSON.parse(opportunity.ai_state)?.updatedAt)
    return Number.isNaN(at) ? null : at
  } catch {
    return null
  }
}

async function summarize() {
  const emailRows = await fetchAllRows(() => crm('email_message').select('id,opportunity_id,received_at').not('opportunity_id', 'is', null))
  const newestEmailAt = new Map()
  for (const row of emailRows) {
    if (!row.opportunity_id) continue
    const parsed = Date.parse(row.received_at || '')
    const at = Number.isNaN(parsed) ? 0 : parsed
    newestEmailAt.set(row.opportunity_id, Math.max(newestEmailAt.get(row.opportunity_id) ?? at, at))
  }
  const opportunities = await fetchAllRows(() => crm('opportunity').select('id,ai_state,updated_at'))
  const due = []
  for (const opportunity of opportunities) {
    const newestEmail = newestEmailAt.get(opportunity.id)
    // No email at all: nothing to refresh.
    if (newestEmail === undefined) continue
    // Only programs whose newest email is later than the stored summary
    // timestamp are refreshed; unchanged programs are skipped.
    const summarizedAt = summaryTimestampOf(opportunity)
    if (summarizedAt !== null && newestEmail <= summarizedAt) continue
    due.push(opportunity)
  }
  // Until a summary-timestamp column exists, due programs run
  // least-recently-updated first: a run capped at its systemd time limit
  // advances through the backlog instead of refreshing the same head every
  // time (summarizing bumps updated_at, so refreshed programs move to the
  // back of the queue on their own).
  const updatedTime = (opportunity) => {
    const parsed = Date.parse(opportunity.updated_at || '')
    return Number.isNaN(parsed) ? 0 : parsed
  }
  due.sort((a, b) => updatedTime(a) - updatedTime(b))
  let updated = 0
  let failed = 0
  for (const { id } of due) {
    try {
      if (await summarizeOpportunity(id)) updated += 1
    } catch (error) {
      failed += 1
      console.warn(`summarize: opportunity ${id} failed: ${error.message}`)
    }
  }
  console.log(`summarize: ${updated}/${due.length} opportunities refreshed${failed ? `, ${failed} failed` : ''}`)
  if (failed) throw new Error(`summarize: ${failed}/${due.length} opportunities failed`)
}

function subjectMatchesRule(subject, rule) {
  const pattern = String(rule.pattern || '').trim().toLowerCase()
  if (!pattern) return false
  const normalized = normalizeSubject(subject).toLowerCase()
  const matchType = rule.match_type || 'CONTAINS'
  return (
    (matchType === 'EXACT' && normalized === pattern) ||
    (matchType === 'STARTS_WITH' && normalized.startsWith(pattern)) ||
    (matchType === 'CONTAINS' && normalized.includes(pattern))
  )
}

export function ruleTypeOf(rule) {
  const value = String(rule?.rule_type || '').trim().toUpperCase()
  return value === 'DOMAIN' || value === 'EMAIL_ADDRESS' || value === 'SUBJECT' ? value : 'SUBJECT'
}

export function addressRuleMatches(rule, addresses) {
  const type = ruleTypeOf(rule)
  if (type === 'SUBJECT') return false
  const pattern = String(rule?.pattern || '').trim().toLowerCase().replace(/^@/, '')
  if (!pattern) return false
  const normalized = addresses.map((address) => String(address || '').trim().toLowerCase())
  if (type === 'EMAIL_ADDRESS') return normalized.includes(pattern)
  return normalized.some((address) => domainOf(address) === pattern)
}

export function matchingAddressRule(rules, addresses, customerDomainPresent) {
  if (customerDomainPresent) return null
  return rules.find((rule) => addressRuleMatches(rule, addresses)) || null
}

async function applyIgnoreRules() {
  // Read the rules first: with no SUBJECT rules nothing can match, so the
  // unrouted-email scan is skipped instead of competing for database time
  // (it timed out during database-wide load on 2026-11-18 with zero rules).
  const rules = must(await crm('ignore_rule').select('id,pattern,match_type,rule_type,emails_skipped').limit(5000))
  if (!rules.some((r) => ruleTypeOf(r) === 'SUBJECT')) {
    console.log('apply-ignore-rules: 0 emails skipped by 0 rules (no subject rules)')
    return
  }
  const emails = await fetchAllRows(() => crm('email_message').select('id,subject').eq('routing_status', 'UNROUTED'))
  let skipped = 0
  let failed = 0
  const counts = new Map()
  for (const email of emails) {
    const rule = rules.find((r) => ruleTypeOf(r) === 'SUBJECT' && subjectMatchesRule(email.subject, r))
    if (!rule) continue
    try {
      must(await crm('email_message').update({ routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' }).eq('id', email.id))
      counts.set(rule.id, (counts.get(rule.id) || 0) + 1)
      skipped += 1
    } catch (error) {
      failed += 1
      console.warn(`apply-ignore-rules: email ${email.id} not skipped: ${error.message}`)
    }
  }
  for (const rule of rules) {
    const count = counts.get(rule.id) || 0
    if (!count) continue
    try {
      must(await crm('ignore_rule').update({ emails_skipped: Number(rule.emails_skipped || 0) + count }).eq('id', rule.id))
    } catch (error) {
      failed += 1
      console.warn(`apply-ignore-rules: counter for rule ${rule.id} not updated: ${error.message}`)
    }
  }
  console.log(`apply-ignore-rules: ${skipped} emails skipped by ${counts.size} rules${failed ? `, ${failed} failed` : ''}`)
  if (failed) throw new Error(`apply-ignore-rules: ${failed} updates failed`)
}

// --- Fireflies (HTTP unchanged; persistence -> crm.meeting_note) ---------------
function isValidFirefliesSignature(rawBody, signature) {
  return boundaries.validateSignature(rawBody, signature, runtimeEnv.FIREFLIES_WEBHOOK_SECRET)
}
async function firefliesTranscript(meetingId) {
  const query = `
    query GetTranscript($transcriptId: String!) {
      transcript(id: $transcriptId) {
        id title date duration participants organizer_email
        summary { action_items overview keywords topics_discussed meeting_type }
        transcript_url audio_url video_url meeting_link
      }
    }
  `
  const res = await upstreamFetch('Fireflies transcript', FIREFLIES_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runtimeEnv.FIREFLIES_API_KEY}` },
    body: JSON.stringify({ query, variables: { transcriptId: meetingId } }),
  }, { timeoutMs: upstreamSettings.FIREFLIES_FETCH_TIMEOUT_MS, retryTransient: true })
  if (!res.ok) throw new Error(`Fireflies API failed: HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(`Fireflies GraphQL failed: ${json.errors[0].message}`)
  const t = json.data?.transcript
  if (!t) throw new Error(`Fireflies transcript not found: ${meetingId}`)
  return t
}
function firefliesParticipants(transcript) {
  const participants = []
  for (const raw of Array.isArray(transcript.participants) ? transcript.participants : []) {
    const text = String(raw)
    const email = text.match(/<([^>]+)>/)?.[1] || (text.includes('@') ? text : '')
    const name = email && text.includes('<') ? text.slice(0, text.indexOf('<')).trim() : text.replace(email, '').trim()
    if (email && !participants.some((p) => p.email.toLowerCase() === email.toLowerCase())) participants.push({ name: name || email, email: email.toLowerCase() })
  }
  if (transcript.organizer_email && !participants.some((p) => p.email.toLowerCase() === transcript.organizer_email.toLowerCase())) {
    participants.push({ name: 'Meeting Organizer', email: transcript.organizer_email.toLowerCase() })
  }
  return participants
}

async function handleFirefliesPayload(payload) {
  const normalized = normalizeFirefliesWebhookPayload(payload)
  if (normalized.error) return { success: false, errors: [normalized.error] }
  if (normalized.skipped) {
    return { success: true, skipped: normalized.skipped, event: normalized.event }
  }
  const { meetingId } = normalized

  const existing = must(await crm('meeting_note').select('id').eq('fireflies_transcript_id', meetingId).limit(1))
  if (existing.length) return { success: true, meetingId, noteIds: [existing[0].id], skipped: 'duplicate' }

  const transcript = normalized.transcript || await firefliesTranscript(meetingId)
  const participants = firefliesParticipants(transcript)
  const participantText = participants.map((p) => `${p.name} <${p.email}>`).join(', ')
  const summary = transcript.summary || {}
  const actionItems = Array.isArray(summary.action_items) ? summary.action_items.join('\n') : (summary.action_items || '')
  const route = await routeEmail({
    subject: transcript.title || '',
    bodyText: [summary.overview || '', actionItems, (summary.keywords || []).join(' ')].join(' '),
    addresses: participants.map((p) => p.email),
    task: 'fireflies_routing_model',
  })
  const displayNameByDomain = new Map()
  for (const participant of participants) {
    const domain = domainOf(participant.email)
    if (domain && participant.name && !displayNameByDomain.has(domain)) displayNameByDomain.set(domain, participant.name)
  }
  await recordUnknownDomainsFromAddresses(participants.map((p) => p.email), transcript.title || null, displayNameByDomain)

  // Matched contacts (no shared meeting_note_attendee table yet -> kept in metadata).
  let contact = null
  const matchedContacts = []
  for (const p of participants) {
    const rows = must(await core('contact').select('id,email').eq('email', p.email).limit(1))
    if (rows[0]) {
      matchedContacts.push({ id: rows[0].id, name: p.name })
      if (!contact && !p.email.endsWith(`@${INTERNAL_DOMAIN}`)) contact = rows[0].id
    }
  }

  const dateValue = transcript.date ? new Date(Number(transcript.date) || transcript.date).toISOString() : new Date().toISOString()
  const note = must(await crm('meeting_note').insert({
    title: transcript.title || `Meeting - ${dateValue.slice(0, 10)}`,
    meeting_at: dateValue,
    participants: participantText,
    body: summary.overview || '',
    action_items: actionItems,
    source: 'FIREFLIES_AUTO_IMPORT',
    fireflies_transcript_id: meetingId,
    company_id: route.retailer || null,
    department_id: route.department || null,
    opportunity_id: route.opportunity || null,
    contact_id: contact,
    external_id: meetingId,
    external_source: 'fireflies',
    metadata: { attendees: matchedContacts },
  }).select('id').single())

  if (route.opportunity) await updateOpportunitySummary(route.opportunity)

  return { success: true, meetingId, noteIds: [note.id], actionItemsCount: Array.isArray(summary.action_items) ? summary.action_items.length : 0 }
}

async function verifySupabaseUser(token) {
  return boundaries.verifyAccess(sb, token)
}

async function resolveCrmProfile(token) {
  const userClient = createUserScopedSupabaseClient({
    createClient,
    url: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    token,
    realtimeTransport: WebSocket,
  })
  return boundaries.resolveCrmProfile(userClient)
}

export async function verifyDatabaseHealth(query = () => (
  crm('email_message')
    .select('id')
    .limit(1)
    .abortSignal(AbortSignal.timeout(5_000))
)) {
  const rows = must(await query())
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('database_health_empty')
  }
  return true
}

export function createWorkerHttpHandler({
  bodyLimits = httpBodyLimits,
  readBody = boundaries.readJsonBody,
  validateSignature = isValidFirefliesSignature,
  verifyToken = verifySupabaseUser,
  loadProfile = resolveCrmProfile,
  checkHealth = verifyDatabaseHealth,
  chat = chatOpportunity,
  processFireflies = handleFirefliesPayload,
  logWarn = console.warn,
  logError = console.error,
} = {}) {
  return async (req, res) => {
    const origin = req.headers.origin || ''
    const allowedOrigin = /^https:\/\/crm(-dev)?\.designflow\.app$/.test(origin) ? origin : 'https://crm.designflow.app'
    const jsonHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'content-type,authorization,x-hub-signature,x-fireflies-signature',
    }
    try {
      if (req.method === 'OPTIONS') { res.writeHead(204, jsonHeaders); res.end(); return }
      if (req.method === 'GET' && req.url === '/health') {
        try {
          await checkHealth()
          res.writeHead(200, jsonHeaders)
          res.end(JSON.stringify({ ok: true }))
        } catch (error) {
          logError('database health check failed', {
            name: typeof error?.name === 'string' ? error.name : 'Error',
            code: typeof error?.code === 'string' ? error.code : undefined,
          })
          res.writeHead(503, jsonHeaders)
          res.end(JSON.stringify({ ok: false }))
        }
        return
      }
      if (req.method === 'POST' && req.url === '/s/opportunity-chat') {
        const { rawBody } = await readBody(req, { maxBytes: bodyLimits.opportunityChat })
        await respondToOpportunityChatRequest({
          response: res,
          headers: jsonHeaders,
          authorization: req.headers.authorization,
          rawBody: rawBody.toString('utf8'),
          verifyToken,
          loadProfile,
          chat,
          logDenied: ({ status, userId }) => {
            logWarn('opportunity-chat access denied', { status, userId })
          },
        })
        return
      }
      if (req.method !== 'POST' || !['/s/fireflies-webhook', '/webhooks/fireflies'].includes(req.url || '')) {
        res.writeHead(404, jsonHeaders)
        res.end(JSON.stringify({ error: 'not_found' }))
        return
      }
      const signature = req.headers['x-hub-signature'] || req.headers['x-fireflies-signature']
      const { body: payload } = await readBody(req, {
        maxBytes: bodyLimits.fireflies,
        beforeParse: async (rawBody) => {
          if (!await validateSignature(rawBody, signature)) {
            throw Object.assign(new Error('invalid_signature'), { status: 401, code: 'invalid_signature' })
          }
        },
      })
      const normalized = normalizeFirefliesWebhookPayload(payload)
      if (normalized.error) {
        res.writeHead(400, jsonHeaders)
        res.end(JSON.stringify({ success: false, errors: [normalized.error] }))
        return
      }
      if (normalized.skipped) {
        res.writeHead(200, jsonHeaders)
        res.end(JSON.stringify({ success: true, skipped: normalized.skipped, event: normalized.event }))
        return
      }

      res.writeHead(202, jsonHeaders)
      res.end(JSON.stringify({ success: true, accepted: true, meetingId: normalized.meetingId }))
      void processFireflies(payload).catch((error) => {
        logError('fireflies webhook processing failed', {
          meetingId: normalized.meetingId,
          name: typeof error?.name === 'string' ? error.name : 'Error',
          code: typeof error?.code === 'string' ? error.code : undefined,
          status: Number.isInteger(error?.status) ? error.status : undefined,
        })
      })
    } catch (error) {
      if (error?.status === 401 && error?.code === 'invalid_signature') {
        res.writeHead(401, jsonHeaders)
        res.end(JSON.stringify({ success: false, errors: ['invalid signature'] }))
        return
      }
      if (error?.status === 400 || error?.status === 413) {
        res.writeHead(error.status, jsonHeaders)
        res.end(JSON.stringify({ error: error.code }))
        return
      }
      logError('worker request failed', {
        route: req.url || null,
        name: typeof error?.name === 'string' ? error.name : 'Error',
        code: typeof error?.code === 'string' ? error.code : undefined,
        status: Number.isInteger(error?.status) ? error.status : undefined,
      })
      res.writeHead(500, jsonHeaders)
      res.end(JSON.stringify({ success: false, errors: ['internal_error'] }))
    }
  }
}

async function firefliesServer() {
  const { createServer } = await import('node:http')
  const port = Number(runtimeEnv.PORT || 8787)
  httpBodyLimits = resolveHttpBodyLimits(runtimeEnv)
  const server = createServer(createWorkerHttpHandler())
  server.listen(port, '0.0.0.0', () => console.log(`fireflies-server (supabase) listening on ${port}`))
}

export async function main(argv = process.argv, env = process.env, overrides = {}) {
  const command = argv[2] || 'help'
  loadEnvironmentFile(env)
  validateCommandEnvironment(command, env)
  initializeRuntime(env, overrides)
  if (command === 'outlook-ingest') await outlookIngest()
  else if (command === 'reroute') await reroute()
  else if (command === 'fireflies-server') await firefliesServer()
  else if (command === 'contact-sync') await contactSync()
  else if (command === 'summarize') await summarize()
  else if (command === 'apply-ignore-rules') await applyIgnoreRules()
  else console.log('Usage: node workers/crm-worker-supabase.mjs <outlook-ingest|reroute|fireflies-server|contact-sync|summarize|apply-ignore-rules>')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
