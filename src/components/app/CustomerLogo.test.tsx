/**
 * @vitest-environment happy-dom
 *
 * #59: a failed image load must only rule out the URL that failed. The old
 * boolean `failed` flag never reset, so a customer whose logo failed once
 * kept showing initials even after the stored logo or domain changed.
 */
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.stubEnv('VITE_LOGODEV_TOKEN', 'test-token')
const { CustomerLogo } = await import('./CustomerLogo')

afterEach(cleanup)

const img = (container: HTMLElement) => container.querySelector('img')

describe('CustomerLogo failed-source reset (#59)', () => {
  it('retries a stored logo once its URL changes', () => {
    const { container, rerender } = render(
      <CustomerLogo name="Acme" domain={null} logoUrl="https://logos.example/bad.png" variant="full" />,
    )
    expect(img(container)?.getAttribute('src')).toBe('https://logos.example/bad.png')

    // The bad URL fails: initials show instead.
    fireEvent.error(img(container)!)
    expect(img(container)).toBeNull()

    // A different stored logo is a new URL and must get a fresh attempt.
    rerender(<CustomerLogo name="Acme" domain={null} logoUrl="https://logos.example/good.png" variant="full" />)
    expect(img(container)?.getAttribute('src')).toBe('https://logos.example/good.png')
  })

  it('retries the logo.dev mark once the domain changes', () => {
    const { container, rerender } = render(<CustomerLogo name="Acme" domain="acme.com" />)
    const first = img(container)?.getAttribute('src') ?? ''
    expect(first).toContain('acme.com')

    fireEvent.error(img(container)!)
    expect(img(container)).toBeNull()

    rerender(<CustomerLogo name="Acme" domain="other.com" />)
    const second = img(container)?.getAttribute('src') ?? ''
    expect(second).toContain('other.com')
    expect(second).not.toBe(first)
  })
})
