import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const projects = await prisma.project.findMany({
    where: { clientId: id },
    orderBy: { name: 'asc' },
  })
  return Response.json(projects)
}
