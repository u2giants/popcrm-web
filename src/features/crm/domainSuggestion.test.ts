import { describe, expect, it } from 'vitest'

import { domainOfEmail, normalizeDomainInput, rootDomain, suggestDomainFromEmails } from './domainSuggestion'

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

describe('rootDomain', () => {
  it('collapses relay and campaign subdomains', () => {
    expect(rootDomain('mpsend.walmart.com')).toBe('walmart.com')
    expect(rootDomain('deals.zulily.com')).toBe('zulily.com')
  })

  it('keeps the registrable name on multi-part suffixes', () => {
    expect(rootDomain('mail.tesco.co.uk')).toBe('tesco.co.uk')
    expect(rootDomain('lidl.us')).toBe('lidl.us')
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

  it('counts relay subdomains toward the company', () => {
    expect(suggestDomainFromEmails(['buyer@walmart.com', 'noreply@mpsend.walmart.com'])).toBe('walmart.com')
  })

  it('refuses to suggest on a single contact', () => {
    expect(suggestDomainFromEmails(['mary@lidl.us'])).toBeNull()
  })

  it('ignores our own domain, consumer mailboxes, and ISP mailboxes', () => {
    expect(suggestDomainFromEmails(['adweck@popcre.com', 'buyer@gmail.com', 'buyer@gmail.com'])).toBeNull()
    expect(suggestDomainFromEmails(['buyer@comcast.net', 'other@comcast.net'])).toBeNull()
    expect(suggestDomainFromEmails(['adweck@popcre.com', 'mary@lidl.us', 'rachel@lidl.us'])).toBe('lidl.us')
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
