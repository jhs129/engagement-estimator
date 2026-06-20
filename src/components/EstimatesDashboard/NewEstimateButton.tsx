'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewEstimateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Estimate', clientName: 'TBD', salesOwner: 'TBD' }),
      });
      if (!res.ok) throw new Error('Failed to create estimate');
      const data = await res.json();
      router.push(`/estimates/${data.id}/setup`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="px-5 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
      style={{
        backgroundColor: 'var(--cc-burnt-sienna)',
        fontFamily: 'var(--font-display)',
      }}
    >
      {loading ? 'Creating…' : 'New Estimate'}
    </button>
  );
}
