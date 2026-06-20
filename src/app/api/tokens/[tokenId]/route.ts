import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { tokenId } = await params

  const record = await prisma.apiToken.findUnique({
    where: { id: tokenId },
    select: { userId: true, revokedAt: true },
  })

  if (!record) return Response.json({ error: 'Not found' }, { status: 404 })

  // Only the token owner or an admin may revoke
  if (record.userId !== user.id && user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (record.revokedAt) {
    return Response.json({ error: 'Token already revoked' }, { status: 409 })
  }

  await prisma.apiToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  })

  return Response.json({ success: true })
}
