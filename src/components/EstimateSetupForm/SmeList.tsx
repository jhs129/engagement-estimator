'use client';

import { useState } from 'react';
import type { SmeEntry } from './types';

interface SmeListProps {
  estimateId: string;
  initialSmes: SmeEntry[];
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid var(--cc-gray-light)',
  backgroundColor: '#fff',
  color: 'var(--cc-black)',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  width: '100%',
};

export function SmeList({ estimateId, initialSmes }: SmeListProps) {
  const [smes, setSmes] = useState<SmeEntry[]>(initialSmes);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (adding) return;
    setAdding(true);
    const order = smes.length;
    const res = await fetch(`/api/estimates/${estimateId}/smes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', domain: null, order }),
    });
    if (res.ok) {
      const created: SmeEntry = await res.json();
      setSmes((prev) => [...prev, created]);
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    setSmes((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/estimates/${estimateId}/smes/${id}`, { method: 'DELETE' });
  }

  async function handlePatch(id: string, patch: { name?: string; domain?: string | null }) {
    await fetch(`/api/estimates/${estimateId}/smes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  }

  function updateLocal(id: string, field: 'name' | 'domain', value: string) {
    setSmes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  if (smes.length === 0) {
    return (
      <div>
        <p className="text-sm mb-3" style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-body)' }}>
          No SMEs added yet.
        </p>
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={adding}
          className="px-4 py-2 text-xs font-semibold disabled:opacity-40"
          style={{
            border: '1px solid var(--cc-gray-light)',
            backgroundColor: '#fff',
            fontFamily: 'var(--font-display)',
            color: 'var(--cc-black)',
            cursor: 'pointer',
          }}
        >
          + Add SME
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          border: '1px solid var(--cc-gray-light)',
          backgroundColor: '#fff',
          marginBottom: '12px',
        }}
      >
        {/* Header row */}
        <div
          className="grid gap-0"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            borderBottom: '1px solid var(--cc-gray-light)',
            backgroundColor: 'var(--cc-off-white)',
          }}
        >
          {(['Name', 'Domain / Specialty'] as const).map((label) => (
            <div
              key={label}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
            >
              {label}
            </div>
          ))}
          <div style={{ width: '32px' }} />
        </div>

        {/* Entries */}
        {smes.map((sme) => (
          <div
            key={sme.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              borderBottom: '1px solid var(--cc-gray-light)',
            }}
          >
            <div style={{ borderRight: '1px solid var(--cc-gray-light)' }}>
              <input
                type="text"
                value={sme.name}
                onChange={(e) => updateLocal(sme.id, 'name', e.target.value)}
                onBlur={() => void handlePatch(sme.id, { name: sme.name })}
                placeholder="Person name…"
                style={{ ...inputStyle, borderRadius: 0, border: 'none' }}
              />
            </div>
            <div style={{ borderRight: '1px solid var(--cc-gray-light)' }}>
              <input
                type="text"
                value={sme.domain ?? ''}
                onChange={(e) => updateLocal(sme.id, 'domain', e.target.value)}
                onBlur={() => void handlePatch(sme.id, { domain: sme.domain || null })}
                placeholder="e.g. Technology, Strategy…"
                style={{ ...inputStyle, borderRadius: 0, border: 'none' }}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleDelete(sme.id)}
              className="flex items-center justify-center"
              style={{
                width: '32px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--cc-gray-mid)',
                fontSize: '14px',
              }}
              aria-label="Remove SME"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handleAdd()}
        disabled={adding}
        className="px-4 py-2 text-xs font-semibold disabled:opacity-40"
        style={{
          border: '1px solid var(--cc-gray-light)',
          backgroundColor: '#fff',
          fontFamily: 'var(--font-display)',
          color: 'var(--cc-black)',
          cursor: 'pointer',
        }}
      >
        {adding ? '…' : '+ Add SME'}
      </button>
    </div>
  );
}
