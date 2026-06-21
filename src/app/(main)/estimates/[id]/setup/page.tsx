import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EstimateSetupForm } from '@/components/EstimateSetupForm';
import type { EstimateSetupFormData, Client, Project } from '@/components/EstimateSetupForm/types';

export const dynamic = 'force-dynamic'

interface FetchResult {
  data: EstimateSetupFormData;
  clients: Client[];
  initialProjects: Project[];
}

const DEFAULT_FORM_DATA: EstimateSetupFormData = {
  name: 'New Estimate',
  clientName: '',
  clientId: null,
  projectId: null,
  salesOwner: '',
  salesOriginator: null,
  estimatedStartDate: null,
  projectDescription: null,
  smes: [],
  ratioQAToDev: 0.2,
  ratioTestCaseAuthoring: 0.1,
  ratioDefectFixing: 0.25,
  ratioAlphaTesting: 0.2,
  ratioUAT: 0.1,
  riskPremiumPct: 0,
  version: 1,
};

async function fetchEstimate(id: string): Promise<FetchResult | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { getAuthedUser } = await import('@/lib/api-auth');

    const user = await getAuthedUser();
    if (!user) return null;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        clientName: true,
        clientId: true,
        projectId: true,
        salesOwner: true,
        salesOriginator: true,
        estimatedStartDate: true,
        projectDescription: true,
        smes: { orderBy: { order: 'asc' as const } },
        ratioQAToDev: true,
        ratioTestCaseAuthoring: true,
        ratioDefectFixing: true,
        ratioAlphaTesting: true,
        ratioUAT: true,
        riskPremiumPct: true,
        version: true,
        createdById: true,
      },
    });

    if (!estimate) return null;
    if (estimate.createdById !== user.id && user.role !== 'ADMIN') return null;

    const [clients, initialProjects] = await Promise.all([
      prisma.client.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      estimate.clientId
        ? prisma.project.findMany({
            where: { clientId: estimate.clientId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    return {
      data: {
        name: estimate.name,
        clientName: estimate.clientName,
        clientId: estimate.clientId,
        projectId: estimate.projectId,
        salesOwner: estimate.salesOwner,
        salesOriginator: estimate.salesOriginator,
        estimatedStartDate: estimate.estimatedStartDate
          ? estimate.estimatedStartDate.toISOString().split('T')[0]
          : null,
        projectDescription: estimate.projectDescription,
        smes: estimate.smes,
        ratioQAToDev: estimate.ratioQAToDev,
        ratioTestCaseAuthoring: estimate.ratioTestCaseAuthoring,
        ratioDefectFixing: estimate.ratioDefectFixing,
        ratioAlphaTesting: estimate.ratioAlphaTesting,
        ratioUAT: estimate.ratioUAT,
        riskPremiumPct: estimate.riskPremiumPct,
        version: estimate.version,
      },
      clients,
      initialProjects,
    };
  } catch {
    return null;
  }
}

export default async function SetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;
  const result = await fetchEstimate(id);
  const dbUnavailable = result === null;
  const formData = result?.data ?? DEFAULT_FORM_DATA;
  const clients = result?.clients ?? [];
  const initialProjects = result?.initialProjects ?? [];

  return (
    <div>
      {dbUnavailable && (
        <div
          className="px-8 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'var(--cc-straw)',
            color: 'var(--cc-near-black)',
            fontFamily: 'var(--font-display)',
          }}
        >
          Database not configured — connect Neon to save data.
        </div>
      )}
      <EstimateSetupForm
        estimateId={id}
        initialData={formData}
        clients={clients}
        initialProjects={initialProjects}
      />
    </div>
  );
}
