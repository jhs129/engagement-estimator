'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
  description: string
  clientId: string
}

interface ProjectFormProps {
  clients: Client[]
  project?: Project
  defaultClientId?: string
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
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
  fontFamily: 'var(--font-display)',
  color: 'var(--cc-gray-mid)',
}

export function ProjectForm({ clients, project, defaultClientId }: ProjectFormProps) {
  const router = useRouter()
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [clientId, setClientId] = useState(project?.clientId ?? defaultClientId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!project

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !clientId) return
    setSaving(true)
    setError(null)

    const res = await fetch(isEdit ? `/api/admin/projects/${project.id}` : '/api/admin/projects', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim(), clientId }),
    })

    if (!res.ok) {
      setError('Failed to save project.')
      setSaving(false)
      return
    }

    router.push('/admin/projects')
    router.refresh()
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
      <div style={{ backgroundColor: '#fff', border: '1px solid var(--cc-gray-light)', padding: '24px' }}>
        <div className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Client *</label>
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
          </div>

          <div>
            <label style={labelStyle}>Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project description…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
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
          disabled={saving || !name.trim() || !clientId}
          className="px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--cc-black)', fontFamily: 'var(--font-display)' }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
