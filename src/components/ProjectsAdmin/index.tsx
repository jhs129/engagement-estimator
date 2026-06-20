'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProjectWithClient {
  id: string
  name: string
  slug: string
  description: string
  clientId: string
  createdAt: Date
  client: { id: string; name: string; logoUrl: string }
  _count: { estimates: number }
}

interface ProjectsAdminListProps {
  initialProjects: ProjectWithClient[]
}

export function ProjectsAdminList({ initialProjects }: ProjectsAdminListProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

  if (projects.length === 0) {
    return (
      <div className="py-20 text-center" style={{ border: '1px solid var(--cc-gray-light)', backgroundColor: '#fff' }}>
        <p className="text-sm mb-4" style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-display)' }}>
          No projects yet.
        </p>
        <Link href="/admin/projects/new" className="text-sm font-semibold underline" style={{ color: 'var(--cc-burnt-sienna)' }}>
          Create your first project
        </Link>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--cc-gray-light)', backgroundColor: '#fff' }}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cc-gray-light)' }}>
            {['Project', 'Client', 'Estimates', ''].map((col) => (
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
          {projects.map((project) => (
            <tr key={project.id} style={{ borderBottom: '1px solid var(--cc-gray-light)' }}>
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium" style={{ color: 'var(--cc-black)' }}>{project.name}</p>
                  {project.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--cc-gray-mid)' }}>{project.description}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {project.client.logoUrl ? (
                    <img src={project.client.logoUrl} alt="" className="w-6 h-6 object-contain" style={{ flexShrink: 0 }} />
                  ) : (
                    <div
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--cc-gray-light)', color: 'var(--cc-gray-mid)', flexShrink: 0 }}
                    >
                      {project.client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ color: 'var(--cc-gray-mid)' }}>{project.client.name}</span>
                </div>
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--cc-gray-mid)' }}>{project._count.estimates}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 justify-end">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="text-xs font-medium hover:underline"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
                  >
                    Edit
                  </Link>
                  {confirmId === project.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--cc-gray-mid)' }}>Delete?</span>
                      <button
                        onClick={() => void handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="text-xs font-medium"
                        style={{ color: '#c0392b', fontFamily: 'var(--font-display)' }}
                      >
                        {deletingId === project.id ? '…' : 'Yes'}
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
                      onClick={() => setConfirmId(project.id)}
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
