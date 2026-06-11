import { AuthProvider, useAuth } from '@/auth/auth'
import { LoginPage } from '@/pages/LoginPage'
import { CrmDataProvider } from '@/features/crm/CrmDataContext'
import { AppRoutes } from '@/app/routes'

function Gate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }
  if (!user) return <LoginPage />

  return (
    <CrmDataProvider>
      <AppRoutes />
    </CrmDataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
