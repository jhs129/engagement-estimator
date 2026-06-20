import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'
import { createLaborRoleSchema } from '@/types/team'

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const roles = await prisma.laborRole.findMany({
    orderBy: { fullTitle: 'asc' },
  })

  return Response.json(roles)
}

export async function POST(request: Request) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createLaborRoleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const role = await prisma.laborRole.create({ data: parsed.data })
  return Response.json(role, { status: 201 })
}
