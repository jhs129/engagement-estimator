import { EstimateNav } from '@/components/EstimateNav';

async function getEstimateName(id: string): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      select: { name: true },
    });
    return estimate?.name ?? 'Estimate';
  } catch {
    return 'Estimate';
  }
}

export default async function EstimateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const estimateName = await getEstimateName(id);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <EstimateNav estimateId={id} estimateName={estimateName} />
      {children}
    </div>
  );
}
