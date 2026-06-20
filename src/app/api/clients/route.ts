import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })
  return Response.json(clients)
}
