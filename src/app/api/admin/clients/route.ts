import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { projects: true, estimates: true } } },
  })
  return Response.json(clients)
}

export async function POST(req: Request) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as { name?: string; logoUrl?: string }
  if (!body.name?.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }

  const client = await prisma.client.create({
    data: { name: body.name.trim(), logoUrl: body.logoUrl?.trim() ?? '' },
  })
  return Response.json(client, { status: 201 })
}
