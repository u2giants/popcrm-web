/**
 * @vitest-environment happy-dom
 *
 * searchCrm fires four requests per term, so the command palette debounces the
 * typed term: five rapid keystrokes must produce exactly one search, with the
 * full term, once typing pauses for the debounce window (issue #46).
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const searchCrm = vi.fn(async () => ({ customers: [], contacts: [], opportunities: [], emails: [] }))

vi.mock('@/features/crm/api', () => ({ searchCrm }))
vi.mock('@/features/crm/queries', () => ({
  crmQueryDefaults: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false },
}))

const { CommandSearch } = await import('./CommandSearch')

function renderPalette() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CommandSearch open onClose={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CommandSearch debounce', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('five rapid keystrokes make one searchCrm call with the full term', async () => {
    vi.useFakeTimers()
    renderPalette()
    const input = screen.getByRole('textbox')
    for (const ch of ['a', 'b', 'c', 'd', 'e']) {
      await act(async () => {
        fireEvent.change(input, { target: { value: `${(input as HTMLInputElement).value}${ch}` } })
      })
    }

    // During and just before the debounce window nothing is searched.
    expect(searchCrm).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(249)
    })
    expect(searchCrm).not.toHaveBeenCalled()

    // One pause-worth of typing produced exactly one call, with the full term.
    await vi.waitFor(() => expect(searchCrm).toHaveBeenCalledTimes(1))
    expect(searchCrm).toHaveBeenCalledWith('abcde', 10)
  })
})
