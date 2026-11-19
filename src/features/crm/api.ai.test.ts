import { afterEach, describe, expect, it, vi } from 'vitest'

// #58: askOpportunityAi must abort after 60 s so a hung backend cannot spin
// the Ask-AI box forever, and must distinguish that timeout from an ordinary
// network failure.

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    schema: () => ({ rpc: vi.fn() }),
  },
}))

const { askOpportunityAi } = await import('./api')

// A fetch that hangs until the caller aborts it, like a real request honoring signal.
const fetchMock = vi.fn(
  (_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    }),
)

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  fetchMock.mockClear()
})

describe('askOpportunityAi timeout (#58)', () => {
  it('aborts a request that hangs longer than 60 s and says it timed out', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', fetchMock)

    const pending = askOpportunityAi('opp-1', 'what is the status?')
    // Keep the rejection inside the assertion below.
    pending.catch(() => {})
    await vi.advanceTimersByTimeAsync(59_999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)

    await expect(pending).rejects.toThrow('The AI answer took too long; try again.')
  })

  it('passes an abort signal to the request', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', fetchMock)

    const pending = askOpportunityAi('opp-1', 'what is the status?')
    pending.catch(() => {})
    await vi.advanceTimersByTimeAsync(1)

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.signal).toBeInstanceOf(AbortSignal)
    await vi.advanceTimersByTimeAsync(60_000)
    await expect(pending).rejects.toThrow('The AI answer took too long; try again.')
  })

  it('returns the answer when the request completes in time', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ answer: 'Ship it.' }) }) as unknown as Response),
    )

    await expect(askOpportunityAi('opp-1', 'what should we do?')).resolves.toBe('Ship it.')
  })

  it('propagates an ordinary network failure without calling it a timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))

    await expect(askOpportunityAi('opp-1', 'what?')).rejects.toThrow('fetch failed')
  })
})
