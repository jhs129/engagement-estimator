export interface InvestmentMemberRow {
  teamMemberId: string
  title: string
  abbreviation: string
  plannedHours: number
  rackRate: number
  rackFees: number
  adjustedClientRate: number | null
  effectiveRate: number
  clientInvestment: number
}

export interface InvestmentGridProps {
  estimateId: string
  initialRows: InvestmentMemberRow[]
  riskPremiumPct: number
  totalRackFeesTM: number
  totalClientInvestmentTM: number
  totalRackFeesFixed: number
  totalClientInvestmentFixed: number
}

export type SaveState = 'idle' | 'saving' | 'error'
