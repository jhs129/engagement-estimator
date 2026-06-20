import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'
import { generateRawToken, hashToken, tokenDisplayPrefix } from '@/lib/tokens'

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const tokens = await prisma.apiToken.findMany({
    where: { userId: user.id, revokedAt: null },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(tokens)
}

export async function POST(request: Request) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || typeof (body as Record<string, unknown>).name !== 'string') {
    return Response.json({ error: 'name is required' }, { status: 422 })
  }

  const name = ((body as Record<string, unknown>).name as string).trim()
  if (!name) return Response.json({ error: 'name cannot be empty' }, { status: 422 })

  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const prefix = tokenDisplayPrefix(rawToken)

  const record = await prisma.apiToken.create({
    data: {
      userId: user.id,
      name,
      tokenHash,
      prefix,
    },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
  })

  return Response.json({ token: rawToken, ...record }, { status: 201 })
}
