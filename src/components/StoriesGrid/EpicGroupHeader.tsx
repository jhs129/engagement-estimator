'use client'

import type { EpicGroup } from './types'

interface EpicGroupHeaderProps {
  epic: EpicGroup
  totalHours: number
  colSpan: number
}

export function EpicGroupHeader({ epic, totalHours, colSpan }: EpicGroupHeaderProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          backgroundColor: 'var(--cc-near-black)',
          color: '#ffffff',
          padding: '8px 12px',
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{epic.name}</span>
          <span style={{ fontWeight: 400, opacity: 0.75, fontSize: '11px' }}>
            {totalHours.toFixed(1)} hrs
          </span>
        </span>
      </td>
    </tr>
  )
}
