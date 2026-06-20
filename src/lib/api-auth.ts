import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface AuthedUser {
  id: string
  role: string
}

export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  })

  if (!user) return null
  return { id: user.id, role: user.role }
}
