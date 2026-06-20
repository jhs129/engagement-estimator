interface StoryRow {
  epicId: string
  disabled: boolean
  testable: boolean
  estimateMean: number | null
}

interface QARatios {
  ratioQAToDev: number
  ratioTestCaseAuthoring: number
  ratioDefectFixing: number
  ratioAlphaTesting: number
  ratioUAT: number
}

interface EpicSummary {
  epicId: string
  storyHours: number
  foundationHours: number
  totalHours: number
}

export function calculateEpicSummaries(
  epics: { id: string; isFoundation: boolean }[],
  stories: StoryRow[],
  qaEpicId: string,
  ratios: QARatios
): EpicSummary[] {
  const activeStories = stories.filter(s => !s.disabled)

  const testableHours = activeStories
    .filter(s => s.testable)
    .reduce((sum, s) => sum + (s.estimateMean ?? 0), 0)

  const qaFoundation =
    testableHours *
    (ratios.ratioQAToDev + ratios.ratioTestCaseAuthoring + ratios.ratioDefectFixing + ratios.ratioAlphaTesting + ratios.ratioUAT)

  return epics.map(epic => {
    const storyHours = activeStories
      .filter(s => s.epicId === epic.id)
      .reduce((sum, s) => sum + (s.estimateMean ?? 0), 0)
    const foundationHours = epic.id === qaEpicId ? qaFoundation : 0
    const totalHours = storyHours + foundationHours
    return { epicId: epic.id, storyHours, foundationHours, totalHours }
  })
}
