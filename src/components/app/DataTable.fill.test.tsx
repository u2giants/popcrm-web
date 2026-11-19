/**
 * @vitest-environment happy-dom
 *
 * Spreadsheet drag-to-copy fill. While dragging the fill handle, every mouse
 * move used to call setFill with a fresh object even when the hovered row had
 * not changed, re-rendering the whole table on each move. The guard returns the
 * previous state object for an unchanged row index, and React then skips the
 * re-render — observable here as the cell renderer not being called again
 * (issue #46).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'

type Row = { id: string; name: string; status: string }

const ROWS: Row[] = [
  { id: '1', name: 'Alpha', status: 'NEW' },
  { id: '2', name: 'Bravo', status: 'NEW' },
  { id: '3', name: 'Charlie', status: 'ACTIVE' },
]

// Render probe: called once per row on every re-render of the body.
const nameCell = vi.fn((r: Row) => r.name)

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Name', sortValue: (r) => r.name, cell: nameCell },
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

const rowTd = (index: number) => document.querySelector(`td[data-row-index="${index}"]`) as HTMLElement

// The fill handle of the first row's editable cell.
const fillHandle = () => screen.getAllByRole('button', { name: 'Drag to copy down' })[0]

describe('DataTable drag-fill state', () => {
  afterEach(() => {
    cleanup()
    nameCell.mockClear()
    vi.restoreAllMocks()
  })

  it('mouse moves over the same row do not change the fill state', () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onCellEdit={vi.fn()} />)
    const elementFromPoint = vi.spyOn(document, 'elementFromPoint')

    fireEvent.mouseDown(fillHandle())
    // The mousedown itself starts a fill, which re-renders once.
    const afterDown = nameCell.mock.calls.length
    expect(afterDown).toBeGreaterThan(0)

    // Same row index: setFill must return the previous object. React may still
    // render once before bailing on a same-value update, so absorb that first
    // move — every further move over the same row must be a no-op.
    elementFromPoint.mockReturnValue(rowTd(0))
    fireEvent.mouseMove(window, { clientX: 10, clientY: 10 })
    const settled = nameCell.mock.calls.length
    fireEvent.mouseMove(window, { clientX: 11, clientY: 11 })
    fireEvent.mouseMove(window, { clientX: 12, clientY: 12 })
    expect(nameCell.mock.calls.length).toBe(settled)

    // A different row index still updates the fill (and re-renders).
    elementFromPoint.mockReturnValue(rowTd(2))
    fireEvent.mouseMove(window, { clientX: 20, clientY: 20 })
    expect(nameCell.mock.calls.length).toBeGreaterThan(afterDown)

    fireEvent.mouseUp(window)
  })

  it('a drag over the source row only writes nothing, a drag to another row copies the value', async () => {
    // Source row 1 (NEW); hovering row 1 itself keeps the range at one row,
    // whose value already equals the copied one, so nothing is written.
    const stationary = vi.fn()
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onCellEdit={stationary} />)
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(rowTd(0))
    fireEvent.mouseDown(fillHandle())
    fireEvent.mouseMove(window, { clientX: 10, clientY: 10 })
    fireEvent.mouseUp(window)
    expect(stationary).not.toHaveBeenCalled()
    cleanup()
    nameCell.mockClear()

    // Dragging down to row 3 copies NEW over Charlie's ACTIVE.
    const copied = vi.fn()
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onCellEdit={copied} />)
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(rowTd(2))
    fireEvent.mouseDown(fillHandle())
    fireEvent.mouseMove(window, { clientX: 20, clientY: 20 })
    fireEvent.mouseUp(window)
    await vi.waitFor(() => expect(copied).toHaveBeenCalledTimes(1))
    expect(copied).toHaveBeenCalledWith(ROWS[2], 'status', 'NEW')
  })
})
