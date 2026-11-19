/**
 * @vitest-environment happy-dom
 *
 * Issue #54: a health check that could not run must never read as healthy.
 * The Fireflies query function converts a thrown fetch into `false`, and every
 * surface reads the three states (Online / Offline / Checking) through
 * healthLabel/healthTone instead of interpreting `data` itself. The sidebar
 * here uses the real hook end to end: a rejected fetch must land on the
 * offline footer, not "All systems normal".
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { healthLabel, healthTone } from './health'

const fetchMock = vi.fn()

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

// Keep useFirefliesHealth real (the queryFn catch is under test); stub only
// the two Overview aggregates the sidebar also renders.
vi.mock('@/features/crm/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/crm/queries')>()
  return {
    ...actual,
    useOverviewCountsQuery: () => ({ data: undefined }),
    useOverviewEmailCountsQuery: () => ({ data: undefined }),
  }
})

const { useFirefliesHealth } = await import('@/features/crm/queries')
const { AppSidebar } = await import('@/components/app/AppSidebar')

function HealthProbe() {
  const query = useFirefliesHealth()
  return <span data-testid="health">{healthLabel(query)}</span>
}

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  cleanup()
})

describe('healthLabel / healthTone', () => {
  it('maps the three states: Online, Offline, Checking', () => {
    expect(healthLabel({ data: true })).toBe('Online')
    expect(healthLabel({ data: false })).toBe('Offline')
    expect(healthLabel({ data: undefined })).toBe('Checking')
  })

  it('is green only for a check that actually succeeded', () => {
    expect(healthTone({ data: true })).toBe('success')
    expect(healthTone({ data: false })).toBe('danger')
    expect(healthTone({ data: undefined })).toBe('neutral')
  })
})

describe('useFirefliesHealth query function', () => {
  it('reports Offline when the health fetch is rejected', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderWithProviders(<HealthProbe />)
    await waitFor(() => expect(screen.getByTestId('health').textContent).toBe('Offline'))
  })

  it('reports Online when the health endpoint answers ok', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    renderWithProviders(<HealthProbe />)
    await waitFor(() => expect(screen.getByTestId('health').textContent).toBe('Online'))
  })

  it('reports Offline when the health endpoint answers not ok', async () => {
    fetchMock.mockResolvedValue({ ok: false })
    renderWithProviders(<HealthProbe />)
    await waitFor(() => expect(screen.getByTestId('health').textContent).toBe('Offline'))
  })

  it('stays on Checking while the first check is in flight', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<HealthProbe />)
    expect(screen.getByTestId('health').textContent).toBe('Checking')
  })
})

describe('AppSidebar health footer', () => {
  it('shows the offline state, never All systems normal, when the check fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderWithProviders(<AppSidebar />)
    await waitFor(() => expect(screen.getByText('Check Fireflies')).toBeTruthy())
    expect(screen.queryByText('All systems normal')).toBeNull()
  })

  it('shows All systems normal when the check succeeds', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    renderWithProviders(<AppSidebar />)
    await waitFor(() => expect(screen.getByText('All systems normal')).toBeTruthy())
  })

  it('derives the host line from VITE_SUPABASE_URL instead of a literal', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://derived-demo.supabase.co')
    fetchMock.mockResolvedValue({ ok: true })
    renderWithProviders(<AppSidebar />)
    await waitFor(() => expect(screen.getByText('Supabase · derived-demo.supabase.co')).toBeTruthy())
  })

  it('shows no host line when the Supabase URL is not set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    fetchMock.mockResolvedValue({ ok: true })
    renderWithProviders(<AppSidebar />)
    await waitFor(() => expect(screen.getByText('All systems normal')).toBeTruthy())
    expect(screen.queryByText(/^Supabase · /)).toBeNull()
  })
})
