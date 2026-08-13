/**
 * @vitest-environment happy-dom
 *
 * Provider-level auth tests. `refreshGate.test.ts` proves the ordering rules in
 * isolation; these prove the provider actually wires them up — the class of bug
 * a pure-helper test cannot see, such as a disposed gate surviving StrictMode's
 * mount / unmount / remount and leaving every refresh rejected.
 */
import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type AuthCallback = (event: string, session: { user: { id: string } } | null) => void

let currentSession: { user: { id: string; email: string } } | null = null
let authCallback: AuthCallback = () => {}
let profileResolvers: Array<(value: { data: unknown; error: unknown }) => void> = []
let profileMode: 'immediate' | 'deferred' = 'immediate'

const rpc = vi.fn(() => {
  if (profileMode === 'immediate') {
    return Promise.resolve({
      data: { id: 'user-a', email: 'a@popcre.com', display_name: 'User A', avatar_url: null, roles: ['sales'], crm_access: true },
      error: null,
    })
  }
  return new Promise<{ data: unknown; error: unknown }>((resolve) => profileResolvers.push(resolve))
})

vi.mock('@/lib/supabase', () => ({
  signInWithMicrosoft: vi.fn(),
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: currentSession } }),
      onAuthStateChange: (cb: AuthCallback) => {
        authCallback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    schema: () => ({ rpc }),
  },
}))

const { AuthProvider, useAuth } = await import('./auth')

function Probe() {
  const { user, loading } = useAuth()
  if (loading) return <p>loading</p>
  return <p>user:{user ? user.id : 'none'}</p>
}

beforeEach(() => {
  currentSession = { user: { id: 'user-a', email: 'a@popcre.com' } }
  profileResolvers = []
  profileMode = 'immediate'
  rpc.mockClear()
  sessionStorage.clear()
})

describe('AuthProvider', () => {
  it('renders the signed-in user under StrictMode, which mounts, unmounts and remounts', async () => {
    render(
      <StrictMode>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </StrictMode>,
    )

    // The regression this guards: the first simulated unmount disposed the
    // refresh gate, and because the ref survives the remount every later
    // refresh was rejected and this stayed on "user:none" forever.
    await waitFor(() => expect(screen.getByText('user:user-a')).toBeTruthy())
  })

  it('does not restore the signed-out user when a slow profile response lands after sign-out', async () => {
    profileMode = 'deferred'
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(profileResolvers.length).toBe(1))

    // Sign out while that profile call is still in flight. The initial refresh
    // has not resolved yet, so the provider is still in its loading state.
    currentSession = null
    authCallback('SIGNED_OUT', null)
    expect(screen.getByText('loading')).toBeTruthy()

    // The stale response now arrives, carrying the signed-out user's profile.
    profileResolvers[0]({
      data: { id: 'user-a', email: 'a@popcre.com', display_name: 'User A', avatar_url: null, roles: ['sales'], crm_access: true },
      error: null,
    })

    // It must be discarded: the app stays signed out.
    await waitFor(() => expect(screen.getByText('user:none')).toBeTruthy())
  })
})
