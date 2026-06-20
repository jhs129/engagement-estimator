import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ProjectsAdminList } from '@/components/ProjectsAdmin'

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const session = await auth()
  if ((session?.user as unknown as Record<string, unknown>)?.role !== 'ADMIN') redirect('/')

  const { clientId } = await searchParams

  const projects = await prisma.project.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { name: 'asc' },
    include: {
      client: true,
      _count: { select: { estimates: true } },
    },
  })

  const filterClient = clientId
    ? await prisma.client.findUnique({ where: { id: clientId } })
    : null

  return (
    <main className="min-h-screen px-8 py-10" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}>
              <Link href="/admin/clients" className="hover:underline">Clients</Link>
              {filterClient && (
                <> / <span>{filterClient.name}</span></>
              )}
              {' / '}Projects
            </p>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}>
              {filterClient ? `${filterClient.name} Projects` : 'Projects'}
              <span className="ml-2 text-base font-normal" style={{ color: 'var(--cc-gray-mid)' }}>({projects.length})</span>
            </h1>
          </div>
          <Link
            href={clientId ? `/admin/projects/new?clientId=${clientId}` : '/admin/projects/new'}
            className="px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--cc-black)', fontFamily: 'var(--font-display)' }}
          >
            + New Project
          </Link>
        </div>

        <div className="mt-8">
          <ProjectsAdminList initialProjects={projects} />
        </div>
      </div>
    </main>
  )
}
