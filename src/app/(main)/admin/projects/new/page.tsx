import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ProjectForm } from '@/components/ProjectsAdmin/ProjectForm'

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const session = await auth()
  if ((session?.user as unknown as Record<string, unknown>)?.role !== 'ADMIN') redirect('/')

  const { clientId } = await searchParams

  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })
  if (clients.length === 0) redirect('/admin/clients/new')

  return (
    <main className="min-h-screen px-8 py-10" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <div className="max-w-xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}>
          <Link href="/admin/projects" className="hover:underline">Projects</Link>
          {' / '}New
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}>
          New Project
        </h1>
        <ProjectForm clients={clients} defaultClientId={clientId} />
      </div>
    </main>
  )
}
