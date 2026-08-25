import { describe, expect, it } from 'vitest'

import { domainOfEmail, normalizeDomainInput, suggestDomainFromEmails } from './domainSuggestion'

describe('domainOfEmail', () => {
  it('reads the domain and lowercases it', () => {
    expect(domainOfEmail('Mary.Habib@LIDL.us')).toBe('lidl.us')
  })

  it('rejects anything that is not an address', () => {
    expect(domainOfEmail('mary.habib')).toBeNull()
    expect(domainOfEmail('mary@localhost')).toBeNull()
    expect(domainOfEmail(null)).toBeNull()
  })
})

describe('suggestDomainFromEmails', () => {
  it('picks the most common company domain', () => {
    expect(
      suggestDomainFromEmails([
        'mary.habib@lidl.us',
        'rachel.nelson@lidl.us',
        'consultant@example.org',
      ]),
    ).toBe('lidl.us')
  })

  it('ignores our own domain and consumer mailboxes', () => {
    expect(suggestDomainFromEmails(['adweck@popcre.com', 'buyer@gmail.com', 'buyer@gmail.com'])).toBeNull()
    expect(suggestDomainFromEmails(['adweck@popcre.com', 'mary@lidl.us'])).toBe('lidl.us')
  })

  it('returns null when there is nothing usable', () => {
    expect(suggestDomainFromEmails([])).toBeNull()
    expect(suggestDomainFromEmails([null, undefined, ''])).toBeNull()
  })
})

describe('normalizeDomainInput', () => {
  it('strips scheme, www, path, and any pasted address', () => {
    expect(normalizeDomainInput(' https://www.Lidl.us/careers ')).toBe('lidl.us')
    expect(normalizeDomainInput('mary.habib@lidl.us')).toBe('lidl.us')
  })

  it('treats blank as a clear', () => {
    expect(normalizeDomainInput('   ')).toBe('')
  })
})
