import type { QuestionRow } from './types'

function escapeCsvCell(value: string | null | undefined): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportQuestionsToCsv(rows: QuestionRow[], estimateId: string): void {
  const header = ['#', 'Type', 'Description', 'Notes/Answers']
  const lines: string[] = [header.map(escapeCsvCell).join(',')]

  rows.forEach((row, index) => {
    const cells = [
      String(index + 1),
      row.type,
      row.description,
      row.notes ?? '',
    ]
    lines.push(cells.map(escapeCsvCell).join(','))
  })

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `questions-${estimateId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
