import { prisma } from '@/lib/prisma'
import { getAuthedUser } from '@/lib/api-auth'
import { createEstimateSchema } from '@/types/estimate'

const FOUNDATION_EPICS = [
  'Project Management',
  'Requirements',
  'DevOps',
  'Development',
  'Quality Assurance',
  'Go-Live',
  'Change Management',
]

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const estimates = await prisma.estimate.findMany({
    where: { createdById: user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json(estimates)
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

  const parsed = createEstimateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const data = parsed.data

  const estimate = await prisma.estimate.create({
    data: {
      name: data.name,
      clientName: data.clientName,
      salesOwner: data.salesOwner,
      estimatedStartDate: data.estimatedStartDate ? new Date(data.estimatedStartDate) : undefined,
      projectDescription: data.projectDescription,
      version: data.version,
      riskPremiumPct: data.riskPremiumPct,
      smeTechnology: data.smeTechnology,
      smeCreativeUX: data.smeCreativeUX,
      smeStrategy: data.smeStrategy,
      smeData: data.smeData,
      smeMedia: data.smeMedia,
      smeMarketingAutomation: data.smeMarketingAutomation,
      smeOther: data.smeOther,
      ratioQAToDev: data.ratioQAToDev,
      ratioTestCaseAuthoring: data.ratioTestCaseAuthoring,
      ratioDefectFixing: data.ratioDefectFixing,
      ratioAlphaTesting: data.ratioAlphaTesting,
      ratioUAT: data.ratioUAT,
      createdById: user.id,
      epics: {
        create: FOUNDATION_EPICS.map((name, index) => ({
          name,
          isFoundation: true,
          order: index,
        })),
      },
    },
    include: { epics: true },
  })

  return Response.json(estimate, { status: 201 })
}
