/**
 * @vitest-environment happy-dom
 *
 * Bulk assignment safety: Apply never fires with no salesperson chosen,
 * clearing in bulk is confirmed with the department count named before
 * anything is sent, and a bulk action only reaches ticked rows that are
 * still visible after the filter or search changes.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AdminUser, AssignableDepartment } from './api'

const mutateAsync = vi.fn()

const users: AdminUser[] = [
  {
    id: 'sales-1',
    email: 'holly@pop.example',
    display_name: 'Holly Price',
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
    id: 'sales-2',
    email: 'rob@pop.example',
    display_name: 'Rob Lowe',
    avatar_url: null,
    status: 'active',
    created_at: null,
    last_sign_in_at: null,
    roles: ['sales'],
    apps: ['crm'],
    crm_access: true,
    department_count: 0,
  },
]

function department(id: string, name: string, customerName: string, main: string | null): AssignableDepartment {
  return {
    id,
    name,
    division: null,
    category: null,
    status: null,
    is_active: true,
    customer_id: `c-${customerName}`,
    customer_name: customerName,
    customer_display_name: null,
    customer_status: null,
    salesperson_profile_id: main,
    secondary_salesperson_profile_id: null,
  }
}

const departments: AssignableDepartment[] = [
  department('d1', 'Boys', 'Acme', 'sales-1'),
  department('d2', 'Girls', 'Acme', null),
  department('d3', 'Toys', 'Beta', null),
]

vi.mock('@/features/admin/queries', () => ({
  useAdminUsersQuery: vi.fn(() => ({ data: users, isLoading: false })),
  useDepartmentAssignmentsQuery: vi.fn(() => ({
    data: departments,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useSetDepartmentSalespeopleMutation: vi.fn(() => ({ mutateAsync, isPending: false })),
}))

const { AssignmentsPanel } = await import('./AssignmentsPanel')

afterEach(cleanup)

function tick(name: string) {
  fireEvent.click(screen.getByRole('checkbox', { name: `Select ${name}` }))
}

describe('AssignmentsPanel bulk actions', () => {
  it('keeps Apply disabled with no salesperson and clears only after confirming the count', async () => {
    mutateAsync.mockResolvedValueOnce(2)
    render(<AssignmentsPanel />)

    tick('Boys')
    tick('Girls')

    const apply = screen.getByRole('button', { name: 'Apply (2)' }) as HTMLButtonElement
    expect(apply.disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Clear assignments' }))
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.getByText('Clear both salespeople from 2 departments?')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear 2 departments' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ ids: ['d1', 'd2'], profileIds: [] }))
  })

  it('sends only the ticked rows that survive the current search', async () => {
    mutateAsync.mockResolvedValueOnce(1)
    render(<AssignmentsPanel />)

    tick('Boys')
    tick('Girls')
    tick('Toys')

    fireEvent.change(screen.getByPlaceholderText('Search customer or department…'), { target: { value: 'Beta' } })
    expect(screen.getByText('1 selected')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear assignments' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear 1 department' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ ids: ['d3'], profileIds: [] }))
  })
})
