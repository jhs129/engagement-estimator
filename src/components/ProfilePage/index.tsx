'use client'

import { useState, useEffect } from 'react'

interface Token {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

interface ProfilePageProps {
  userName: string | null
  userEmail: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

export function ProfilePage({ userName, userEmail }: ProfilePageProps) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [newTokenName, setNewTokenName] = useState('')
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchTokens() {
    try {
      const res = await fetch('/api/tokens')
      if (!res.ok) throw new Error('Failed to fetch tokens')
      const data = (await res.json()) as Token[]
      setTokens(data)
    } catch {
      setError('Failed to load tokens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetch('/api/tokens')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch tokens')
        return res.json() as Promise<Token[]>
      })
      .then((data) => {
        if (active) {
          setTokens(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError('Failed to load tokens')
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [])

  async function handleGenerate() {
    if (!newTokenName.trim()) return
    setGenerating(true)
    setError(null)
    setGeneratedToken(null)
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to generate token')
      const data = (await res.json()) as Token & { token: string }
      setGeneratedToken(data.token)
      setNewTokenName('')
      await fetchTokens()
    } catch {
      setError('Failed to generate token')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevoke(tokenId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/tokens/${tokenId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke token')
      await fetchTokens()
    } catch {
      setError('Failed to revoke token')
    }
  }

  return (
    <main
      className="min-h-screen px-8 py-10"
      style={{ backgroundColor: 'var(--cc-parchment)' }}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
        >
          Profile
        </h1>

        {/* User info */}
        <section
          className="p-6 flex flex-col gap-2"
          style={{ backgroundColor: '#fff', border: '1px solid var(--cc-gray-light)' }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
          >
            Account
          </h2>
          {userName && (
            <div className="flex gap-2">
              <span className="text-sm font-medium w-24" style={{ color: 'var(--cc-gray-mid)' }}>Name</span>
              <span className="text-sm" style={{ color: 'var(--cc-black)' }}>{userName}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-sm font-medium w-24" style={{ color: 'var(--cc-gray-mid)' }}>Email</span>
            <span className="text-sm" style={{ color: 'var(--cc-black)' }}>{userEmail}</span>
          </div>
        </section>

        {/* Generate new token */}
        <section
          className="p-6 flex flex-col gap-4"
          style={{ backgroundColor: '#fff', border: '1px solid var(--cc-gray-light)' }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
          >
            Generate Personal Access Token
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Token name (e.g. My MCP Client)"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleGenerate() }}
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{
                border: '1px solid var(--cc-gray-light)',
                color: 'var(--cc-black)',
              }}
            />
            <button
              onClick={() => void handleGenerate()}
              disabled={generating || !newTokenName.trim()}
              className="px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                backgroundColor: 'var(--cc-black)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {generatedToken && (
            <div
              className="p-4 flex flex-col gap-2"
              style={{ backgroundColor: 'var(--cc-off-white)', border: '1px solid var(--cc-gray-light)' }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
              >
                Copy your token now — it will not be shown again.
              </p>
              <code
                className="text-sm break-all"
                style={{ color: 'var(--cc-black)', fontFamily: 'monospace' }}
              >
                {generatedToken}
              </code>
            </div>
          )}
        </section>

        {/* Existing tokens */}
        <section
          className="p-6 flex flex-col gap-4"
          style={{ backgroundColor: '#fff', border: '1px solid var(--cc-gray-light)' }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
          >
            Personal Access Tokens
          </h2>

          {error && (
            <p className="text-sm" style={{ color: 'var(--cc-red, #c0392b)' }}>{error}</p>
          )}

          {loading ? (
            <p className="text-sm" style={{ color: 'var(--cc-gray-mid)' }}>Loading…</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--cc-gray-mid)' }}>
              No active tokens. Generate one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--cc-gray-light)' }}>
                    {['Name', 'Prefix', 'Created', 'Last Used', ''].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((tok) => (
                    <tr
                      key={tok.id}
                      style={{ borderBottom: '1px solid var(--cc-gray-light)' }}
                    >
                      <td className="px-3 py-2 font-medium" style={{ color: 'var(--cc-black)' }}>
                        {tok.name}
                      </td>
                      <td className="px-3 py-2">
                        <code style={{ fontFamily: 'monospace', color: 'var(--cc-gray-mid)' }}>
                          {tok.prefix}…
                        </code>
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--cc-gray-mid)' }}>
                        {formatDate(tok.createdAt)}
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--cc-gray-mid)' }}>
                        {tok.lastUsedAt ? formatDate(tok.lastUsedAt) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => void handleRevoke(tok.id)}
                          className="px-2 py-1 text-xs font-medium transition-opacity hover:opacity-70"
                          style={{
                            color: 'var(--cc-red, #c0392b)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
