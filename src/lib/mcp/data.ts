import { prisma } from '@/lib/prisma'
import type { McpAccess } from './scope'

// All estimate queries are scoped to the user (admins see all)
function estimateWhere(access: McpAccess) {
  return access.isAdmin ? {} : { createdById: access.userId }
}

export async function listEstimates(access: McpAccess) {
  return prisma.estimate.findMany({
    where: estimateWhere(access),
    select: { id: true, name: true, clientName: true, salesOwner: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getEstimate(access: McpAccess, estimateId: string) {
  const where = { id: estimateId, ...estimateWhere(access) }
  return prisma.estimate.findFirst({ where })
}

export async function listStories(access: McpAccess, estimateId: string) {
  // verify access to estimate first
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  return prisma.story.findMany({
    where: { estimateId },
    include: { epic: { select: { name: true } }, staffingAllocations: true },
    orderBy: [{ epic: { order: 'asc' } }, { order: 'asc' }],
  })
}

export async function getEpicSummary(access: McpAccess, estimateId: string) {
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  return prisma.epic.findMany({
    where: { estimateId },
    include: { stories: { where: { disabled: false } } },
    orderBy: { order: 'asc' },
  })
}

export async function getInvestmentSummary(access: McpAccess, estimateId: string) {
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  const teamMembers = await prisma.teamMember.findMany({
    where: { estimateId },
    include: {
      laborRole: true,
      storyStaffing: { include: { story: { select: { disabled: true } } } },
    },
    orderBy: { order: 'asc' },
  })
  return { estimate, teamMembers }
}

export async function createEstimate(
  access: McpAccess,
  data: { name: string; clientName: string; salesOwner: string },
) {
  return prisma.estimate.create({
    data: { ...data, createdById: access.userId },
  })
}

export async function updateEstimateSetup(
  access: McpAccess,
  estimateId: string,
  data: Record<string, unknown>,
) {
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  return prisma.estimate.update({ where: { id: estimateId }, data })
}

export async function createStory(
  access: McpAccess,
  estimateId: string,
  data: { epicId: string; storyTask: string; order?: number },
) {
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  const maxOrder = await prisma.story.aggregate({ where: { estimateId }, _max: { order: true } })
  return prisma.story.create({
    data: {
      estimateId,
      epicId: data.epicId,
      storyTask: data.storyTask,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
    },
  })
}

export async function updateStory(
  access: McpAccess,
  estimateId: string,
  storyId: string,
  data: Record<string, unknown>,
) {
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  return prisma.story.update({ where: { id: storyId, estimateId }, data })
}

export async function createQuestion(
  access: McpAccess,
  estimateId: string,
  data: { type: string; description: string; notes?: string },
) {
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  const maxOrder = await prisma.question.aggregate({
    where: { estimateId },
    _max: { order: true },
  })
  return prisma.question.create({
    data: {
      estimateId,
      type: data.type,
      description: data.description,
      notes: data.notes ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  })
}

export async function addTeamMember(
  access: McpAccess,
  estimateId: string,
  data: { laborRoleId?: string; titleOverride?: string },
) {
  const estimate = await getEstimate(access, estimateId)
  if (!estimate) return null
  const maxOrder = await prisma.teamMember.aggregate({
    where: { estimateId },
    _max: { order: true },
  })
  return prisma.teamMember.create({
    data: {
      estimateId,
      laborRoleId: data.laborRoleId ?? null,
      titleOverride: data.titleOverride ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  })
}
