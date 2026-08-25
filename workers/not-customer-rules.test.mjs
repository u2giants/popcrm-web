import { describe, expect, it } from 'vitest'
import { addressRuleMatches, matchingAddressRule, ruleTypeOf } from './crm-worker-supabase.mjs'

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
