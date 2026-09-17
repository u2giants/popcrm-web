import { describe, expect, it } from 'vitest'
import { buildJevRoutingRequest, pickJevRetailer, resolveJevMinConfidence, retailerOptions } from './lib/jev-router.mjs'

const retailers = [
  { id: 'a', name: 'Target', domain: 'target.com' },
  { id: 'b', name: 'Five Below', domain: 'fivebelow.com' },
  { id: 'c', name: 'Five Below', domain: null },
]

describe('jev router', () => {
  it('defaults and validates the cutoff', () => {
    expect(resolveJevMinConfidence(undefined)).toBe(0.91)
    expect(resolveJevMinConfidence('0.8')).toBe(0.8)
    expect(() => resolveJevMinConfidence('91')).toThrow()
  })

  it('disambiguates duplicate names', () => {
    expect([...retailerOptions(retailers).keys()]).toEqual(['Target', 'Five Below (fivebelow.com)', 'Five Below (c)'])
  })

  it('builds a choice question with trimmed state', () => {
    const options = retailerOptions(retailers)
    const req = buildJevRoutingRequest({ subject: 'PO', bodyText: 'x'.repeat(5000), addresses: ['a@target.com'], options })
    expect(req.state.length).toBe(3000)
    expect(req.questions.retailer.type).toBe('choice')
    expect(req.questions.retailer.criteria.Target).toContain('target.com')
  })

  it('accepts only confident known choices', () => {
    const options = retailerOptions(retailers)
    const res = (choice, confidence) => ({ answers: { retailer: { type: 'choice', choice, confidence } } })
    expect(pickJevRetailer(res('Target', 0.95), options, 0.91)).toBe('a')
    expect(pickJevRetailer(res('Target', 0.9), options, 0.91)).toBeNull()
    expect(pickJevRetailer(res('Walmart', 0.99), options, 0.91)).toBeNull()
    expect(pickJevRetailer({}, options, 0.91)).toBeNull()
  })
})
