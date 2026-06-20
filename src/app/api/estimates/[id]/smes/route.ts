import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'
import { z } from 'zod'

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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const owned = await verifyOwnership(id, user.id, user.role)
  if (!owned) return Response.json({ error: 'Not found' }, { status: 404 })

  const smes = await prisma.estimateSme.findMany({
    where: { estimateId: id },
    orderBy: { order: 'asc' },
  })
  return Response.json(smes)
}

const createSmeSchema = z.object({
  name: z.string(),
  domain: z.string().nullable().optional(),
  order: z.number().int().min(0),
})

export async function POST(
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

  const parsed = createSmeSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const sme = await prisma.estimateSme.create({
    data: {
      estimateId: id,
      name: parsed.data.name,
      domain: parsed.data.domain ?? null,
      order: parsed.data.order,
    },
  })
  return Response.json(sme, { status: 201 })
}
