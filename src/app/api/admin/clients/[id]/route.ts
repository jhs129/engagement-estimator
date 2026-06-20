import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: { projects: { orderBy: { name: 'asc' } } },
  })
  if (!client) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = (await req.json()) as { name?: string; logoUrl?: string }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl.trim() }),
    },
  })
  return Response.json(client)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.client.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
