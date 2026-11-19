/**
 * @vitest-environment happy-dom
 *
 * #58: a search group that failed must be reported, not rendered as "no
 * matches". Group independence stays (one bad group cannot blank the rest),
 * so the palette carries the notice.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CrmSearchResults } from '@/features/crm/api'

const searchResults: { value: CrmSearchResults } = {
  value: { customers: [], contacts: [], opportunities: [], emails: [], failedGroups: [] },
}

vi.mock('@/features/crm/api', () => ({
  searchCrm: vi.fn(async () => searchResults.value),
}))

const { CommandSearch } = await import('./CommandSearch')

function renderOpen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CommandSearch open onClose={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  // The search query only runs for a non-empty term.
  fireEvent.change(screen.getByPlaceholderText('Search customers, contacts, programs, email…'), {
    target: { value: 'acme' },
  })
}

afterEach(cleanup)

describe('CommandSearch failed groups (#58)', () => {
  it('renders the healthy groups plus an incomplete-results notice', async () => {
    searchResults.value = {
      customers: [{ id: 'c1', name: 'Acme', is_potential: false } as CrmSearchResults['customers'][number]],
      contacts: [],
      opportunities: [],
      emails: [],
      failedGroups: ['emails'],
    }

    renderOpen()
    await waitFor(() => expect(screen.getByText('Acme')).toBeTruthy())

    expect(screen.getByText('Some sections failed to load; results may be incomplete.')).toBeTruthy()
    expect(screen.queryByText(/No matches/)).toBeNull()
  })

  it('says search failed when every group failed, instead of "no matches"', async () => {
    searchResults.value = {
      customers: [],
      contacts: [],
      opportunities: [],
      emails: [],
      failedGroups: ['customers', 'contacts', 'opportunities', 'emails'],
    }

    renderOpen()
    await waitFor(() =>
      expect(screen.getByText('Search failed. Some sections could not be loaded — try again.')).toBeTruthy(),
    )
    expect(screen.queryByText(/No matches/)).toBeNull()
  })

  it('keeps the plain empty state when nothing failed', async () => {
    searchResults.value = {
      customers: [],
      contacts: [],
      opportunities: [],
      emails: [],
      failedGroups: [],
    }

    renderOpen()
    await waitFor(() => expect(screen.getByText(/No matches/)).toBeTruthy())
    expect(screen.queryByText(/failed to load/i)).toBeNull()
  })
})
