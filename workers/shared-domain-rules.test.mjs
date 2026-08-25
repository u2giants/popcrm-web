import { describe, expect, it } from 'vitest'

import { applySharedDomainRule } from './crm-worker-supabase.mjs'

// Ross Stores and its dd's banner share ros.com but stay separate customers.
const ROSS = { id: 'ross', name: 'ROSS STORES INC SUPPLIERS', domain: 'ros.com', routing_aliases: null }
const DDS = { id: 'dds', name: "DD'S DISCOUNT SUPPLIERS", domain: null, routing_aliases: 'ros.com' }

describe('applySharedDomainRule', () => {
  it("routes a dd's-branded message to dd's, not to the parent", () => {
    expect(applySharedDomainRule('ros.com', [ROSS, DDS], { 'buyer@ros.com': "DDs Buying Office" })).toEqual(DDS)
    expect(applySharedDomainRule('ros.com', [ROSS, DDS], { 'buyer@ros.com': 'NYBO Team' })).toEqual(DDS)
  })

  it('leaves an unbranded message for the caller to resolve', () => {
    expect(applySharedDomainRule('ros.com', [ROSS, DDS], { 'buyer@ros.com': 'Ross Buying' })).toBeNull()
  })

  it('does nothing for a domain with no shared-domain rule, or a single candidate', () => {
    expect(applySharedDomainRule('lidl.us', [ROSS, DDS], { 'x@lidl.us': "DD's" })).toBeNull()
    expect(applySharedDomainRule('ros.com', [DDS], { 'x@ros.com': "DD's" })).toBeNull()
  })
})
