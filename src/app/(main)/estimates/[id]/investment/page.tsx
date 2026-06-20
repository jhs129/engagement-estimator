import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InvestmentGrid } from '@/components/InvestmentGrid'
import { calculateInvestmentSummary } from '@/lib/calculations/investment'
import type { InvestmentMemberRow } from '@/components/InvestmentGrid/types'

const DEFAULT_RISK_PREMIUM_PCT = 0.15

interface InvestmentPageData {
  rows: InvestmentMemberRow[]
  riskPremiumPct: number
  totalRackFeesTM: number
  totalClientInvestmentTM: number
  totalRackFeesFixed: number
  totalClientInvestmentFixed: number
}

async function fetchInvestmentData(estimateId: string): Promise<InvestmentPageData> {
  const empty: InvestmentPageData = {
    rows: [],
    riskPremiumPct: DEFAULT_RISK_PREMIUM_PCT,
    totalRackFeesTM: 0,
    totalClientInvestmentTM: 0,
    totalRackFeesFixed: 0,
    totalClientInvestmentFixed: 0,
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const { getAuthedUser } = await import('@/lib/api-auth')

    const user = await getAuthedUser()
    if (!user) return empty

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { createdById: true, riskPremiumPct: true },
    })
    if (!estimate) return empty
    if (estimate.createdById !== user.id && user.role !== 'ADMIN') return empty

    const riskPremiumPct = estimate.riskPremiumPct ?? DEFAULT_RISK_PREMIUM_PCT

    const [teamMembers, staffingAllocations] = await Promise.all([
      prisma.teamMember.findMany({
        where: { estimateId },
        orderBy: { order: 'asc' },
        include: { laborRole: true },
      }),
      prisma.storyStaffing.findMany({
        where: {
          story: {
            estimateId,
            disabled: false,
          },
        },
        select: { teamMemberId: true, hours: true },
      }),
    ])

    // Sum planned hours per team member from non-disabled story staffing allocations
    const plannedHoursMap: Record<string, number> = {}
    for (const alloc of staffingAllocations) {
      plannedHoursMap[alloc.teamMemberId] = (plannedHoursMap[alloc.teamMemberId] ?? 0) + alloc.hours
    }

    // Build InvestmentMemberRow for each team member
    const summaryInputs = teamMembers.map((m) => {
      const title =
        m.targetedResource ??
        m.titleOverride ??
        m.laborRole?.fullTitle ??
        m.id.slice(0, 4).toUpperCase()
      const abbreviation =
        m.abbreviationOverride ?? m.laborRole?.abbreviation ?? m.id.slice(0, 4).toUpperCase()
      const rackRate = m.rackRateOverride ?? m.laborRole?.rackRate ?? 0
      const plannedHours = plannedHoursMap[m.id] ?? 0

      return {
        teamMemberId: m.id,
        title,
        abbreviation,
        plannedHours,
        rackRate,
        adjustedClientRate: m.adjustedClientRate,
      }
    })

    const summary = calculateInvestmentSummary(summaryInputs, riskPremiumPct)

    const rows: InvestmentMemberRow[] = summary.members.map((m, i) => ({
      teamMemberId: m.teamMemberId,
      title: summaryInputs[i].title,
      abbreviation: summaryInputs[i].abbreviation,
      plannedHours: m.plannedHours,
      rackRate: m.rackRate,
      rackFees: m.rackFees,
      adjustedClientRate: m.adjustedClientRate,
      effectiveRate: m.effectiveRate,
      clientInvestment: m.clientInvestment,
    }))

    return {
      rows,
      riskPremiumPct,
      totalRackFeesTM: summary.totalRackFeesTM,
      totalClientInvestmentTM: summary.totalClientInvestmentTM,
      totalRackFeesFixed: summary.totalRackFeesFixed,
      totalClientInvestmentFixed: summary.totalClientInvestmentFixed,
    }
  } catch {
    return empty
  }
}

export default async function InvestmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const {
    rows,
    riskPremiumPct,
    totalRackFeesTM,
    totalClientInvestmentTM,
    totalRackFeesFixed,
    totalClientInvestmentFixed,
  } = await fetchInvestmentData(id)

  return (
    <InvestmentGrid
      estimateId={id}
      initialRows={rows}
      riskPremiumPct={riskPremiumPct}
      totalRackFeesTM={totalRackFeesTM}
      totalClientInvestmentTM={totalClientInvestmentTM}
      totalRackFeesFixed={totalRackFeesFixed}
      totalClientInvestmentFixed={totalClientInvestmentFixed}
    />
  )
}
