/**
 * @vitest-environment happy-dom
 *
 * #58: only Supabase's invalid_credentials error may say "Wrong email or
 * password."; an outage or network failure must say sign-in is broken, not
 * blame the credentials.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const login = vi.fn()

vi.mock('@/auth/auth', () => ({
  useAuth: () => ({ login, loginWithMicrosoft: vi.fn() }),
}))

const { LoginPage } = await import('./LoginPage')

function submit() {
  render(<LoginPage />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@popcre.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in with email/i }))
}

beforeEach(() => {
  login.mockReset()
})

afterEach(cleanup)

describe('LoginPage error text (#58)', () => {
  it('blames the credentials only for Supabase invalid_credentials', async () => {
    login.mockRejectedValue({ code: 'invalid_credentials', message: 'Invalid login credentials' })

    submit()

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Wrong email or password.'))
  })

  it('reports an outage instead of blaming the password', async () => {
    login.mockRejectedValue(new TypeError('fetch failed'))

    submit()

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Sign-in is not working right now. Try again in a moment.'),
    )
    expect(screen.queryByText('Wrong email or password.')).toBeNull()
  })

  it('reports a server error instead of blaming the password', async () => {
    login.mockRejectedValue({ code: '500', message: 'Internal server error' })

    submit()

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Sign-in is not working right now. Try again in a moment.'),
    )
    expect(screen.queryByText('Wrong email or password.')).toBeNull()
  })
})
