import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StoriesGrid } from '@/components/StoriesGrid'
import type { StoryRow, EpicGroup, TeamMemberCol } from '@/components/StoriesGrid/types'

export const dynamic = 'force-dynamic'

interface StoriesPageData {
  stories: StoryRow[]
  epics: EpicGroup[]
  teamMembers: TeamMemberCol[]
}

async function fetchStoriesPageData(estimateId: string): Promise<StoriesPageData | null> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { getAuthedUser } = await import('@/lib/api-auth')

    const user = await getAuthedUser()
    if (!user) return null

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { createdById: true },
    })
    if (!estimate) return null
    if (estimate.createdById !== user.id && user.role !== 'ADMIN') return null

    const [rawStories, rawEpics, rawTeamMembers] = await Promise.all([
      prisma.story.findMany({
        where: { estimateId },
        orderBy: { order: 'asc' },
        include: {
          staffingAllocations: {
            select: { teamMemberId: true, hours: true },
          },
        },
      }),
      prisma.epic.findMany({
        where: { estimateId },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, isFoundation: true },
      }),
      prisma.teamMember.findMany({
        where: { estimateId },
        orderBy: { order: 'asc' },
        include: { laborRole: true },
      }),
    ])

    const stories: StoryRow[] = rawStories.map((s) => ({
      id: s.id,
      epicId: s.epicId,
      storyTask: s.storyTask,
      description: s.description,
      assumptions: s.assumptions,
      deliverables: s.deliverables,
      disabled: s.disabled,
      testable: s.testable,
      estimateLow: s.estimateLow,
      estimateHigh: s.estimateHigh,
      estimateMean: s.estimateMean,
      order: s.order,
      staffingAllocations: s.staffingAllocations.map((a) => ({
        teamMemberId: a.teamMemberId,
        hours: a.hours,
      })),
    }))

    const epics: EpicGroup[] = rawEpics.map((e) => ({
      id: e.id,
      name: e.name,
      isFoundation: e.isFoundation,
    }))

    const teamMembers: TeamMemberCol[] = rawTeamMembers.map((m) => {
      const abbreviation =
        m.abbreviationOverride ??
        m.laborRole?.abbreviation ??
        m.id.slice(0, 4).toUpperCase()
      const title =
        m.targetedResource ??
        m.titleOverride ??
        m.laborRole?.fullTitle ??
        abbreviation
      return { id: m.id, abbreviation, title }
    })

    return { stories, epics, teamMembers }
  } catch {
    return null
  }
}

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const data = await fetchStoriesPageData(id)

  if (!data) {
    return (
      <StoriesGrid
        estimateId={id}
        initialStories={[]}
        epics={[]}
        teamMembers={[]}
      />
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <StoriesGrid
        estimateId={id}
        initialStories={data.stories}
        epics={data.epics}
        teamMembers={data.teamMembers}
      />
    </div>
  )
}
