import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let suffix = 0
  while (await prisma.project.findUnique({ where: { slug } })) {
    suffix++
    slug = `${base}-${suffix}`
  }
  return slug
}

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const projects = await prisma.project.findMany({
    orderBy: { name: 'asc' },
    include: {
      client: true,
      _count: { select: { estimates: true } },
    },
  })
  return Response.json(projects)
}

export async function POST(req: Request) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as { name?: string; clientId?: string; description?: string }
  if (!body.name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })
  if (!body.clientId) return Response.json({ error: 'clientId is required' }, { status: 400 })

  const slug = await uniqueSlug(toSlug(body.name))
  const project = await prisma.project.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() ?? '',
      clientId: body.clientId,
    },
    include: { client: true },
  })
  return Response.json(project, { status: 201 })
}
