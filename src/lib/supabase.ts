import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// The shared enterprise Supabase project (see u2giants/shared-db). Per-env via
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Preview branch first, then prod.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).',
  )
}

// CRM reads go through the `api` views, writes through `crm` tables / `api` RPCs.
// The default PostgREST schema stays `public`; callers pick a schema with
// supabase.schema('api' | 'crm') as needed.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Microsoft (Entra) SSO via Supabase Azure provider. Returns into the SPA origin.
export function signInWithMicrosoft(returnTo = window.location.origin + '/') {
  return supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email openid profile', redirectTo: returnTo },
  })
}
