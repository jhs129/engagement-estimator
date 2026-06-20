'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
  logoUrl: string
}

interface Project {
  id: string
  name: string
  slug: string
}

interface NewEstimateModalProps {
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--cc-gray-light)',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--cc-black)',
  backgroundColor: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
  fontFamily: 'var(--font-display)',
  color: 'var(--cc-gray-mid)',
}

export function NewEstimateModal({ onClose }: NewEstimateModalProps) {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [clients, setClients] = useState<Client[] | null>(null)
  const [clientId, setClientId] = useState('')
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [projectId, setProjectId] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Inline new-project creation
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [projectError, setProjectError] = useState('')

  const [estimateName, setEstimateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data: Client[]) => setClients(data))
      .catch(() => setClients([]))
  }, [])

  useEffect(() => {
    if (!clientId) {
      setProjects(null)
      setProjectId('')
      setShowNewProject(false)
      return
    }
    setLoadingProjects(true)
    setProjects(null)
    setProjectId('')
    setShowNewProject(false)

    const selectedClient = clients?.find((c) => c.id === clientId)
    if (selectedClient && !estimateName) {
      setEstimateName(`${selectedClient.name} Engagement`)
    }

    fetch(`/api/clients/${clientId}/projects`)
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data)
        setLoadingProjects(false)
      })
      .catch(() => {
        setProjects([])
        setLoadingProjects(false)
      })
  }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateProject() {
    if (!newProjectName.trim() || !clientId) return
    setCreatingProject(true)
    setProjectError('')

    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName.trim(), clientId }),
    })

    if (!res.ok) {
      setProjectError(res.status === 403 ? 'Admin access required to create projects.' : 'Failed to create project.')
      setCreatingProject(false)
      return
    }

    const created: Project = await res.json()
    setProjects((prev) => [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)))
    setProjectId(created.id)
    setShowNewProject(false)
    setNewProjectName('')
    setCreatingProject(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !projectId || !estimateName.trim()) return
    setCreating(true)
    setError('')

    const selectedClient = clients?.find((c) => c.id === clientId)

    const res = await fetch('/api/estimates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: estimateName.trim(),
        clientName: selectedClient?.name ?? '',
        salesOwner: 'TBD',
        clientId,
        projectId,
      }),
    })

    if (!res.ok) {
      setError('Failed to create estimate.')
      setCreating(false)
      return
    }

    const data: { id: string } = await res.json()
    router.push(`/estimates/${data.id}/setup`)
  }

  const canSubmit = !!clientId && !!projectId && !!estimateName.trim()

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(18,18,18,0.55)', zIndex: 200 }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        style={{
          backgroundColor: 'var(--cc-parchment)',
          border: '2px solid var(--cc-black)',
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
        }}
      >
        <h2
          className="text-xl font-semibold mb-6"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
        >
          New Estimate
        </h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          {/* Client */}
          <div>
            <label style={labelStyle}>Client *</label>
            {clients === null ? (
              <p className="text-xs" style={{ color: 'var(--cc-gray-mid)' }}>Loading clients…</p>
            ) : clients.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--cc-gray-mid)' }}>
                No clients yet.{' '}
                <a href="/admin/clients/new" style={{ color: 'var(--cc-burnt-sienna)', textDecoration: 'underline' }}>
                  Create a client first.
                </a>
              </p>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Project */}
          {clientId && (
            <div>
              <label style={labelStyle}>Project *</label>
              {loadingProjects ? (
                <p className="text-xs" style={{ color: 'var(--cc-gray-mid)' }}>Loading projects…</p>
              ) : (
                <>
                  <select
                    value={projectId}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setProjectId('')
                        setShowNewProject(true)
                      } else {
                        setProjectId(e.target.value)
                        setShowNewProject(false)
                      }
                    }}
                    required={!showNewProject}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">Select a project…</option>
                    {(projects ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="__new__">＋ Create new project…</option>
                  </select>

                  {showNewProject && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateProject() } }}
                        placeholder="Project name…"
                        autoFocus
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => void handleCreateProject()}
                        disabled={creatingProject || !newProjectName.trim()}
                        className="px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        style={{ backgroundColor: 'var(--cc-black)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}
                      >
                        {creatingProject ? '…' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewProject(false); setNewProjectName(''); setProjectError('') }}
                        className="px-3 py-2 text-xs font-semibold"
                        style={{ border: '1px solid var(--cc-gray-light)', backgroundColor: '#fff', fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {projectError && (
                    <p className="mt-1 text-xs" style={{ color: '#c0392b' }}>{projectError}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Estimate Name */}
          {clientId && projectId && (
            <div>
              <label style={labelStyle}>Estimate Name *</label>
              <input
                type="text"
                value={estimateName}
                onChange={(e) => setEstimateName(e.target.value)}
                placeholder="e.g. Website Redesign Estimate"
                required
                autoFocus
                style={inputStyle}
              />
            </div>
          )}

          {error && <p className="text-xs" style={{ color: '#c0392b' }}>{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold"
              style={{
                border: '1px solid var(--cc-gray-light)',
                backgroundColor: '#fff',
                fontFamily: 'var(--font-display)',
                color: 'var(--cc-gray-mid)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !canSubmit}
              className="px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: 'var(--cc-burnt-sienna)', fontFamily: 'var(--font-display)' }}
            >
              {creating ? 'Creating…' : 'Create Estimate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
