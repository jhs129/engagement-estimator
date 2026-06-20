import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'
import { updateQuestionSchema } from '@/types/team'

async function verifyOwnership(estimateId: string, userId: string, role: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: { createdById: true },
  })
  if (!estimate) return null
  if (estimate.createdById !== userId && role !== 'ADMIN') return null
  return estimate
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, qid } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const question = await prisma.question.updateMany({
    where: { id: qid, estimateId: id },
    data: parsed.data,
  })

  if (question.count === 0) return Response.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.question.findUnique({ where: { id: qid } })
  return Response.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, qid } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.question.deleteMany({ where: { id: qid, estimateId: id } })
  return Response.json({ success: true })
}
