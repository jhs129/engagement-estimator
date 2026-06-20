'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClientWithCounts {
  id: string
  name: string
  logoUrl: string
  createdAt: Date
  _count: { projects: number; estimates: number }
}

interface ClientsAdminListProps {
  initialClients: ClientWithCounts[]
}

export function ClientsAdminList({ initialClients }: ClientsAdminListProps) {
  const router = useRouter()
  const [clients, setClients] = useState(initialClients)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
    setClients((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

  if (clients.length === 0) {
    return (
      <div className="py-20 text-center" style={{ border: '1px solid var(--cc-gray-light)', backgroundColor: '#fff' }}>
        <p className="text-sm mb-4" style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-display)' }}>
          No clients yet.
        </p>
        <Link
          href="/admin/clients/new"
          className="text-sm font-semibold underline"
          style={{ color: 'var(--cc-burnt-sienna)' }}
        >
          Create your first client
        </Link>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--cc-gray-light)', backgroundColor: '#fff' }}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cc-gray-light)' }}>
            {['Name', 'Projects', 'Estimates', ''].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} style={{ borderBottom: '1px solid var(--cc-gray-light)' }}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {client.logoUrl ? (
                    <img src={client.logoUrl} alt="" className="w-8 h-8 object-contain" style={{ flexShrink: 0 }} />
                  ) : (
                    <div
                      className="w-8 h-8 flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--cc-gray-light)', color: 'var(--cc-gray-mid)', flexShrink: 0 }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium" style={{ color: 'var(--cc-black)' }}>{client.name}</span>
                </div>
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--cc-gray-mid)' }}>{client._count.projects}</td>
              <td className="px-4 py-3" style={{ color: 'var(--cc-gray-mid)' }}>{client._count.estimates}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 justify-end">
                  <Link
                    href={`/admin/projects?clientId=${client.id}`}
                    className="text-xs font-medium hover:underline"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
                  >
                    Projects
                  </Link>
                  <Link
                    href={`/admin/clients/${client.id}/edit`}
                    className="text-xs font-medium hover:underline"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
                  >
                    Edit
                  </Link>
                  {confirmId === client.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--cc-gray-mid)' }}>Delete?</span>
                      <button
                        onClick={() => void handleDelete(client.id)}
                        disabled={deletingId === client.id}
                        className="text-xs font-medium"
                        style={{ color: '#c0392b', fontFamily: 'var(--font-display)' }}
                      >
                        {deletingId === client.id ? '…' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs font-medium"
                        style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-display)' }}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(client.id)}
                      className="text-xs font-medium"
                      style={{ color: '#c0392b', fontFamily: 'var(--font-display)' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
