/**
 * @vitest-environment happy-dom
 *
 * Issue #48 step 2: a null last sign-in must read "Never". formatDate returns
 * an em dash for null, so the old `formatDate(x) || 'Never'` could never show
 * "Never" — the fallback was dead code behind a truthy em dash.
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AdminUser } from './api'

const users: AdminUser[] = [
  {
    id: 'u-1',
    email: 'never@pop.example',
    display_name: 'Never Signed In',
    avatar_url: null,
    status: 'active',
    created_at: null,
    last_sign_in_at: null,
    roles: ['sales'],
    apps: ['crm'],
    crm_access: true,
    department_count: 0,
  },
  {
    id: 'u-2',
    email: 'once@pop.example',
    display_name: 'Signed In Once',
    avatar_url: null,
    status: 'active',
    created_at: null,
    // 2026-11-01T15:00:00Z is 10:00 AM EST on Nov 1 in New York — and Nov 1
    // under UTC too, so the expected label holds in any runner timezone.
    last_sign_in_at: '2026-11-01T15:00:00Z',
    roles: ['sales'],
    apps: ['crm'],
    crm_access: true,
    department_count: 1,
  },
]

vi.mock('@/auth/auth', () => ({
  useAuth: vi.fn(() => ({ user: null, realUser: null, isAdmin: false, impersonating: false, logout: vi.fn() })),
}))

vi.mock('@/features/admin/queries', () => ({
  useAdminUsersQuery: vi.fn(() => ({ data: users, isLoading: false, isError: false, error: null, refetch: vi.fn() })),
  useAdminRolesQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateAdminUserMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

const { PeoplePanel } = await import('./PeoplePanel')

afterEach(cleanup)

describe('PeoplePanel last sign-in column', () => {
  it('renders Never for a null last sign-in', () => {
    render(<PeoplePanel />)
    expect(screen.getByText('Never')).toBeTruthy()
  })

  it('renders the formatted date when the user has signed in', () => {
    render(<PeoplePanel />)
    expect(screen.getByText('Nov 1, 2026')).toBeTruthy()
  })
})
