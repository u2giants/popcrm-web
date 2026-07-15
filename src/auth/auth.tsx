import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase, signInWithMicrosoft } from '@/lib/supabase'
import type { AdminUserSummary, AppUser } from '@/lib/types'

interface AuthState {
  /** The effective identity the app renders as — the impersonated user when
   *  impersonating, otherwise the real signed-in user. */
  user: AppUser | null
  /** The actual signed-in account, regardless of impersonation. */
  realUser: AppUser | null
  /** True when the real signed-in account is an administrator. */
  isAdmin: boolean
  /** The user currently being impersonated (null when not impersonating). */
  impersonating: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithMicrosoft: () => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  startImpersonation: (target: AdminUserSummary) => void
  stopImpersonation: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const IMPERSONATE_KEY = 'popcrm_impersonate'

interface ProfileRow {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  roles: string[] | null
  crm_access: boolean | null
}

function splitName(displayName: string | null): { first: string | null; last: string | null } {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean)
  const first = parts.length ? parts[0] : null
  const last = parts.length > 1 ? parts.slice(1).join(' ') : null
  return { first, last }
}

function toAppUser(profile: ProfileRow | null, fallback: { id: string; email: string | null }): AppUser {
  // app.profile may not be provisioned yet for a brand-new SSO user; fall back to
  // the auth identity so the app still renders (RLS will simply yield empty data).
  if (!profile) {
    return { id: fallback.id, name: null, first_name: null, last_name: null, email: fallback.email, avatar: null, role: null, roles: [] }
  }
  const { first, last } = splitName(profile.display_name)
  const roles = profile.roles ?? []
  const primary = roles[0] ?? null
  return {
    id: profile.id,
    name: profile.display_name,
    first_name: first,
    last_name: last,
    email: profile.email,
    avatar: profile.avatar_url,
    role: primary ? { id: primary, name: primary } : null,
    roles,
  }
}

// Map an admin-directory row to the AppUser shape the app renders as while
// impersonating. Primary role drives role-gated UI (e.g. Email Routing).
function summaryToAppUser(s: AdminUserSummary): AppUser {
  const { first, last } = splitName(s.display_name)
  const primary = s.roles[0] ?? null
  return {
    id: s.id,
    name: s.display_name,
    first_name: first,
    last_name: last,
    email: s.email,
    avatar: s.avatar_url,
    role: primary ? { id: primary, name: primary } : null,
    roles: s.roles,
  }
}

function loadStoredImpersonation(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(IMPERSONATE_KEY)
    return raw ? (JSON.parse(raw) as AppUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [realUser, setRealUser] = useState<AppUser | null>(null)
  const [impersonatingState, setImpersonatingState] = useState<AppUser | null>(loadStoredImpersonation)
  const [loading, setLoading] = useState(true)

  const isAdmin = useMemo(() => (realUser?.roles ?? []).includes('administrator'), [realUser])

  async function refresh() {
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (!session) {
      setRealUser(null)
      return
    }
    try {
      const { data, error } = await supabase.schema('api').rpc('current_user_profile')
      if (error) throw error
      setRealUser(toAppUser((data as ProfileRow | null) ?? null, { id: session.user.id, email: session.user.email ?? null }))
    } catch {
      // Session is valid but the profile contract failed — keep the user signed in.
      setRealUser(toAppUser(null, { id: session.user.id, email: session.user.email ?? null }))
    }
  }

  useEffect(() => {
    let active = true
    const init = async () => {
      await refresh()
      if (active) setLoading(false)
    }
    void init()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        void refresh()
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Impersonation is an admin-only capability: only an administrator's session
  // ever renders as an impersonated user. Any stored value is ignored for a
  // non-admin and cleared on the next start/stop/logout.
  const impersonating = isAdmin ? impersonatingState : null

  function startImpersonation(target: AdminUserSummary) {
    if (!isAdmin) return
    const asUser = summaryToAppUser(target)
    setImpersonatingState(asUser)
    try {
      sessionStorage.setItem(IMPERSONATE_KEY, JSON.stringify(asUser))
    } catch {
      // sessionStorage may be unavailable (private mode); impersonation still
      // works for the current tab session in memory.
    }
  }

  function stopImpersonation() {
    setImpersonatingState(null)
    sessionStorage.removeItem(IMPERSONATE_KEY)
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await refresh()
  }

  async function loginWithMicrosoft() {
    const { error } = await signInWithMicrosoft()
    if (error) throw error
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
    } finally {
      stopImpersonation()
      setRealUser(null)
    }
  }

  const user = impersonating ?? realUser

  return (
    <AuthContext.Provider
      value={{
        user,
        realUser,
        isAdmin,
        impersonating,
        loading,
        login,
        loginWithMicrosoft,
        logout,
        refresh,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
