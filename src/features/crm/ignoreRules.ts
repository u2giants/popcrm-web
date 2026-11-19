// Validation and normalisation shared by the two places a not-customer rule
// is created: the Settings IgnoreRulesPanel and the EmailDrawer one-click
// subject rule (issue #53). A rule that hides email is powerful, so bad
// patterns are refused before they are stored, and domain input goes through
// the same normalisation the Customer drawer uses.
import { isDomainShape, normalizeDomainInput } from '@/features/crm/domainSuggestion'
import type { CrmIgnoreRule } from '@/lib/types'

// The worker strips these prefixes from a subject before matching it
// (workers/lib/worker-foundation.mjs normalizeSubject), so a pattern that is
// nothing but prefixes matches arbitrary substrings ("Re:" sits inside
// "Store: hours") instead of a real subject.
const SUBJECT_PREFIX = /^(回复:|回覆:|re:|fw:|fwd:)\s*/i

export type IgnoreRuleType = 'EMAIL_ADDRESS' | 'DOMAIN' | 'SUBJECT'

export const MIN_SUBJECT_PATTERN_LENGTH = 6

/** Trimmed value with every reply/forward prefix removed ("" = prefixes only). */
export function stripSubjectPrefixes(value: string): string {
  let out = value.trim()
  let previous: string
  do {
    previous = out
    out = out.replace(SUBJECT_PREFIX, '').trim()
  } while (out !== previous)
  return out
}

/**
 * Why a subject pattern cannot become a rule, or null when it can: shorter
 * than 6 characters, or nothing but reply/forward prefixes (the 'Re:' audit
 * case — such a rule hides far too much mail).
 */
export function subjectPatternProblem(value: string): string | null {
  const pattern = value.trim()
  if (pattern.length < MIN_SUBJECT_PATTERN_LENGTH) {
    return `Subject patterns need at least ${MIN_SUBJECT_PATTERN_LENGTH} characters — shorter ones would hide too much mail.`
  }
  if (!stripSubjectPrefixes(pattern)) {
    return 'A subject made only of reply or forward prefixes (Re:, Fwd:) would hide far too much mail — enter the real subject text.'
  }
  return null
}

/**
 * Why raw input cannot become a DOMAIN rule, or null when it can (an input
 * that normalises to nothing is the caller's no-op, not a problem here).
 */
export function domainRuleProblem(value: string): string | null {
  const domain = normalizeDomainInput(value)
  if (!domain) return null
  if (!isDomainShape(domain)) {
    return `"${domain}" does not look like a domain — enter it as example.com.`
  }
  return null
}

/** Normalised value to store for a DOMAIN rule ('' means nothing to store). */
export function normalizeDomainRule(value: string): string {
  return normalizeDomainInput(value)
}

/** True when a rule of this type already stores this pattern (case-insensitive). */
export function isDuplicateRule(rules: CrmIgnoreRule[], ruleType: IgnoreRuleType, pattern: string): boolean {
  const wanted = pattern.trim().toLowerCase()
  return rules.some(
    (rule) =>
      (rule.rule_type || 'SUBJECT') === ruleType &&
      String(rule.pattern || '').trim().toLowerCase() === wanted,
  )
}
