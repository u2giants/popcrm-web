/**
 * @vitest-environment happy-dom
 *
 * The OAuth callback error banner. Session 12 moved this out of a set-state
 * effect and into lazy state, so these pin the parsing rules that decide what
 * the user is told after a failed Microsoft sign-in.
 */
import { afterEach, describe, expect, it } from 'vitest'

import { readAuthCallbackError } from './callbackError'

function visit(url: string) {
  window.history.replaceState({}, '', url)
}

afterEach(() => visit('/'))

describe('readAuthCallbackError', () => {
  it('returns null on a clean URL', () => {
    visit('/')
    expect(readAuthCallbackError()).toBeNull()
  })

  it('reads the provider error from the query string', () => {
    visit('/?error_description=Access+was+denied')
    expect(readAuthCallbackError()).toBe('Access was denied')
  })

  it('reads the provider error from the hash fragment', () => {
    visit('/#error_description=Access+was+denied')
    expect(readAuthCallbackError()).toBe('Access was denied')
  })

  it('replaces the unprovisioned-user failure with a message that says what to do', () => {
    visit('/?error_code=unexpected_failure&error_description=Database+error+saving+new+user')
    expect(readAuthCallbackError()).toBe(
      'Microsoft sign-in reached POP CRM, but the account could not be provisioned. Please ask an administrator to check your CRM access.',
    )
  })

  it('does not apply the friendly message to a different unexpected_failure', () => {
    visit('/?error_code=unexpected_failure&error_description=Something+else+broke')
    expect(readAuthCallbackError()).toBe('Something else broke')
  })

  it('does not apply the friendly message when the code is missing', () => {
    visit('/?error_description=Database+error+saving+new+user')
    expect(readAuthCallbackError()).toBe('Database error saving new user')
  })

  it('ignores an error code with no description', () => {
    visit('/?error_code=unexpected_failure')
    expect(readAuthCallbackError()).toBeNull()
  })

  it('prefers the query string when both carry an error', () => {
    visit('/?error_description=from+query#error_description=from+hash')
    expect(readAuthCallbackError()).toBe('from query')
  })
})
