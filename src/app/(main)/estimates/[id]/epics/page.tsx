import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EpicsGrid } from '@/components/EpicsGrid'
import type { EpicRow } from '@/components/EpicsGrid/types'
import { calculateEpicSummaries } from '@/lib/calculations/epics'

export const dynamic = 'force-dynamic'

interface QARatios {
  ratioQAToDev: number
  ratioTestCaseAuthoring: number
  ratioDefectFixing: number
  ratioAlphaTesting: number
  ratioUAT: number
}

interface EpicsPageData {
  epics: {
    id: string
    name: string
    description: string | null
    isFoundation: boolean
    order: number
  }[]
  stories: {
    epicId: string
    disabled: boolean
    testable: boolean
    estimateMean: number | null
  }[]
  ratios: QARatios
}

async function fetchEpicsPageData(estimateId: string): Promise<EpicsPageData | null> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { getAuthedUser } = await import('@/lib/api-auth')

    const user = await getAuthedUser()
    if (!user) return null

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: {
        createdById: true,
        ratioQAToDev: true,
        ratioTestCaseAuthoring: true,
        ratioDefectFixing: true,
        ratioAlphaTesting: true,
        ratioUAT: true,
      },
    })

    if (!estimate) return null
    if (estimate.createdById !== user.id && user.role !== 'ADMIN') return null

    const epics = await prisma.epic.findMany({
      where: { estimateId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        isFoundation: true,
        order: true,
      },
    })

    const stories = await prisma.story.findMany({
      where: { estimateId, disabled: false },
      select: {
        epicId: true,
        disabled: true,
        testable: true,
        estimateMean: true,
      },
    })

    return {
      epics,
      stories,
      ratios: {
        ratioQAToDev: estimate.ratioQAToDev,
        ratioTestCaseAuthoring: estimate.ratioTestCaseAuthoring,
        ratioDefectFixing: estimate.ratioDefectFixing,
        ratioAlphaTesting: estimate.ratioAlphaTesting,
        ratioUAT: estimate.ratioUAT,
      },
    }
  } catch {
    return null
  }
}

export default async function EpicsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const data = await fetchEpicsPageData(id)

  if (!data) {
    return <EpicsGrid estimateId={id} initialRows={[]} />
  }

  const qaEpic = data.epics.find(
    (e) => e.isFoundation && e.name === 'Quality Assurance'
  )
  const qaEpicId = qaEpic?.id ?? ''

  const summaries = calculateEpicSummaries(data.epics, data.stories, qaEpicId, data.ratios)

  const grandTotal = summaries.reduce((sum, s) => sum + s.totalHours, 0)

  const rows: EpicRow[] = data.epics.map((epic) => {
    const summary = summaries.find((s) => s.epicId === epic.id)
    const storyHours = summary?.storyHours ?? 0
    const foundationHours = summary?.foundationHours ?? 0
    const totalHours = summary?.totalHours ?? 0
    const percent = grandTotal > 0 ? (totalHours / grandTotal) * 100 : 0

    return {
      id: epic.id,
      name: epic.name,
      description: epic.description,
      isFoundation: epic.isFoundation,
      order: epic.order,
      storyHours,
      foundationHours,
      totalHours,
      percent,
    }
  })

  return <EpicsGrid estimateId={id} initialRows={rows} />
}
