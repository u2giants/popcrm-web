import { describe, expect, it } from 'vitest'
import {
  addressRuleMatches,
  applyIgnoreRules,
  initializeRuntime,
  matchingAddressRule,
  ruleTypeOf,
} from './crm-worker-supabase.mjs'
import { createFakeSupabase } from './lib/fake-supabase.mjs'

describe('not-customer address rules', () => {
  it('matches an exact email address without matching another address', () => {
    const rule = { rule_type: 'EMAIL_ADDRESS', pattern: 'alerts@example.com' }
    expect(addressRuleMatches(rule, ['Alerts@Example.com', 'buyer@customer.com'])).toBe(true)
    expect(addressRuleMatches(rule, ['other@example.com'])).toBe(false)
  })

  it('matches a whole domain and not a suffix lookalike', () => {
    const rule = { rule_type: 'DOMAIN', pattern: '@example.com' }
    expect(addressRuleMatches(rule, ['person@example.com'])).toBe(true)
    expect(addressRuleMatches(rule, ['person@notexample.com'])).toBe(false)
  })

  it('keeps legacy rules on subject matching', () => {
    expect(ruleTypeOf({ rule_type: null })).toBe('SUBJECT')
    expect(addressRuleMatches({ pattern: 'invoice' }, ['invoice@example.com'])).toBe(false)
  })

  it('never applies an address rule when a Customer domain is also present', () => {
    const rules = [{ rule_type: 'DOMAIN', pattern: 'mailer.example' }]
    expect(matchingAddressRule(rules, ['news@mailer.example'], true)).toBeNull()
    expect(matchingAddressRule(rules, ['news@mailer.example'], false)).toEqual(rules[0])
  })
})

describe('applyIgnoreRules skip counters (issue #69, fix_bugs item F)', () => {
  // The emails_skipped bump must be one atomic database-side rpc
  // (crm.increment_ignore_rule_emails_skipped, shared-db 20261223010104);
  // the old read-modify-write lost counts under overlapping worker runs.
  const ENV = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
  }

  it('increments emails_skipped through the rpc, not an ignore_rule update', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.ignore_rule': [
          { id: 'rule-1', pattern: 'invoice', match_type: 'CONTAINS', rule_type: 'SUBJECT' },
        ],
        'crm.email_message': [
          { id: 'e1', subject: 'Please send the invoice', routing_status: 'UNROUTED' },
          { id: 'e2', subject: 'Line review notes', routing_status: 'UNROUTED' },
          { id: 'e3', subject: 'Invoice follow up', routing_status: 'UNROUTED' },
        ],
      },
    })
    initializeRuntime(ENV, { supabaseClient: fake })

    await applyIgnoreRules()

    const rpcCalls = fake.calls.filter((call) => call.op === 'rpc')
    expect(rpcCalls).toEqual([
      { schema: 'crm', table: null, op: 'rpc', fn: 'increment_ignore_rule_emails_skipped', params: { p_rule_id: 'rule-1', p_n: 2 } },
    ])
    // No read-modify-write against ignore_rule at all.
    expect(fake.calls.filter((call) => call.op === 'update' && call.table === 'ignore_rule')).toEqual([])
    const emails = fake.rows.get('crm.email_message')
    expect(emails.find((e) => e.id === 'e1').routing_status).toBe('SKIPPED')
    expect(emails.find((e) => e.id === 'e2').routing_status).toBe('UNROUTED')
    expect(emails.find((e) => e.id === 'e3').routing_status).toBe('SKIPPED')
  })
})
