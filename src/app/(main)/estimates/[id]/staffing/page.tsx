import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StaffingGrid } from '@/components/StaffingGrid'
import { calculateStaffingDelta } from '@/lib/calculations/staffing'
import { getWeekColumns, snapToMonday, FALLBACK_START_DATE } from '@/components/StaffingGrid/weekUtils'
import type { StaffingMemberRow } from '@/components/StaffingGrid/types'

export const dynamic = 'force-dynamic'
interface StaffingPageData {
  rows: StaffingMemberRow[]
  weekColumns: string[]
  estimatedStartDate: string | null
}

async function fetchStaffingPageData(estimateId: string): Promise<StaffingPageData> {
  const empty: StaffingPageData = { rows: [], weekColumns: [], estimatedStartDate: null }

  try {
    const { prisma } = await import('@/lib/prisma')
    const { getAuthedUser } = await import('@/lib/api-auth')

    const user = await getAuthedUser()
    if (!user) return empty

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { createdById: true, estimatedStartDate: true },
    })
    if (!estimate) return empty
    if (estimate.createdById !== user.id && user.role !== 'ADMIN') return empty

    // Fetch team members, non-disabled story staffing allocations, and staffing weeks in parallel
    const [teamMembers, staffingAllocations, staffingWeeks] = await Promise.all([
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
      prisma.staffingWeek.findMany({
        where: {
          teamMember: { estimateId },
        },
        select: { teamMemberId: true, weekStartDate: true, hours: true },
      }),
    ])

    // Build plannedHours per team member from story staffing allocations
    const plannedHoursMap: Record<string, number> = {}
    staffingAllocations.forEach((alloc) => {
      plannedHoursMap[alloc.teamMemberId] =
        (plannedHoursMap[alloc.teamMemberId] ?? 0) + alloc.hours
    })

    // Build weeklyHours per team member from staffing weeks
    const weeklyHoursMap: Record<string, Record<string, number>> = {}
    staffingWeeks.forEach((sw) => {
      if (!weeklyHoursMap[sw.teamMemberId]) {
        weeklyHoursMap[sw.teamMemberId] = {}
      }
      // Convert Date to YYYY-MM-DD
      const d = sw.weekStartDate
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      weeklyHoursMap[sw.teamMemberId][iso] = sw.hours
    })

    // Build StaffingMemberRow array
    const rows: StaffingMemberRow[] = teamMembers.map((m) => {
      const abbreviation =
        m.abbreviationOverride ??
        m.laborRole?.abbreviation ??
        m.id.slice(0, 4).toUpperCase()
      const title =
        m.targetedResource ??
        m.titleOverride ??
        m.laborRole?.fullTitle ??
        abbreviation

      const plannedHours = plannedHoursMap[m.id] ?? 0
      const weeklyHours = weeklyHoursMap[m.id] ?? {}
      const staffedHours = Object.values(weeklyHours).reduce((sum, h) => sum + h, 0)
      const { delta, status } = calculateStaffingDelta(plannedHours, staffedHours)

      return {
        teamMemberId: m.id,
        title,
        abbreviation,
        plannedHours,
        staffedHours,
        staffingDelta: delta,
        deltaStatus: status,
        weeklyHours,
      }
    })

    // Determine estimatedStartDate string
    let estimatedStartDate: string | null = null
    if (estimate.estimatedStartDate) {
      const d = estimate.estimatedStartDate
      estimatedStartDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // Collect all existing week dates across all team members
    const allExistingWeeks: string[] = staffingWeeks.map((sw) => {
      const d = sw.weekStartDate
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })

    const startDate = estimatedStartDate
      ? snapToMonday(estimatedStartDate)
      : FALLBACK_START_DATE

    const weekColumns = getWeekColumns(startDate, allExistingWeeks)

    return { rows, weekColumns, estimatedStartDate }
  } catch {
    return empty
  }
}

export default async function StaffingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const { rows, weekColumns, estimatedStartDate } = await fetchStaffingPageData(id)

  return (
    <StaffingGrid
      estimateId={id}
      initialRows={rows}
      weekColumns={weekColumns}
      estimatedStartDate={estimatedStartDate}
    />
  )
}
