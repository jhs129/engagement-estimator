'use client';

import { useState } from 'react';
import { NewEstimateModal } from './NewEstimateModal';

export function NewEstimateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'var(--cc-burnt-sienna)',
          fontFamily: 'var(--font-display)',
        }}
      >
        New Estimate
      </button>

      {open && <NewEstimateModal onClose={() => setOpen(false)} />}
    </>
  );
}
