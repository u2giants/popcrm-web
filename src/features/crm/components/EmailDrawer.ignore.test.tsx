/**
 * @vitest-environment happy-dom
 *
 * Issue #53: the EmailDrawer "Create ignore rule" button is no longer a
 * one-click write. A subject too short or made only of reply/forward
 * prefixes is refused outright; anything else opens a confirm dialog showing
 * the exact pattern and how many stored emails it would match, and only the
 * dialog's confirm creates the rule.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CrmEmailMessage } from '@/lib/types'

const toasts = { error: vi.fn(), success: vi.fn() }
vi.mock('sonner', () => ({ toast: toasts }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/crm/components/CustomerLogoField', () => ({
  CustomerLogoField: () => null,
}))

const createIgnoreRule = vi.fn()

vi.mock('@/features/crm/queries', () => ({
  listData: <T,>(data: T[] | undefined): T[] => data ?? [],
  useEmailsQuery: vi.fn(() => ({ data: [] })),
  useEmailsForQuery: vi.fn(() => ({ rows: [], total: 0, isLoading: false, isError: false, refetch: vi.fn() })),
  useMeetingsQuery: vi.fn(() => ({ data: [] })),
  useNotesQuery: vi.fn(() => ({ data: [] })),
  useTasksQuery: vi.fn(() => ({ data: [] })),
  useDepartmentsQuery: vi.fn(() => ({ data: [] })),
  useIngestedContactsQuery: vi.fn(() => ({ data: [] })),
  useOpportunitiesQuery: vi.fn(() => ({ data: [] })),
  useCustomerPickerQuery: vi.fn(() => ({ data: [] })),
  useAllContactsQuery: vi.fn(() => ({ data: [] })),
  useCustomerIngestedDomainsQuery: vi.fn(() => ({ data: [] })),
  useUpdateContactMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useMergeContactsMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveContactMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useCreateIgnoreRuleMutation: vi.fn(() => ({ mutateAsync: createIgnoreRule, isPending: false })),
  useUpdateEmailMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDefunctContactsQuery: vi.fn(() => ({ data: {} })),
  useSetContactDefunctMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

const countEmailsMatchingSubject = vi.fn()
vi.mock('@/features/crm/api', () => ({ countEmailsMatchingSubject }))
// ContactDrawer (mounted empty by EmailDrawer) reads the auth context.
vi.mock('@/auth/auth', () => ({ useAuth: vi.fn(() => ({ user: { roles: ['administrator'] } })) }))

const { EmailDrawer } = await import('./EmailDrawer')

beforeEach(() => {
  vi.clearAllMocks()
  countEmailsMatchingSubject.mockResolvedValue(0)
})

afterEach(cleanup)

function email(overrides: Partial<CrmEmailMessage> & { id: string }): CrmEmailMessage {
  return {
    subject: null,
    sender: 'jane@acme.example',
    recipients: 'team@popcre.com',
    received_at: '2026-11-18T10:00:00Z',
    routing_status: 'UNROUTED',
    routing_method: 'MANUAL',
    body_preview: 'Preview text',
    retailer: null,
    department: null,
    opportunity: null,
    ...overrides,
  } as CrmEmailMessage
}

function openDrawer(row: CrmEmailMessage) {
  render(<EmailDrawer row={row} onClose={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Create ignore rule' }))
}

describe('EmailDrawer ignore rule (issue #53)', () => {
  it.each(['Re:', 'Fwd:', 'ok'])('refuses the subject "%s" outright', async (subject) => {
    openDrawer(email({ id: 'e1', subject }))
    expect(screen.queryByText('Create this subject rule?')).toBeNull()
    expect(createIgnoreRule).not.toHaveBeenCalled()
    await waitFor(() => expect(toasts.error).toHaveBeenCalled())
  })

  it('requires confirm, shows the pattern and match count, then creates the rule', async () => {
    countEmailsMatchingSubject.mockResolvedValueOnce(7)
    createIgnoreRule.mockResolvedValueOnce(undefined)
    openDrawer(email({ id: 'e1', subject: 'Spring line review' }))

    // The dialog names the exact pattern and the stored-email match count;
    // nothing is created before the confirm click.
    expect(screen.getByText('Create this subject rule?')).toBeTruthy()
    expect(screen.getAllByText(/Spring line review/).length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getByText('Matches 7 stored email messages right now.')).toBeTruthy())
    expect(createIgnoreRule).not.toHaveBeenCalled()
    expect(countEmailsMatchingSubject).toHaveBeenCalledWith('Spring line review')

    fireEvent.click(screen.getByRole('button', { name: 'Create rule' }))
    await waitFor(() =>
      expect(createIgnoreRule).toHaveBeenCalledWith({
        name: 'Spring line review',
        pattern: 'Spring line review',
        rule_type: 'SUBJECT',
        match_type: 'CONTAINS',
        emails_skipped: 0,
      }),
    )
    await waitFor(() => expect(screen.queryByText('Create this subject rule?')).toBeNull())
  })

  it('cancel does not create the rule', async () => {
    countEmailsMatchingSubject.mockResolvedValueOnce(0)
    openDrawer(email({ id: 'e1', subject: 'Spring line review' }))
    await waitFor(() => expect(screen.getByText('Create this subject rule?')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Create this subject rule?')).toBeNull())
    expect(createIgnoreRule).not.toHaveBeenCalled()
  })
})
