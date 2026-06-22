import { AuthProvider, useAuth } from '@/auth/auth'
import { LoginPage } from '@/pages/LoginPage'
import { AppRoutes } from '@/app/routes'
import { useCrmRealtimeInvalidation } from '@/features/crm/realtime'

function Gate() {
  const { user, loading } = useAuth()
  useCrmRealtimeInvalidation(!!user)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }
  if (!user) return <LoginPage />

  return <AppRoutes />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
