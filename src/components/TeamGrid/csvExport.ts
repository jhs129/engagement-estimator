import type { TeamMemberRow, LaborRoleOption } from './types'

function escapeCsvCell(value: string | null | undefined): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTeamToCsv(
  rows: TeamMemberRow[],
  laborRoles: LaborRoleOption[],
  estimateId: string
): void {
  const header = ['#', 'Title', 'AbbreviationOverride', 'Abbreviation', 'RackRate', 'TargetedResource']
  const lines: string[] = [header.map(escapeCsvCell).join(',')]

  rows.forEach((row, index) => {
    const role = laborRoles.find((lr) => lr.id === row.laborRoleId)
    const title = row.titleOverride ?? role?.fullTitle ?? ''
    const abbreviation = row.abbreviationOverride ?? role?.abbreviation ?? ''
    const rackRate = row.rackRateOverride ?? (role ? role.rackRate : null)

    const cells = [
      String(index + 1),
      title,
      row.abbreviationOverride ?? '',
      abbreviation,
      rackRate !== null ? String(rackRate) : '',
      row.targetedResource ?? '',
    ]
    lines.push(cells.map(escapeCsvCell).join(','))
  })

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `team-${estimateId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
