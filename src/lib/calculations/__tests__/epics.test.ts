import { describe, it, expect } from 'vitest'
import { calculateEpicSummaries } from '../epics'

const defaultRatios = {
  ratioQAToDev: 0.20,
  ratioTestCaseAuthoring: 0.10,
  ratioDefectFixing: 0.25,
  ratioAlphaTesting: 0.20,
  ratioUAT: 0.10,
}

describe('calculateEpicSummaries', () => {
  it('calculates story hours per epic', () => {
    const epics = [
      { id: 'epic-1', isFoundation: false },
      { id: 'epic-2', isFoundation: true },
    ]
    const stories = [
      { epicId: 'epic-1', disabled: false, testable: false, estimateMean: 10 },
      { epicId: 'epic-1', disabled: false, testable: false, estimateMean: 20 },
      { epicId: 'epic-2', disabled: false, testable: false, estimateMean: 5 },
    ]

    const results = calculateEpicSummaries(epics, stories, 'epic-qa', defaultRatios)
    const epic1 = results.find(r => r.epicId === 'epic-1')!
    expect(epic1.storyHours).toBe(30)
    expect(epic1.foundationHours).toBe(0)
    expect(epic1.totalHours).toBe(30)
  })

  it('adds QA foundation hours to the QA epic', () => {
    const epics = [
      { id: 'epic-dev', isFoundation: false },
      { id: 'epic-qa', isFoundation: true },
    ]
    const stories = [
      { epicId: 'epic-dev', disabled: false, testable: true, estimateMean: 100 },
    ]

    const results = calculateEpicSummaries(epics, stories, 'epic-qa', defaultRatios)
    const qaEpic = results.find(r => r.epicId === 'epic-qa')!
    // testable hours = 100, ratio sum = 0.20+0.10+0.25+0.20+0.10 = 0.85
    expect(qaEpic.foundationHours).toBeCloseTo(85)
    expect(qaEpic.totalHours).toBeCloseTo(85)
  })

  it('excludes disabled stories', () => {
    const epics = [{ id: 'epic-1', isFoundation: false }]
    const stories = [
      { epicId: 'epic-1', disabled: false, testable: false, estimateMean: 10 },
      { epicId: 'epic-1', disabled: true, testable: false, estimateMean: 100 },
    ]

    const results = calculateEpicSummaries(epics, stories, 'epic-qa', defaultRatios)
    expect(results[0].storyHours).toBe(10)
  })

  it('handles null estimateMean as zero', () => {
    const epics = [{ id: 'epic-1', isFoundation: false }]
    const stories = [
      { epicId: 'epic-1', disabled: false, testable: false, estimateMean: null },
    ]

    const results = calculateEpicSummaries(epics, stories, 'epic-qa', defaultRatios)
    expect(results[0].storyHours).toBe(0)
    expect(results[0].totalHours).toBe(0)
  })

  it('returns empty array for no epics', () => {
    const results = calculateEpicSummaries([], [], 'epic-qa', defaultRatios)
    expect(results).toHaveLength(0)
  })

  it('QA foundation only counts testable stories', () => {
    const epics = [
      { id: 'epic-dev', isFoundation: false },
      { id: 'epic-qa', isFoundation: true },
    ]
    const stories = [
      { epicId: 'epic-dev', disabled: false, testable: false, estimateMean: 100 },
      { epicId: 'epic-dev', disabled: false, testable: true, estimateMean: 50 },
    ]

    const results = calculateEpicSummaries(epics, stories, 'epic-qa', defaultRatios)
    const qaEpic = results.find(r => r.epicId === 'epic-qa')!
    // Only the testable 50 hours count toward QA foundation
    expect(qaEpic.foundationHours).toBeCloseTo(50 * 0.85)
  })
})
