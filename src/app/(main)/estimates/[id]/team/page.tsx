import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TeamGrid } from '@/components/TeamGrid'
import type { TeamMemberRow, LaborRoleOption } from '@/components/TeamGrid/types'

interface FetchResult {
  rows: TeamMemberRow[]
  laborRoles: LaborRoleOption[]
}

async function fetchTeamData(estimateId: string): Promise<FetchResult> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { getAuthedUser } = await import('@/lib/api-auth')

    const user = await getAuthedUser()
    if (!user) return { rows: [], laborRoles: [] }

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { createdById: true },
    })
    if (!estimate) return { rows: [], laborRoles: [] }
    if (estimate.createdById !== user.id && user.role !== 'ADMIN') return { rows: [], laborRoles: [] }

    const [members, roles] = await Promise.all([
      prisma.teamMember.findMany({
        where: { estimateId },
        orderBy: { order: 'asc' },
        include: { laborRole: true },
      }),
      prisma.laborRole.findMany({
        where: { isActive: true },
        orderBy: { fullTitle: 'asc' },
      }),
    ])

    const rows: TeamMemberRow[] = members.map((m) => ({
      id: m.id,
      laborRoleId: m.laborRoleId,
      laborRoleName: m.laborRole?.fullTitle ?? null,
      titleOverride: m.titleOverride,
      abbreviationOverride: m.abbreviationOverride,
      rackRateOverride: m.rackRateOverride,
      adjustedClientRate: m.adjustedClientRate,
      targetedResource: m.targetedResource,
      order: m.order,
    }))

    const laborRoles: LaborRoleOption[] = roles.map((r) => ({
      id: r.id,
      fullTitle: r.fullTitle,
      abbreviation: r.abbreviation,
      rackRate: r.rackRate,
    }))

    return { rows, laborRoles }
  } catch {
    return { rows: [], laborRoles: [] }
  }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const { rows, laborRoles } = await fetchTeamData(id)

  return <TeamGrid estimateId={id} initialRows={rows} laborRoles={laborRoles} />
}
