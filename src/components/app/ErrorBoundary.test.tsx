/**
 * @vitest-environment happy-dom
 *
 * Issue #44: one broken screen must not blank the whole app. These prove the
 * boundary swaps a failed subtree for a message plus a reload action, that
 * siblings outside it keep rendering, that remounting for a new pathname
 * recovers, and that chunk-load failures after a deploy offer "Reload to update".
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

// React logs every caught render error through console.error. Route the calls
// through a spy (we assert the logError line) so the test output stays clean.
let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleError.mockRestore()
  cleanup()
})

function Bomb({ message }: { message: string }): never {
  throw new Error(message)
}

// Mirrors AppLayout: nav outside the boundary, page content inside, boundary
// keyed by pathname so navigation remounts it.
function Harness({
  explode = true,
  message = 'boom',
  path = '/customers',
}: {
  explode?: boolean
  message?: string
  path?: string
}) {
  return (
    <div>
      <nav>Sidebar-marker</nav>
      <main>
        <ErrorBoundary key={path}>{explode ? <Bomb message={message} /> : <p>Page-content</p>}</ErrorBoundary>
      </main>
    </div>
  )
}

describe('ErrorBoundary', () => {
  it('renders the fallback instead of the failed screen and keeps siblings mounted', () => {
    render(<Harness />)

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('This screen could not be displayed')).toBeTruthy()
    expect(screen.getByText(/boom/)).toBeTruthy()
    expect(screen.getByText('Sidebar-marker')).toBeTruthy()
  })

  it('logs the error through logError with the area label', () => {
    render(<Harness />)

    expect(consoleError).toHaveBeenCalledWith('[ErrorBoundary:page]', expect.any(Error))
  })

  it('reloads the page when Reload is clicked', () => {
    const reload = vi.fn()
    const original = window.location
    Object.defineProperty(window, 'location', {
      value: { ...original, reload },
      configurable: true,
      writable: true,
    })

    try {
      render(<Harness />)
      fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
      expect(reload).toHaveBeenCalledOnce()
    } finally {
      Object.defineProperty(window, 'location', {
        value: original,
        configurable: true,
        writable: true,
      })
    }
  })

  it('identifies chunk-load failures and offers Reload to update', () => {
    render(
      <Harness message="Failed to fetch dynamically imported module: https://crm.designflow.app/assets/CustomersPage-abc.js" />,
    )

    expect(screen.getByText('A new version of the CRM is available')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Reload to update' }),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reload' })).toBeNull()
  })

  it('recovers when remounted for a new pathname (AppLayout keys it by location)', () => {
    const { rerender } = render(<Harness path="/customers" />)
    expect(screen.getByRole('alert')).toBeTruthy()

    rerender(<Harness explode={false} path="/tasks" />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('Page-content')).toBeTruthy()
    expect(screen.getByText('Sidebar-marker')).toBeTruthy()
  })
})
