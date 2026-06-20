'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
  logoUrl: string
}

interface ClientFormProps {
  client?: Client
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

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [name, setName] = useState(client?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(client?.logoUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!client

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const res = await fetch(isEdit ? `/api/admin/clients/${client.id}` : '/api/admin/clients', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), logoUrl: logoUrl.trim() }),
    })

    if (!res.ok) {
      setError('Failed to save client.')
      setSaving(false)
      return
    }

    router.push('/admin/clients')
    router.refresh()
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
      <div style={{ backgroundColor: '#fff', border: '1px solid var(--cc-gray-light)', padding: '24px' }}>
        <div className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Client Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              style={inputStyle}
            />
            {logoUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-16 h-16 object-contain"
                  style={{ border: '1px solid var(--cc-gray-light)', padding: '4px' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <span className="text-xs" style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-display)' }}>Preview</span>
              </div>
            )}
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
          disabled={saving || !name.trim()}
          className="px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--cc-black)', fontFamily: 'var(--font-display)' }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
        </button>
      </div>
    </form>
  )
}
