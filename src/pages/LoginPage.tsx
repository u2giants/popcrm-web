import { useState } from 'react'
import { Route } from 'lucide-react'
import { useAuth } from '@/auth/auth'
import { microsoftLoginUrl } from '@/lib/directus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
    } catch {
      setError('Wrong email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-svh bg-background">
      {/* Left — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          {/* Brand mark (shown on mobile / small viewports where panel is hidden) */}
          <div className="mb-[28px] flex items-center gap-[10px] lg:hidden">
            <div
              className="flex size-[36px] items-center justify-center rounded-[10px]"
              style={{ background: 'linear-gradient(150deg, oklch(0.62 0.17 300), oklch(0.45 0.17 300))' }}
            >
              <Route className="size-[18px] text-white" />
            </div>
            <span className="text-[18px] font-[700] tracking-[-0.02em] text-foreground">POP CRM</span>
          </div>

          <h1 className="text-[22px] font-[700] tracking-[-0.025em] text-foreground">Sign in</h1>
          <p className="mt-[4px] text-[13px] text-muted-foreground">
            Customer, sales &amp; licensing operations
          </p>

          <div className="mt-[28px] space-y-[14px]">
            {/* Microsoft SSO — primary */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => (window.location.href = microsoftLoginUrl())}
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with email
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Email / password fallback */}
            <form onSubmit={onSubmit} className="space-y-[10px]">
              <div className="grid gap-[5px]">
                <Label htmlFor="login-email" className="text-[12.5px]">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@popcreations.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-[5px]">
                <Label htmlFor="login-password" className="text-[12.5px]">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <p
                  className="rounded-[8px] bg-chip-danger px-[10px] py-[8px] text-[12.5px] text-chip-danger-fg"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <Button type="submit" variant="outline" className="w-full" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in with email'}
              </Button>
            </form>
          </div>

          <p className="mt-[28px] text-center text-[11.5px] text-muted-foreground">
            POP Creations · internal tool
          </p>
        </div>
      </div>

      {/* Right — brand panel (lg+) */}
      <div
        className="hidden w-[440px] shrink-0 flex-col justify-between px-[48px] py-[52px] lg:flex"
        style={{ background: 'oklch(0.185 0.022 256)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-[12px]">
          <div
            className="flex size-[40px] items-center justify-center rounded-[11px]"
            style={{ background: 'linear-gradient(150deg, oklch(0.62 0.17 300), oklch(0.44 0.17 300))' }}
          >
            <Route className="size-[20px] text-white" />
          </div>
          <span className="text-[20px] font-[700] tracking-[-0.02em] text-white">POP CRM</span>
        </div>

        {/* Center content */}
        <div>
          <p className="text-[28px] font-[700] leading-snug tracking-[-0.025em] text-white">
            Accounts, pipeline &amp; licensing — one place.
          </p>
          <p className="mt-[14px] text-[13.5px] leading-relaxed" style={{ color: 'oklch(0.75 0.04 256)' }}>
            Email routing, AI summaries, approval threads and meeting notes all connected to your retailer accounts.
          </p>

          {/* Mini stat chips */}
          <div className="mt-[28px] flex flex-wrap gap-[8px]">
            {[
              { label: 'Email routing', color: 'oklch(0.62 0.16 25)' },
              { label: 'AI summaries', color: 'oklch(0.62 0.17 300)' },
              { label: 'Fireflies meetings', color: 'oklch(0.66 0.15 60)' },
              { label: 'Licensor approvals', color: 'oklch(0.60 0.16 340)' },
              { label: 'Pipeline board', color: 'oklch(0.60 0.15 200)' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="rounded-full px-[10px] py-[4px] text-[12px] font-[500]"
                style={{
                  background: `color-mix(in oklch, ${chip.color} 20%, oklch(0.185 0.022 256))`,
                  color: chip.color,
                  border: `1px solid color-mix(in oklch, ${chip.color} 35%, transparent)`,
                }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11.5px]" style={{ color: 'oklch(0.55 0.02 256)' }}>
          POP Creations · internal use only
        </p>
      </div>
    </div>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" fill="none" className="shrink-0">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
