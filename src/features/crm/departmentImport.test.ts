import { describe, expect, it } from 'vitest'
import { parseCsv, planDepartmentImport, sentenceCase } from './departmentImport'

describe('department import', () => {
  it('parses quoted headers', () => {
    expect(parseCsv('"LIDL US, LLC",B\nX,\n')).toEqual([['LIDL US, LLC', 'B'], ['X', '']])
  })
  it('sentence-cases names', () => {
    expect(sentenceCase('NON LICENSED  WALL')).toBe('Non licensed wall')
    expect(sentenceCase('dmm')).toBe('DMM')
  })
  it('matches customers, skips existing and blanks, reports unmatched', () => {
    const csv = 'AAFES,"LIDL US, LLC",Nobody,Empty\nCLOCKS,GMM,DMM,\nGMM,,,\n'
    const plan = planDepartmentImport(
      csv,
      [{ id: 'a', name: 'aafes' }, { id: 'l', name: 'Lidl', display_name: 'LIDL US, LLC' }],
      [{ customerId: 'a', name: 'Clocks' }],
    )
    expect(plan.existing).toBe(1)
    expect(plan.toCreate).toEqual([
      { customerId: 'a', customerName: 'aafes', name: 'GMM' },
      { customerId: 'l', customerName: 'LIDL US, LLC', name: 'GMM' },
    ])
    expect(plan.unmatchedCustomers).toEqual(['Nobody'])
  })
  it('reports a name shared by two customers as unmatched instead of picking one', () => {
    const csv = 'Shared\nCLOCKS\nGMM\n'
    const plan = planDepartmentImport(
      csv,
      [{ id: 'a', name: 'Shared' }, { id: 'b', name: 'shared' }],
      [],
    )
    expect(plan.toCreate).toEqual([])
    expect(plan.unmatchedCustomers).toEqual(['Shared'])
  })
  it('reports a name matching one customer’s name and another’s display name as unmatched', () => {
    const csv = 'FYE\nDVD\n'
    const plan = planDepartmentImport(
      csv,
      [{ id: 'a', name: 'Transworld', display_name: 'FYE' }, { id: 'b', name: 'FYE' }],
      [],
    )
    expect(plan.toCreate).toEqual([])
    expect(plan.unmatchedCustomers).toEqual(['FYE'])
  })
  it('keeps a name unique to one customer matched even when that customer has both name and display name', () => {
    const csv = 'Lidl\nBakery\n'
    const plan = planDepartmentImport(
      csv,
      [{ id: 'l', name: 'Lidl', display_name: 'LIDL US' }, { id: 'x', name: 'Other' }],
      [],
    )
    expect(plan.toCreate).toEqual([{ customerId: 'l', customerName: 'LIDL US', name: 'Bakery' }])
    expect(plan.unmatchedCustomers).toEqual([])
  })
})
