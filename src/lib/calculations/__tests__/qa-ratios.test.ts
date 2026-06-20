import { describe, it, expect } from 'vitest'
import { calculateQAFoundationHours } from '../qa-ratios'

const defaultRatios = {
  ratioQAToDev: 0.20,
  ratioTestCaseAuthoring: 0.10,
  ratioDefectFixing: 0.25,
  ratioAlphaTesting: 0.20,
  ratioUAT: 0.10,
}

describe('calculateQAFoundationHours', () => {
  it('calculates correct breakdown for non-zero hours', () => {
    const result = calculateQAFoundationHours(100, defaultRatios)
    expect(result.qaToDev).toBe(20)
    expect(result.testCaseAuthoring).toBe(10)
    expect(result.defectFixing).toBe(25)
    expect(result.alphaTesting).toBe(20)
    expect(result.uat).toBe(10)
    expect(result.total).toBe(85)
  })

  it('returns all zeros when testable hours is zero', () => {
    const result = calculateQAFoundationHours(0, defaultRatios)
    expect(result.qaToDev).toBe(0)
    expect(result.testCaseAuthoring).toBe(0)
    expect(result.defectFixing).toBe(0)
    expect(result.alphaTesting).toBe(0)
    expect(result.uat).toBe(0)
    expect(result.total).toBe(0)
  })

  it('total equals sum of all parts', () => {
    const result = calculateQAFoundationHours(200, defaultRatios)
    const sum = result.qaToDev + result.testCaseAuthoring + result.defectFixing + result.alphaTesting + result.uat
    expect(result.total).toBe(sum)
  })

  it('works with custom ratios', () => {
    const ratios = {
      ratioQAToDev: 0.5,
      ratioTestCaseAuthoring: 0.5,
      ratioDefectFixing: 0.5,
      ratioAlphaTesting: 0.5,
      ratioUAT: 0.5,
    }
    const result = calculateQAFoundationHours(10, ratios)
    expect(result.total).toBe(25)
  })
})
