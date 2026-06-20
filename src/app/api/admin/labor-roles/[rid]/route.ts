import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'
import { updateLaborRoleSchema } from '@/types/team'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ rid: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { rid } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateLaborRoleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const existing = await prisma.laborRole.findUnique({ where: { id: rid } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.laborRole.update({
    where: { id: rid },
    data: parsed.data,
  })

  return Response.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ rid: string }> }
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { rid } = await params

  const existing = await prisma.laborRole.findUnique({ where: { id: rid } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.laborRole.delete({ where: { id: rid } })
  return Response.json({ success: true })
}
