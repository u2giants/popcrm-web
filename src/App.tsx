import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/auth/auth'
import { LoginPage } from '@/pages/LoginPage'
import { AppRoutes } from '@/app/routes'
import { useCrmRealtimeInvalidation } from '@/features/crm/realtime'

function readAuthCallbackError() {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const authError = params.get('error_description') ?? hashParams.get('error_description')
  const authErrorCode = params.get('error_code') ?? hashParams.get('error_code')

  if (!authError) return null

  if (authErrorCode === 'unexpected_failure' && /saving new user/i.test(authError)) {
    return 'Microsoft sign-in reached POP CRM, but the account could not be provisioned. Please ask an administrator to check your CRM access.'
  }

  return authError
}

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
  const [authError, setAuthError] = useState<string | null>(null)
  useCrmRealtimeInvalidation(!!user)

  useEffect(() => {
    const message = readAuthCallbackError()
    if (!message) return

    setAuthError(message)
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
