interface TeamMemberInvestment {
  teamMemberId: string
  plannedHours: number
  rackRate: number
  adjustedClientRate: number | null
  rackFees: number
  effectiveRate: number
  clientInvestment: number
}

interface InvestmentSummary {
  members: TeamMemberInvestment[]
  totalRackFeesTM: number
  totalClientInvestmentTM: number
  totalRackFeesFixed: number
  totalClientInvestmentFixed: number
}

export function calculateInvestmentSummary(
  members: { teamMemberId: string; plannedHours: number; rackRate: number; adjustedClientRate: number | null }[],
  riskPremiumPct: number
): InvestmentSummary {
  const calculated = members.map(m => {
    const rackFees = m.plannedHours * m.rackRate
    const effectiveRate = m.adjustedClientRate ?? m.rackRate
    const clientInvestment = m.plannedHours * effectiveRate
    return { ...m, rackFees, effectiveRate, clientInvestment }
  })

  const totalRackFeesTM = calculated.reduce((s, m) => s + m.rackFees, 0)
  const totalClientInvestmentTM = calculated.reduce((s, m) => s + m.clientInvestment, 0)
  const multiplier = 1 + riskPremiumPct

  return {
    members: calculated,
    totalRackFeesTM,
    totalClientInvestmentTM,
    totalRackFeesFixed: totalRackFeesTM * multiplier,
    totalClientInvestmentFixed: totalClientInvestmentTM * multiplier,
  }
}
