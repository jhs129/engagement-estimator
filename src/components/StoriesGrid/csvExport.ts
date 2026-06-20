import type { StoryRow, EpicGroup, TeamMemberCol } from './types'

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportStoriesToCsv(
  stories: StoryRow[],
  epics: EpicGroup[],
  teamMembers: TeamMemberCol[],
  estimateId: string
): void {
  const epicMap: Record<string, string> = {}
  epics.forEach((e) => {
    epicMap[e.id] = e.name
  })

  const tmHeaders = teamMembers.map((tm) => tm.abbreviation)
  const header = [
    '#',
    'Disabled',
    'EpicName',
    'StoryTask',
    'Description',
    'Assumptions',
    'Deliverables',
    'Testable',
    'Low',
    'High',
    'Mean',
    'TotalStaffing',
    ...tmHeaders,
  ]

  const lines: string[] = [header.map(escapeCsvCell).join(',')]

  // Group stories by epic, ordered by epic order then story order
  const epicOrder: Record<string, number> = {}
  epics.forEach((e, i) => {
    epicOrder[e.id] = i
  })

  const sorted = [...stories].sort((a, b) => {
    const epicDiff = (epicOrder[a.epicId] ?? 0) - (epicOrder[b.epicId] ?? 0)
    if (epicDiff !== 0) return epicDiff
    return a.order - b.order
  })

  // Track row number within each epic
  const epicRowCounters: Record<string, number> = {}

  sorted.forEach((story) => {
    epicRowCounters[story.epicId] = (epicRowCounters[story.epicId] ?? 0) + 1
    const rowNum = epicRowCounters[story.epicId]

    const totalStaffing = teamMembers.reduce((sum, tm) => {
      const alloc = story.staffingAllocations.find((a) => a.teamMemberId === tm.id)
      return sum + (alloc?.hours ?? 0)
    }, 0)

    const tmCells = teamMembers.map((tm) => {
      const alloc = story.staffingAllocations.find((a) => a.teamMemberId === tm.id)
      return String(alloc?.hours ?? 0)
    })

    const cells = [
      String(rowNum),
      story.disabled ? 'Yes' : 'No',
      epicMap[story.epicId] ?? '',
      story.storyTask,
      story.description ?? '',
      story.assumptions ?? '',
      story.deliverables ?? '',
      story.testable ? 'Yes' : 'No',
      story.estimateLow !== null ? String(story.estimateLow) : '',
      story.estimateHigh !== null ? String(story.estimateHigh) : '',
      story.estimateMean !== null ? String(story.estimateMean) : '',
      String(totalStaffing),
      ...tmCells,
    ]

    lines.push(cells.map(escapeCsvCell).join(','))
  })

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `stories-${estimateId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
