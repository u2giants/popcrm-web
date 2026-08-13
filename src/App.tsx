import { useEffect, useRef, useState } from 'react'
import { AuthProvider, useAuth } from '@/auth/auth'
import { readAuthCallbackError } from '@/auth/callbackError'
import { LoginPage } from '@/pages/LoginPage'
import { AppRoutes } from '@/app/routes'
import { useCrmRealtimeInvalidation } from '@/features/crm/realtime'

function AuthCallbackError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed left-1/2 top-4 z-[100] w-[calc(100vw-32px)] max-w-[560px] -translate-x-1/2 rounded-[8px] border border-chip-danger bg-chip-danger px-4 py-3 text-sm text-chip-danger-fg shadow-lg" role="alert">
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 leading-5">{message}</p>
        <button
          type="button"
          className="shrink-0 rounded-[6px] px-2 py-0.5 text-xs font-medium hover:bg-black/5"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  // Read the callback error during the first render rather than setting state
  // from an effect: the effect version rendered once without the banner and
  // then again with it, which is the flash the user sees and the reason
  // react-hooks/set-state-in-effect flagged it.
  const [authError, setAuthError] = useState<string | null>(readAuthCallbackError)
  useCrmRealtimeInvalidation(!!user)

  // Whether this load arrived with error material in the URL, captured before
  // Dismiss can clear the state.
  const arrivedWithError = useRef(authError !== null)

  useEffect(() => {
    // Strip the error material from the URL, but only when there was some —
    // otherwise this rewrites every deep link on load.
    if (!arrivedWithError.current) return
    window.history.replaceState({}, document.title, window.location.pathname || '/')
  }, [])

  const authErrorBanner = authError ? (
    <AuthCallbackError message={authError} onDismiss={() => setAuthError(null)} />
  ) : null

  if (loading) {
    return (
      <>
        {authErrorBanner}
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      </>
    )
  }
  if (!user) {
    return (
      <>
        {authErrorBanner}
        <LoginPage />
      </>
    )
  }

  return (
    <>
      {authErrorBanner}
      <AppRoutes />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
