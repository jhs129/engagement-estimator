import { describe, it, expect } from 'vitest'
import { calculateInvestmentSummary } from '../investment'

describe('calculateInvestmentSummary', () => {
  it('calculates rack fees and client investment correctly', () => {
    const members = [
      { teamMemberId: 'tm-1', plannedHours: 100, rackRate: 200, adjustedClientRate: null },
    ]
    const result = calculateInvestmentSummary(members, 0.15)

    expect(result.members[0].rackFees).toBe(20000)
    expect(result.members[0].effectiveRate).toBe(200)
    expect(result.members[0].clientInvestment).toBe(20000)
    expect(result.totalRackFeesTM).toBe(20000)
    expect(result.totalClientInvestmentTM).toBe(20000)
    expect(result.totalRackFeesFixed).toBeCloseTo(23000)
    expect(result.totalClientInvestmentFixed).toBeCloseTo(23000)
  })

  it('uses adjustedClientRate when provided', () => {
    const members = [
      { teamMemberId: 'tm-1', plannedHours: 100, rackRate: 200, adjustedClientRate: 150 },
    ]
    const result = calculateInvestmentSummary(members, 0)

    expect(result.members[0].effectiveRate).toBe(150)
    expect(result.members[0].clientInvestment).toBe(15000)
    expect(result.members[0].rackFees).toBe(20000)
    expect(result.totalRackFeesTM).toBe(20000)
    expect(result.totalClientInvestmentTM).toBe(15000)
  })

  it('applies risk premium multiplier correctly', () => {
    const members = [
      { teamMemberId: 'tm-1', plannedHours: 10, rackRate: 100, adjustedClientRate: null },
    ]
    const result = calculateInvestmentSummary(members, 0.10)

    expect(result.totalRackFeesTM).toBe(1000)
    expect(result.totalRackFeesFixed).toBeCloseTo(1100)
  })

  it('handles multiple team members', () => {
    const members = [
      { teamMemberId: 'tm-1', plannedHours: 100, rackRate: 200, adjustedClientRate: null },
      { teamMemberId: 'tm-2', plannedHours: 50, rackRate: 300, adjustedClientRate: 250 },
    ]
    const result = calculateInvestmentSummary(members, 0)

    expect(result.totalRackFeesTM).toBe(100 * 200 + 50 * 300)
    expect(result.totalClientInvestmentTM).toBe(100 * 200 + 50 * 250)
  })

  it('handles empty members array', () => {
    const result = calculateInvestmentSummary([], 0.15)

    expect(result.members).toHaveLength(0)
    expect(result.totalRackFeesTM).toBe(0)
    expect(result.totalClientInvestmentTM).toBe(0)
    expect(result.totalRackFeesFixed).toBe(0)
    expect(result.totalClientInvestmentFixed).toBe(0)
  })

  it('handles zero planned hours', () => {
    const members = [
      { teamMemberId: 'tm-1', plannedHours: 0, rackRate: 200, adjustedClientRate: null },
    ]
    const result = calculateInvestmentSummary(members, 0.15)

    expect(result.members[0].rackFees).toBe(0)
    expect(result.members[0].clientInvestment).toBe(0)
    expect(result.totalRackFeesTM).toBe(0)
    expect(result.totalRackFeesFixed).toBe(0)
  })
})
