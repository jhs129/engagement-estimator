import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EstimatesDashboard } from '@/components/EstimatesDashboard';

interface EstimateRow {
  id: string;
  name: string;
  clientName: string;
  salesOwner: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchEstimates(): Promise<EstimateRow[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { getAuthedUser } = await import('@/lib/api-auth');

    const user = await getAuthedUser();
    if (!user) return [];

    const rows = await prisma.estimate.findMany({
      where: { createdById: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        clientName: true,
        salesOwner: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      clientName: r.clientName,
      salesOwner: r.salesOwner,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function EstimatesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const estimates = await fetchEstimates();

  return <EstimatesDashboard estimates={estimates} />;
}
