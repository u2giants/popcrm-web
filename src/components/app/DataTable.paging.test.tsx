/**
 * @vitest-environment happy-dom
 *
 * Table-state bugs (issue #45): the pager kept the previous tab's page when one
 * table serves several tabs, a filter tick built from trimmed values hid rows
 * stored with stray spaces, the funnel trigger could not close its own popover
 * (outside pointerdown closed it, the click reopened it), and fixed-position
 * overlays did not follow scroll.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DataTable, type Column } from './DataTable'

type Row = { id: string; name: string }

const ROWS: Row[] = Array.from({ length: 6 }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }))

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Name', sortValue: (r) => r.name, filterValue: (r) => r.name, cell: (r) => r.name },
]

function table(rows: Row[], resetKey?: string) {
  return (
    <DataTable
      rows={rows}
      columns={COLUMNS}
      getRowId={(r) => r.id}
      pageSize={2}
      resetKey={resetKey}
      initialSort={{ key: 'name', dir: 'asc' }}
    />
  )
}

const pagerText = () => document.querySelector('.border-t span')?.textContent ?? ''

describe('DataTable pager resets (issue #45 step 1)', () => {
  afterEach(cleanup)

  it('a resetKey change (tab switch) returns to page 1', () => {
    const view = render(table(ROWS, 'tab-a'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('3 / 3')).toBeTruthy()

    view.rerender(table(ROWS, 'tab-b'))
    expect(screen.getByText('1 / 3')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('a row-count change returns to page 1', () => {
    const view = render(table(ROWS))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('3 / 3')).toBeTruthy()

    const grown = [...ROWS, ...Array.from({ length: 6 }, (_, i) => ({ id: `g${i}`, name: `Grown ${i}` }))]
    view.rerender(table(grown))
    expect(screen.getByText('1 / 6')).toBeTruthy()
  })

  it('paging still works when nothing resets it', () => {
    render(table(ROWS))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('2 / 3')).toBeTruthy()
    expect(pagerText()).toBe('3–4 of 6')
  })
})

describe('DataTable filter value comparison (issue #45 step 2)', () => {
  afterEach(cleanup)

  it("a row stored as 'Acme ' stays visible when 'Acme' is ticked", () => {
    render(
      table([
        { id: '1', name: 'Acme ' },
        { id: '2', name: 'Beta' },
      ]),
    )
    fireEvent.click(screen.getByTitle('Filter by Name'))
    fireEvent.click(screen.getByRole('button', { name: 'Acme' }))

    const bodyRows = document.querySelectorAll('tbody tr')
    expect(bodyRows.length).toBe(1)
    expect(bodyRows[0].textContent).toContain('Acme')
  })
})

describe('DataTable filter popover toggling and overlays on scroll (issue #45 step 4)', () => {
  afterEach(cleanup)

  const popover = () => screen.queryByPlaceholderText('Search values…')
  const funnel = () => screen.getByTitle('Filter by Name')

  it('a second funnel click closes the popover instead of reopening it', () => {
    render(table(ROWS))

    fireEvent.pointerDown(funnel())
    fireEvent.click(funnel())
    expect(popover()).not.toBeNull()

    fireEvent.pointerDown(funnel())
    fireEvent.click(funnel())
    expect(popover()).toBeNull()
  })

  it('scrolling the table closes the open filter popover', () => {
    render(table(ROWS))
    fireEvent.click(funnel())
    expect(popover()).not.toBeNull()

    fireEvent.scroll(document.querySelector('.overflow-auto') as Element)
    expect(popover()).toBeNull()
  })

  it('scrolling the table closes the header autocomplete', () => {
    render(table(ROWS))
    const box = screen.getByPlaceholderText('Search…')
    fireEvent.change(box, { target: { value: 'Row' } })
    expect(document.querySelector('[data-testid="header-autocomplete"]')).not.toBeNull()

    fireEvent.scroll(document.querySelector('.overflow-auto') as Element)
    expect(document.querySelector('[data-testid="header-autocomplete"]')).toBeNull()
  })
})
