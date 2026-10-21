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
})
