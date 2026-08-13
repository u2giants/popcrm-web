import { describe, expect, it } from 'vitest'

import { createRefreshGate } from './refreshGate'

// Each test is one of the real orderings that used to restore an obsolete user.
describe('auth refresh gate', () => {
  it('accepts a lone refresh that is still current', () => {
    const gate = createRefreshGate()
    const token = gate.begin('user-a')
    expect(gate.accepts(token, 'user-a')).toBe(true)
  })

  it('rejects a slow sign-in profile that resolves after sign-out', () => {
    const gate = createRefreshGate()
    const slow = gate.begin('user-a')

    // SIGNED_OUT arrives while the profile call is still in flight.
    gate.markSession(null)
    gate.invalidate()

    expect(gate.accepts(slow, 'user-a')).toBe(false)
  })

  it('rejects user A’s refresh once user B has signed in', () => {
    const gate = createRefreshGate()
    const aToken = gate.begin('user-a')
    const bToken = gate.begin('user-b')

    expect(gate.accepts(aToken, 'user-a')).toBe(false)
    expect(gate.accepts(bToken, 'user-b')).toBe(true)
  })

  it('rejects a result whose session user no longer matches, even at the newest generation', () => {
    const gate = createRefreshGate()
    const token = gate.begin('user-a')
    // A token refresh event reports a different user without starting a refresh.
    gate.markSession('user-b')

    expect(gate.accepts(token, 'user-a')).toBe(false)
  })

  it('keeps only the last of a burst of token refreshes, whatever order they resolve in', () => {
    const gate = createRefreshGate()
    const first = gate.begin('user-a')
    const second = gate.begin('user-a')
    const third = gate.begin('user-a')

    // Resolve out of order: third, first, second.
    expect(gate.accepts(third, 'user-a')).toBe(true)
    expect(gate.accepts(first, 'user-a')).toBe(false)
    expect(gate.accepts(second, 'user-a')).toBe(false)
  })

  it('rejects everything after dispose, including a brand-new refresh', () => {
    const gate = createRefreshGate()
    const inFlight = gate.begin('user-a')
    gate.dispose()

    expect(gate.accepts(inFlight, 'user-a')).toBe(false)
    expect(gate.accepts(gate.begin('user-a'), 'user-a')).toBe(false)
  })

  it('accepts a signed-out refresh that is still current, so the provider can clear state', () => {
    const gate = createRefreshGate()
    const token = gate.begin(null)
    expect(gate.accepts(token, null)).toBe(true)
  })

  it('survives a refresh started after an invalidate', () => {
    const gate = createRefreshGate()
    gate.begin('user-a')
    gate.invalidate()

    const fresh = gate.begin('user-a')
    expect(gate.accepts(fresh, 'user-a')).toBe(true)
  })
})

// Documents a deliberate asymmetry: begin() also records the session user, so a
// refresh started after a markSession() call overwrites it. That is safe only
// because every identity change in the provider is accompanied by a generation
// bump (a begin() or an invalidate()), which rejects the older result first.
// If a future caller changes identity without bumping the generation, this
// behaviour is the hole it would open.
describe('begin() records identity as well as generation', () => {
  it('lets the newest begin() define the current session user', () => {
    const gate = createRefreshGate()
    gate.begin('user-a')
    gate.markSession('user-b')
    const token = gate.begin('user-a')

    expect(gate.accepts(token, 'user-a')).toBe(true)
  })
})
