import type { InvestmentMemberRow } from './types'

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportInvestmentToCsv(
  rows: InvestmentMemberRow[],
  estimateId: string,
  totalHoursTM: number,
  totalRackFeesTM: number,
  totalClientInvestmentTM: number,
  totalRackFeesFixed: number,
  totalClientInvestmentFixed: number
): void {
  const header = [
    '#',
    'Title',
    'Abbreviation',
    'Hours',
    'BlendedRackRate',
    'RackFees',
    'AdjustedClientRate',
    'EffectiveRate',
    'ClientInvestment',
  ]
  const lines: string[] = [header.map(escapeCsvCell).join(',')]

  rows.forEach((row, index) => {
    const cells = [
      String(index + 1),
      row.title,
      row.abbreviation,
      String(row.plannedHours),
      String(row.rackRate),
      String(row.rackFees),
      row.adjustedClientRate !== null ? String(row.adjustedClientRate) : '',
      String(row.effectiveRate),
      String(row.clientInvestment),
    ]
    lines.push(cells.map(escapeCsvCell).join(','))
  })

  // T&M total row
  const tmCells = [
    '',
    'Total (T&M)',
    '',
    String(totalHoursTM),
    '',
    String(totalRackFeesTM),
    '',
    '',
    String(totalClientInvestmentTM),
  ]
  lines.push(tmCells.map(escapeCsvCell).join(','))

  // Fixed fee total row
  const fixedCells = [
    '',
    'Total (Fixed Fee)',
    '',
    '',
    '',
    String(totalRackFeesFixed),
    '',
    '',
    String(totalClientInvestmentFixed),
  ]
  lines.push(fixedCells.map(escapeCsvCell).join(','))

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `investment-${estimateId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
