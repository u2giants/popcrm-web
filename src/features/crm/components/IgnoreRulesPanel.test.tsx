/**
 * @vitest-environment happy-dom
 *
 * Issue #53: creating a not-customer rule is validated (URL-shaped domains
 * are normalised, duplicates refused, short/prefix-only subjects refused,
 * double Enter inserts once), and a rule can be deleted — but only through
 * the confirm dialog. The real queries.ts hooks run against a mocked api, so
 * the cache update that removes the row is exercised too.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CrmIgnoreRule } from '@/lib/types'

const toasts = { error: vi.fn(), success: vi.fn() }
vi.mock('sonner', () => ({ toast: toasts }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/crm/components/CustomerLogoField', () => ({
  CustomerLogoField: () => null,
}))

// Live rule store the mocked api serves; deleting through the api mutates it,
// so the post-delete refetch agrees with the optimistic cache removal.
let currentRules: CrmIgnoreRule[] = []
const api = {
  fetchIgnoreRules: vi.fn(async () => currentRules),
  createIgnoreRule: vi.fn(),
  deleteIgnoreRule: vi.fn(async (id: string) => {
    currentRules = currentRules.filter((rule) => rule.id !== id)
  }),
  countEmailsMatchingSubject: vi.fn(async () => 0),
}
vi.mock('@/features/crm/api', () => api)

const { IgnoreRulesPanel } = await import('./IgnoreRulesPanel')

beforeEach(() => {
  vi.clearAllMocks()
  currentRules = []
})

afterEach(cleanup)

function rule(overrides: Partial<CrmIgnoreRule> & { id: string }): CrmIgnoreRule {
  return {
    name: overrides.pattern ?? null,
    pattern: null,
    match_type: 'EXACT',
    emails_skipped: 0,
    rule_type: 'SUBJECT',
    ...overrides,
  }
}

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <IgnoreRulesPanel />
    </QueryClientProvider>,
  )
}

function setField(labelText: string, value: string) {
  fireEvent.input(screen.getByLabelText(labelText), { target: { value } })
}

// The Add button that belongs to the labelled input (each input row has its
// own; subject uses "Add rule").
function addBeside(labelText: string, buttonName: string) {
  const field = screen.getByLabelText(labelText)
  const row = field.parentElement
  if (!row) throw new Error(`no container for ${labelText}`)
  return within(row).getByRole('button', { name: buttonName })
}

describe('IgnoreRulesPanel add validation (issue #53)', () => {
  it('normalises a URL-shaped domain before storing it', async () => {
    api.createIgnoreRule.mockResolvedValueOnce(rule({ id: 'r1', pattern: 'acme.com', rule_type: 'DOMAIN' }))
    renderPanel()
    await waitFor(() => expect(screen.getByText('No not-customer rules yet.')).toBeTruthy())

    setField('Domain', 'https://www.acme.com/')
    fireEvent.click(addBeside('Domain', 'Add'))

    await waitFor(() => expect(api.createIgnoreRule).toHaveBeenCalledTimes(1))
    expect(api.createIgnoreRule).toHaveBeenCalledWith(
      expect.objectContaining({ pattern: 'acme.com', rule_type: 'DOMAIN', match_type: 'EXACT' }),
    )
  })

  it('refuses a duplicate rule without calling the api', async () => {
    currentRules = [rule({ id: 'r1', pattern: 'acme.com', rule_type: 'DOMAIN' })]
    renderPanel()
    await waitFor(() => expect(screen.getByText('acme.com')).toBeTruthy())

    setField('Domain', 'acme.com')
    fireEvent.click(addBeside('Domain', 'Add'))

    await waitFor(() => expect(toasts.error).toHaveBeenCalledWith('That not-customer rule already exists', expect.anything()))
    expect(api.createIgnoreRule).not.toHaveBeenCalled()
  })

  it('refuses a subject pattern that is too short or only reply prefixes', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText('No not-customer rules yet.')).toBeTruthy())

    for (const value of ['Re:', 'Fwd:', 'ok']) {
      setField('Subject pattern', value)
      fireEvent.click(addBeside('Subject pattern', 'Add rule'))
      await waitFor(() => expect(toasts.error).toHaveBeenCalled())
      expect(api.createIgnoreRule).not.toHaveBeenCalled()
      toasts.error.mockClear()
    }
  })

  it('inserts only one rule when Enter is pressed twice', async () => {
    api.createIgnoreRule.mockImplementationOnce(() => new Promise(() => {}))
    renderPanel()
    await waitFor(() => expect(screen.getByText('No not-customer rules yet.')).toBeTruthy())

    setField('Domain', 'acme.com')
    const field = screen.getByLabelText('Domain')
    fireEvent.keyDown(field, { key: 'Enter' })
    fireEvent.keyDown(field, { key: 'Enter' })

    await waitFor(() => expect(api.createIgnoreRule).toHaveBeenCalledTimes(1))
  })
})

describe('IgnoreRulesPanel delete (issue #53)', () => {
  it('deletes a rule only after the confirm dialog names it, and removes the row', async () => {
    currentRules = [
      rule({ id: 'r1', pattern: 'noreply@acme.com', rule_type: 'EMAIL_ADDRESS' }),
      rule({ id: 'r2', pattern: 'acme.com', rule_type: 'DOMAIN' }),
    ]
    renderPanel()
    await waitFor(() => expect(screen.getByText('noreply@acme.com')).toBeTruthy())

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    // One click never deletes: the dialog names the pattern first.
    expect(screen.getByText('Delete this not-customer rule?')).toBeTruthy()
    expect(screen.getAllByText(/noreply@acme\.com/).length).toBeGreaterThan(1)
    expect(api.deleteIgnoreRule).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Delete rule' }))
    // TanStack passes a context object as the second mutationFn argument.
    await waitFor(() => expect(api.deleteIgnoreRule).toHaveBeenCalledTimes(1))
    expect(api.deleteIgnoreRule.mock.calls[0]?.[0]).toBe('r1')
    await waitFor(() => expect(screen.queryByText('noreply@acme.com')).toBeNull())
    expect(screen.getByText('acme.com')).toBeTruthy()
  })

  it('cancel keeps the rule', async () => {
    currentRules = [rule({ id: 'r1', pattern: 'acme.com', rule_type: 'DOMAIN' })]
    renderPanel()
    await waitFor(() => expect(screen.getByText('acme.com')).toBeTruthy())

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Delete this not-customer rule?')).toBeNull())
    expect(api.deleteIgnoreRule).not.toHaveBeenCalled()
    expect(screen.getByText('acme.com')).toBeTruthy()
  })
})
