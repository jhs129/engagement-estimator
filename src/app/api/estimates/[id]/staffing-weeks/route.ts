import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'

async function verifyOwnership(estimateId: string, userId: string, role: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: { createdById: true },
  })
  if (!estimate) return null
  if (estimate.createdById !== userId && role !== 'ADMIN') return null
  return estimate
}

const staffingWeeksUpsertSchema = z.object({
  weeks: z.array(
    z.object({
      teamMemberId: z.string().min(1),
      weekStartDate: z.string().datetime(),
      hours: z.number().min(0),
    })
  ),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    select: { teamMembers: { select: { id: true } } },
  })

  if (!estimate) return Response.json({ error: 'Not found' }, { status: 404 })

  const teamMemberIds = estimate.teamMembers.map(m => m.id)

  const weeks = await prisma.staffingWeek.findMany({
    where: { teamMemberId: { in: teamMemberIds } },
    orderBy: [{ teamMemberId: 'asc' }, { weekStartDate: 'asc' }],
  })

  return Response.json(weeks)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = staffingWeeksUpsertSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const results = await Promise.all(
    parsed.data.weeks.map(week =>
      prisma.staffingWeek.upsert({
        where: {
          teamMemberId_weekStartDate: {
            teamMemberId: week.teamMemberId,
            weekStartDate: new Date(week.weekStartDate),
          },
        },
        create: {
          teamMemberId: week.teamMemberId,
          weekStartDate: new Date(week.weekStartDate),
          hours: week.hours,
        },
        update: { hours: week.hours },
      })
    )
  )

  return Response.json(results)
}
