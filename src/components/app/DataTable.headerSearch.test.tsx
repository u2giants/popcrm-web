/**
 * @vitest-environment happy-dom
 *
 * Header quick-search on a column that displays a label rather than its raw
 * value. The autocomplete suggests labels and the filter popover lists labels,
 * so the row filter has to accept a label too — otherwise picking a suggestion
 * on Email Routing's Method / Status column returned no rows at all.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DataTable, type Column } from './DataTable'

type Row = { id: string; method: string }

const ROWS: Row[] = [
  { id: '1', method: 'DETERMINISTIC' },
  { id: '2', method: 'AI' },
  { id: '3', method: 'MANUAL' },
]

const LABELS: Record<string, string> = {
  DETERMINISTIC: 'Rule match',
  AI: 'AI classify',
  MANUAL: 'Manual',
}

const COLUMNS: Column<Row>[] = [
  {
    key: 'method',
    header: 'Method',
    sortValue: (r) => r.method,
    filterValue: (r) => r.method,
    filterLabel: (v) => LABELS[v] ?? v,
    cell: (r) => LABELS[r.method] ?? r.method,
  },
]

const renderTable = () =>
  render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} />)

const searchBox = () => screen.getByPlaceholderText('Search…')
// Body rows currently rendered (the header row lives in <thead>).
const rowCount = () => document.querySelectorAll('tbody tr').length

describe('DataTable header search on a labelled column', () => {
  afterEach(cleanup)

  it('matches the displayed label, not just the raw value', () => {
    renderTable()
    fireEvent.change(searchBox(), { target: { value: 'Rule match' } })
    expect(rowCount()).toBe(1)
    expect(document.querySelector('tbody tr td')?.textContent).toBe('Rule match')
  })

  it('still matches the raw stored value', () => {
    renderTable()
    fireEvent.change(searchBox(), { target: { value: 'DETERMIN' } })
    expect(rowCount()).toBe(1)
  })

  it('applies an autocomplete suggestion the user clicks', () => {
    renderTable()
    fireEvent.change(searchBox(), { target: { value: 'classi' } })
    fireEvent.click(screen.getByRole('button', { name: 'AI classify' }))
    expect(rowCount()).toBe(1)
  })
})
