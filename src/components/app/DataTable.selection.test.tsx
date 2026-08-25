/**
 * @vitest-environment happy-dom
 *
 * Bulk editing from the selection bar. The value picker has to write to every
 * selected row (and only the ones whose value actually changes), and a
 * shift-click has to select the whole span in the order the table renders.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'

type Row = { id: string; name: string; status: string }

const ROWS: Row[] = [
  { id: '1', name: 'Alpha', status: 'NEW' },
  { id: '2', name: 'Bravo', status: 'NEW' },
  { id: '3', name: 'Charlie', status: 'ACTIVE' },
  { id: '4', name: 'Delta', status: 'NEW' },
]

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Name', sortValue: (r) => r.name, cell: (r) => r.name },
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

function renderTable(onCellEdit = vi.fn()) {
  render(
    <DataTable
      rows={ROWS}
      columns={COLUMNS}
      getRowId={(r) => r.id}
      onCellEdit={onCellEdit}
      selectable
      initialSort={{ key: 'name', dir: 'asc' }}
    />,
  )
  return onCellEdit
}

const rowBoxes = () =>
  screen.getAllByRole('checkbox').filter((el) => el.getAttribute('aria-label') === 'Select row')

describe('DataTable selection + bulk edit', () => {
  afterEach(cleanup)

  it('applies one value to every selected row, skipping rows already on it', async () => {
    const onCellEdit = renderTable()

    const boxes = rowBoxes()
    fireEvent.click(boxes[0]) // Alpha (NEW)
    fireEvent.click(boxes[2]) // Charlie (ACTIVE)

    expect(screen.getByText('2 selected')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Value to apply'), { target: { value: 'ACTIVE' } })
    fireEvent.click(screen.getByRole('button', { name: /apply to selected/i }))

    await waitFor(() => expect(onCellEdit).toHaveBeenCalledTimes(1))
    expect(onCellEdit).toHaveBeenCalledWith(ROWS[0], 'status', 'ACTIVE')
  })

  it('shift-click selects the whole range in rendered order', () => {
    renderTable()

    const boxes = rowBoxes()
    fireEvent.click(boxes[0])
    fireEvent.click(boxes[3], { shiftKey: true })

    expect(screen.getByText('4 selected')).toBeTruthy()
  })

  it('select-all covers every row and clearing empties the bar', () => {
    renderTable()

    fireEvent.click(screen.getByLabelText('Select all rows'))
    expect(screen.getByText('4 selected')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(screen.queryByText(/selected$/)).toBeNull()
  })
})
