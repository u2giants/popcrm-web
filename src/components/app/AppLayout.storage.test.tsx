/**
 * @vitest-environment happy-dom
 *
 * Issue #44 step 2: AppLayout reads and writes theme/density preferences in
 * localStorage during its first render. When storage is unavailable (disabled,
 * private mode, quota) those calls throw, which used to blank the app on load.
 * The layout must render fully with a throwing storage, and the guard must not
 * change the normal read path: stored preferences still apply.
 *
 * localStorage is faked by replacing window.localStorage (not by spying on
 * Storage.prototype, which happy-dom does not restore reliably).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/auth/auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'u1', email: 'staff@popcre.com', first_name: 'Staff', last_name: 'User' },
    isAdmin: false,
    impersonating: null,
    stopImpersonation: vi.fn(),
    logout: vi.fn(),
    loading: false,
  })),
}))
vi.mock('@/features/crm/queries', () => ({
  crmKeys: { all: ['crm'] },
  crmQueryDefaults: {},
  useFirefliesHealth: vi.fn(() => ({ data: null })),
  useOverviewCountsQuery: vi.fn(() => ({ data: undefined })),
  useOverviewEmailCountsQuery: vi.fn(() => ({ data: undefined })),
}))

const { AppLayout } = await import('@/app/AppLayout')

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderLayout() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/customers']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="customers" element={<p>Page-content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// happy-dom exposes localStorage lazily on some Node versions (undefined at
// module scope, present by test time), so capture lazily and tolerate absence.
let realLocalStorage: Storage | undefined = window.localStorage

// Under some Node versions happy-dom ships no localStorage at all; this file
// needs a working storage to prove the "storage works" path, so install an
// in-memory one for the whole file when the environment lacks it.
beforeAll(() => {
  if (!realLocalStorage && !window.localStorage) {
    const backing = new Map<string, string>()
    const polyfill: Storage = {
      get length() {
        return backing.size
      },
      clear: () => backing.clear(),
      getItem: (k) => (backing.has(k) ? backing.get(k)! : null),
      key: (i) => Array.from(backing.keys())[i] ?? null,
      removeItem: (k) => void backing.delete(k),
      setItem: (k, v) => void backing.set(String(k), String(v)),
    }
    Object.defineProperty(window, 'localStorage', { value: polyfill, configurable: true })
    realLocalStorage = polyfill
  }
})

// Replace window.localStorage with one whose every operation throws, the way a
// browser does when storage is disabled or the quota is hit. Restored in
// afterEach.
function breakStorage() {
  const throwing = {
    getItem: () => {
      throw new Error('SecurityError: storage denied')
    },
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  } as unknown as Storage
  Object.defineProperty(window, 'localStorage', { value: throwing, configurable: true })
}

beforeEach(() => {
  realLocalStorage ??= window.localStorage
  realLocalStorage?.clear()
})

afterEach(() => {
  Object.defineProperty(window, 'localStorage', { value: realLocalStorage, configurable: true })
  realLocalStorage?.clear()
  document.documentElement.classList.remove('dark', 'density-compact')
  cleanup()
})

describe('AppLayout with unavailable localStorage', () => {
  it('still renders the sidebar, header and page content on first render', () => {
    breakStorage()

    renderLayout()

    // Sidebar (nav section + link), header (theme toggle) and routed page all
    // survive: initTheme/initDensity fell back to defaults instead of throwing.
    expect(screen.getByText('Operate')).toBeTruthy()
    expect(screen.getByText('Customers')).toBeTruthy()
    expect(screen.getByTitle('Switch to dark mode')).toBeTruthy()
    expect(screen.getByText('Page-content')).toBeTruthy()
  })

  it('keeps the system/light default instead of applying the dark class', () => {
    breakStorage()

    renderLayout()

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('density-compact')).toBe(false)
  })

  it('still toggles the theme when writes keep failing', () => {
    breakStorage()

    renderLayout()

    fireEvent.click(screen.getByTitle('Switch to dark mode'))
    expect(screen.getByTitle('Switch to light mode')).toBeTruthy()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('still applies valid stored preferences when storage works', () => {
    realLocalStorage.setItem('popcrm_theme', 'dark')
    realLocalStorage.setItem('popcrm_density', 'compact')

    renderLayout()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('density-compact')).toBe(true)
    expect(screen.getByTitle('Switch to light mode')).toBeTruthy()
  })
})
