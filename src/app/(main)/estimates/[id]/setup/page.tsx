import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EstimateSetupForm } from '@/components/EstimateSetupForm';
import type { EstimateSetupFormData } from '@/components/EstimateSetupForm/types';

const DEFAULT_FORM_DATA: EstimateSetupFormData = {
  name: 'New Estimate',
  clientName: '',
  salesOwner: '',
  estimatedStartDate: null,
  projectDescription: null,
  smeTechnology: null,
  smeCreativeUX: null,
  smeStrategy: null,
  smeData: null,
  smeMedia: null,
  smeMarketingAutomation: null,
  smeOther: null,
  ratioQAToDev: 0.2,
  ratioTestCaseAuthoring: 0.1,
  ratioDefectFixing: 0.25,
  ratioAlphaTesting: 0.2,
  ratioUAT: 0.1,
  riskPremiumPct: 0,
  version: 1,
};

async function fetchEstimate(id: string): Promise<EstimateSetupFormData | null> {
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
        salesOwner: true,
        estimatedStartDate: true,
        projectDescription: true,
        smeTechnology: true,
        smeCreativeUX: true,
        smeStrategy: true,
        smeData: true,
        smeMedia: true,
        smeMarketingAutomation: true,
        smeOther: true,
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

    return {
      name: estimate.name,
      clientName: estimate.clientName,
      salesOwner: estimate.salesOwner,
      estimatedStartDate: estimate.estimatedStartDate
        ? estimate.estimatedStartDate.toISOString().split('T')[0]
        : null,
      projectDescription: estimate.projectDescription,
      smeTechnology: estimate.smeTechnology,
      smeCreativeUX: estimate.smeCreativeUX,
      smeStrategy: estimate.smeStrategy,
      smeData: estimate.smeData,
      smeMedia: estimate.smeMedia,
      smeMarketingAutomation: estimate.smeMarketingAutomation,
      smeOther: estimate.smeOther,
      ratioQAToDev: estimate.ratioQAToDev,
      ratioTestCaseAuthoring: estimate.ratioTestCaseAuthoring,
      ratioDefectFixing: estimate.ratioDefectFixing,
      ratioAlphaTesting: estimate.ratioAlphaTesting,
      ratioUAT: estimate.ratioUAT,
      riskPremiumPct: estimate.riskPremiumPct,
      version: estimate.version,
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
  const data = await fetchEstimate(id);
  const dbUnavailable = data === null;
  const formData = data ?? DEFAULT_FORM_DATA;

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
      <EstimateSetupForm estimateId={id} initialData={formData} />
    </div>
  );
}
