// Reads the OAuth callback error Supabase/Microsoft hands back in the URL.
//
// It lives in its own module so it can be read during the first render of the
// auth gate (lazy state, not a set-state effect) and tested without pulling in
// the Supabase client, which throws when configuration is absent.
export function readAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const authError = params.get('error_description') ?? hashParams.get('error_description')
  const authErrorCode = params.get('error_code') ?? hashParams.get('error_code')

  if (!authError) return null

  // Supabase reports a brand-new SSO user it could not provision as a generic
  // unexpected_failure. Raw, it tells the user nothing they can act on.
  if (authErrorCode === 'unexpected_failure' && /saving new user/i.test(authError)) {
    return 'Microsoft sign-in reached POP CRM, but the account could not be provisioned. Please ask an administrator to check your CRM access.'
  }

  return authError
}
