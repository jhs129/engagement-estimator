import type { StaffingMemberRow } from './types'

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportStaffingToCsv(
  rows: StaffingMemberRow[],
  weekColumns: string[],
  estimateId: string
): void {
  const header = [
    '#',
    'Title',
    'Abbreviation',
    'PlannedHours',
    'StaffedHours',
    'StaffingDelta',
    ...weekColumns,
  ]

  const lines: string[] = [header.map(escapeCsvCell).join(',')]

  rows.forEach((row, idx) => {
    const cells = [
      String(idx + 1),
      row.title,
      row.abbreviation,
      String(row.plannedHours),
      String(row.staffedHours),
      String(row.staffingDelta),
      ...weekColumns.map((wk) => String(row.weeklyHours[wk] ?? 0)),
    ]
    lines.push(cells.map(escapeCsvCell).join(','))
  })

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `staffing-${estimateId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
