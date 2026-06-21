import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QuestionsGrid } from '@/components/QuestionsGrid'
import type { QuestionRow } from '@/components/QuestionsGrid/types'

export const dynamic = 'force-dynamic'
async function fetchQuestions(estimateId: string): Promise<QuestionRow[]> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { getAuthedUser } = await import('@/lib/api-auth')

    const user = await getAuthedUser()
    if (!user) return []

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { createdById: true },
    })
    if (!estimate) return []
    if (estimate.createdById !== user.id && user.role !== 'ADMIN') return []

    const questions = await prisma.question.findMany({
      where: { estimateId },
      orderBy: { order: 'asc' },
    })

    return questions.map((q) => ({
      id: q.id,
      type: q.type as 'Question' | 'Assumption',
      description: q.description,
      notes: q.notes,
      order: q.order,
    }))
  } catch {
    return []
  }
}

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const rows = await fetchQuestions(id)

  return <QuestionsGrid estimateId={id} initialRows={rows} />
}
