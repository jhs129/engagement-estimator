import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClientForm } from '@/components/ClientsAdmin/ClientForm'

export default async function NewClientPage() {
  const session = await auth()
  if ((session?.user as unknown as Record<string, unknown>)?.role !== 'ADMIN') redirect('/')

  return (
    <main className="min-h-screen px-8 py-10" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <div className="max-w-xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}>
          <Link href="/admin/clients" className="hover:underline">Clients</Link>
          {' / '}New
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}>
          New Client
        </h1>
        <ClientForm />
      </div>
    </main>
  )
}
