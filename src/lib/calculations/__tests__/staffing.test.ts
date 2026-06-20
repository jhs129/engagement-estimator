import { describe, it, expect } from 'vitest'
import { calculateStaffingDelta, calculateBalanceCheck } from '../staffing'

describe('calculateStaffingDelta', () => {
  it('returns green when within 10%', () => {
    const result = calculateStaffingDelta(100, 105)
    expect(result.status).toBe('green')
    expect(result.delta).toBe(5)
  })

  it('returns yellow when between 10% and 25%', () => {
    const result = calculateStaffingDelta(100, 120)
    expect(result.status).toBe('yellow')
  })

  it('returns red when over 25%', () => {
    const result = calculateStaffingDelta(100, 135)
    expect(result.status).toBe('red')
  })

  it('returns green when both are zero', () => {
    const result = calculateStaffingDelta(0, 0)
    expect(result.status).toBe('green')
    expect(result.delta).toBe(0)
  })

  it('handles negative delta (overstaffed)', () => {
    const result = calculateStaffingDelta(100, 70)
    expect(result.delta).toBe(-30)
    expect(result.status).toBe('red')
  })

  it('returns planned and staffed hours unchanged', () => {
    const result = calculateStaffingDelta(200, 180)
    expect(result.plannedHours).toBe(200)
    expect(result.staffedHours).toBe(180)
  })
})

describe('calculateBalanceCheck', () => {
  it('returns none when both are zero', () => {
    expect(calculateBalanceCheck(0, 0)).toBe('none')
    expect(calculateBalanceCheck(null, 0)).toBe('none')
  })

  it('returns green when within 10%', () => {
    expect(calculateBalanceCheck(100, 105)).toBe('green')
  })

  it('returns yellow when between 10% and 25%', () => {
    expect(calculateBalanceCheck(100, 120)).toBe('yellow')
  })

  it('returns red when over 25%', () => {
    expect(calculateBalanceCheck(100, 135)).toBe('red')
  })

  it('treats null meanHours as 0', () => {
    // null mean and non-zero staffing — base = 50, diff = 50 => 100% => red
    expect(calculateBalanceCheck(null, 50)).toBe('red')
  })

  it('exact 10% boundary is green', () => {
    expect(calculateBalanceCheck(100, 110)).toBe('green')
  })

  it('exact 25% boundary is yellow', () => {
    // diff=25, base=125, 25/125 = 0.2 <= 0.25 => yellow
    expect(calculateBalanceCheck(100, 125)).toBe('yellow')
  })
})
