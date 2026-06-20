import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClientForm } from '@/components/ClientsAdmin/ClientForm'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if ((session?.user as unknown as Record<string, unknown>)?.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) notFound()

  return (
    <main className="min-h-screen px-8 py-10" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <div className="max-w-xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}>
          <Link href="/admin/clients" className="hover:underline">Clients</Link>
          {' / '}Edit
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}>
          Edit Client
        </h1>
        <ClientForm client={client} />
      </div>
    </main>
  )
}
