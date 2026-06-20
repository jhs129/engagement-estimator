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

const staffingUpsertSchema = z.object({
  allocations: z.array(
    z.object({
      teamMemberId: z.string().min(1),
      hours: z.number().min(0),
    })
  ),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, sid } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  const staffing = await prisma.storyStaffing.findMany({
    where: { storyId: sid },
    include: { teamMember: true },
  })

  return Response.json(staffing)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, sid } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = staffingUpsertSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const results = await Promise.all(
    parsed.data.allocations.map(alloc =>
      prisma.storyStaffing.upsert({
        where: {
          storyId_teamMemberId: { storyId: sid, teamMemberId: alloc.teamMemberId },
        },
        create: { storyId: sid, teamMemberId: alloc.teamMemberId, hours: alloc.hours },
        update: { hours: alloc.hours },
      })
    )
  )

  return Response.json(results)
}
