import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClientsAdminList } from '@/components/ClientsAdmin'

export default async function AdminClientsPage() {
  const session = await auth()
  if ((session?.user as unknown as Record<string, unknown>)?.role !== 'ADMIN') redirect('/')

  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { projects: true, estimates: true } } },
  })

  return (
    <main className="min-h-screen px-8 py-10" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}>
              <Link href="/admin/labor-roles" className="hover:underline">Admin</Link>
              {' / '}Clients
            </p>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}>
              Clients
              <span className="ml-2 text-base font-normal" style={{ color: 'var(--cc-gray-mid)' }}>({clients.length})</span>
            </h1>
          </div>
          <Link
            href="/admin/clients/new"
            className="px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--cc-black)', fontFamily: 'var(--font-display)' }}
          >
            + New Client
          </Link>
        </div>

        <div className="mt-8">
          <ClientsAdminList initialClients={clients} />
        </div>
      </div>
    </main>
  )
}
