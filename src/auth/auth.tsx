import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase, signInWithMicrosoft } from '@/lib/supabase'
import { createRefreshGate } from './refreshGate'
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

  // See ./refreshGate.ts. Every refresh takes a token and may only apply its
  // result if it is still the newest one AND the session user has not changed.
  const gateRef = useRef(createRefreshGate())

  async function refresh() {
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    const sessionUserId = session?.user.id ?? null
    const gate = gateRef.current
    const token = gate.begin(sessionUserId)

    if (!session) {
      if (gate.accepts(token, null)) setRealUser(null)
      return
    }

    const fallback = { id: session.user.id, email: session.user.email ?? null }
    try {
      const { data, error } = await supabase.schema('api').rpc('current_user_profile')
      if (error) throw error
      if (!gate.accepts(token, sessionUserId)) return
      setRealUser(toAppUser((data as ProfileRow | null) ?? null, fallback))
    } catch (error) {
      // Session is valid but the profile contract failed. Keep the user signed
      // in on the auth identity alone — but never silently: a degraded profile
      // means role-gated UI is missing and RLS will return empty data, which
      // reads exactly like "there is no data".
      console.error('auth: current_user_profile failed; rendering the degraded auth identity', error)
      if (!gate.accepts(token, sessionUserId)) return
      setRealUser(toAppUser(null, fallback))
    }
  }

  useEffect(() => {
    const gate = gateRef.current
    let active = true
    const init = async () => {
      await refresh()
      if (active) setLoading(false)
    }
    void init()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Reject every in-flight refresh synchronously, before any of them can
        // resolve and restore the signed-out user, then clear state here rather
        // than waiting for the refresh round trip.
        gate.markSession(null)
        gate.invalidate()
        setRealUser(null)
        stopImpersonation()
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        gate.markSession(session?.user.id ?? null)
        void refresh()
      }
    })
    return () => {
      active = false
      // Nothing may set state after unmount, including a refresh already in
      // flight at this moment.
      gate.dispose()
      sub.subscription.unsubscribe()
    }
  }, [])

  // Impersonation is an admin-only capability: only an administrator's session
  // ever renders as an impersonated user. Any stored value is ignored for a
  // non-admin, and the effect below also erases it so a later re-grant of admin
  // cannot silently resurrect an impersonation the user never restarted.
  const impersonating = isAdmin ? impersonatingState : null

  useEffect(() => {
    if (realUser && !isAdmin && impersonatingState) stopImpersonation()
  }, [realUser, isAdmin, impersonatingState])

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
    // Invalidate first: sign-out is the case where a stale in-flight profile is
    // most damaging, and awaiting signOut leaves a window open.
    gateRef.current.markSession(null)
    gateRef.current.invalidate()
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
