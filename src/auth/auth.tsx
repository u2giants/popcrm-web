import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, signInWithMicrosoft } from '@/lib/supabase'
import type { AppUser } from '@/lib/types'

interface AuthState {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithMicrosoft: () => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

interface ProfileRow {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  roles: string[] | null
  crm_access: boolean | null
}

function toAppUser(profile: ProfileRow | null, fallback: { id: string; email: string | null }): AppUser {
  // app.profile may not be provisioned yet for a brand-new SSO user; fall back to
  // the auth identity so the app still renders (RLS will simply yield empty data).
  if (!profile) {
    return { id: fallback.id, name: null, first_name: null, last_name: null, email: fallback.email, avatar: null, role: null, roles: [] }
  }
  const parts = (profile.display_name ?? '').trim().split(/\s+/).filter(Boolean)
  const first = parts.length ? parts[0] : null
  const last = parts.length > 1 ? parts.slice(1).join(' ') : null
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (!session) {
      setUser(null)
      return
    }
    try {
      const { data, error } = await supabase.schema('api').rpc('current_user_profile')
      if (error) throw error
      setUser(toAppUser((data as ProfileRow | null) ?? null, { id: session.user.id, email: session.user.email ?? null }))
    } catch {
      // Session is valid but the profile contract failed — keep the user signed in.
      setUser(toAppUser(null, { id: session.user.id, email: session.user.email ?? null }))
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
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithMicrosoft, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
