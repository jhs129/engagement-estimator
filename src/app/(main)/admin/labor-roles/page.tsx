import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LaborRatesAdmin } from '@/components/LaborRatesAdmin';

interface LaborRole {
  id: string;
  fullTitle: string;
  division: string;
  department: string;
  role: string;
  rackRate: number;
  abbreviation: string;
  isActive: boolean;
}

async function fetchLaborRoles(): Promise<LaborRole[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const roles = await prisma.laborRole.findMany({ orderBy: { fullTitle: 'asc' } });
    return roles;
  } catch {
    return [];
  }
}

export default async function AdminLaborRolesPage() {
  const session = await auth();
  if (!session?.user || (session.user as unknown as Record<string, unknown>).role !== 'ADMIN') {
    redirect('/');
  }
  const roles = await fetchLaborRoles();
  return (
    <main className="min-h-screen px-8 py-10" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <h1
        className="text-3xl font-semibold tracking-tight mb-8"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
      >
        Labor Rates
      </h1>
      <LaborRatesAdmin initialRoles={roles} />
    </main>
  );
}
