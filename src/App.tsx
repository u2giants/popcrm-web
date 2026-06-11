import { AuthProvider, useAuth } from '@/auth/auth'
import { AppShell } from '@/components/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { CrmPage } from '@/features/crm/CrmPage'

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
    <AppShell>
      <CrmPage />
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
