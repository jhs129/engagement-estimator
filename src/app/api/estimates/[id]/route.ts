import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'
import { updateEstimateSchema } from '@/types/estimate'

async function verifyOwnership(estimateId: string, userId: string, role: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: { createdById: true },
  })
  if (!estimate) return null
  if (estimate.createdById !== userId && role !== 'ADMIN') return null
  return estimate
}

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
    include: {
      epics: { orderBy: { order: 'asc' } },
      stories: { orderBy: { order: 'asc' } },
      teamMembers: { orderBy: { order: 'asc' }, include: { laborRole: true } },
      questions: { orderBy: { order: 'asc' } },
    },
  })

  return Response.json(estimate)
}

export async function PATCH(
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

  const parsed = updateEstimateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const data = parsed.data
  const updated = await prisma.estimate.update({
    where: { id },
    data: {
      ...data,
      estimatedStartDate: data.estimatedStartDate !== undefined
        ? (data.estimatedStartDate ? new Date(data.estimatedStartDate) : null)
        : undefined,
    },
  })

  return Response.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.estimate.delete({ where: { id } })
  return Response.json({ success: true })
}
