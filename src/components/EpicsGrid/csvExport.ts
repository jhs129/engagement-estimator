import type { EpicRow } from './types'

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportEpicsToCsv(rows: EpicRow[], estimateId: string): void {
  const header = ['#', 'EpicName', 'Description', 'StoryHours', 'FoundationHours', 'TotalHours', 'Percent']
  const lines: string[] = [header.map(escapeCsvCell).join(',')]

  rows.forEach((row, index) => {
    const cells = [
      String(index + 1),
      row.name,
      row.description ?? '',
      String(row.storyHours),
      String(row.foundationHours),
      String(row.totalHours),
      `${row.percent.toFixed(1)}%`,
    ]
    lines.push(cells.map(escapeCsvCell).join(','))
  })

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `epics-${estimateId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
