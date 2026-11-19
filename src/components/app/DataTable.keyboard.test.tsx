/**
 * @vitest-environment happy-dom
 *
 * Keyboard access (issue #60). The row-opening cell renders a real <button>,
 * so Tab reaches it and activating it opens the record; editable cells are
 * tab stops where Enter/F2 open the editor; the fill handle copies the value
 * down one row from the keyboard.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'

type Row = { id: string; name: string; status: string }

const ROWS: Row[] = [
  { id: '1', name: 'Alpha', status: 'NEW' },
  { id: '2', name: 'Bravo', status: 'ACTIVE' },
]

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Name', opensDetail: true, sortValue: (r) => r.name, cell: (r) => r.name },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => r.status,
    editValue: (r) => r.status,
    editOptions: [
      { value: 'NEW', label: 'New' },
      { value: 'ACTIVE', label: 'Active' },
    ],
    cell: (r) => r.status,
  },
]

const editableTd = () => document.querySelectorAll('td[data-row-index="0"]')[1] as HTMLElement

const fillHandle = () => screen.getAllByRole('button', { name: 'Drag to copy down' })[0]

describe('DataTable keyboard access', () => {
  afterEach(cleanup)

  it('renders the row-opening cell as a real focusable button that fires onRowClick', () => {
    const onRowClick = vi.fn()
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onRowClick={onRowClick} />)

    const button = screen.getByRole('button', { name: 'Alpha' })
    button.focus()
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
  })

  it('Enter on the focused row button fires onRowClick', () => {
    const onRowClick = vi.fn()
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onRowClick={onRowClick} />)

    const button = screen.getByRole('button', { name: 'Alpha' })
    // A native button is what makes Enter/Space activate it in a real browser.
    expect(button.tagName).toBe('BUTTON')
    button.focus()
    // happy-dom does not emulate that default action, so play the sequence a
    // real browser runs for Enter on a focused button.
    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.click(button)
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
  })

  it('Enter and F2 on a focused editable cell open the editor', () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onCellEdit={vi.fn()} />)

    const td = editableTd()
    expect(td.tabIndex).toBe(0)
    td.focus()
    expect(document.activeElement).toBe(td)

    fireEvent.keyDown(td, { key: 'Enter' })
    expect(screen.getByRole('button', { name: 'Active' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })

    fireEvent.keyDown(td, { key: 'F2' })
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy()
  })

  it('Enter on the fill handle copies the value down one row', async () => {
    const onCellEdit = vi.fn()
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onCellEdit={onCellEdit} />)

    fireEvent.keyDown(fillHandle(), { key: 'Enter' })
    await vi.waitFor(() => expect(onCellEdit).toHaveBeenCalledTimes(1))
    expect(onCellEdit).toHaveBeenCalledWith(ROWS[1], 'status', 'NEW')
  })

  it('gives the header search input an accessible name', () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} />)
    expect(screen.getByRole('textbox', { name: 'Search Name' })).toBeTruthy()
  })
})
