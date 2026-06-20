'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteEstimateButtonProps {
  estimateId: string;
}

export function DeleteEstimateButton({ estimateId }: DeleteEstimateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this estimate? This cannot be undone.')) return;
    setLoading(true);
    try {
      await fetch(`/api/estimates/${estimateId}`, { method: 'DELETE' });
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete estimate"
      className="p-1 transition-colors disabled:opacity-50"
      style={{ color: 'var(--cc-gray-mid)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cc-burnt-sienna)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cc-gray-mid)')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  );
}
