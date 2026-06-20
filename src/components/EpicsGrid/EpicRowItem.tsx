'use client'

import { useState, useCallback } from 'react'
import type { EpicRow, SaveState } from './types'

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--cc-black)',
  padding: '0',
}

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4h9.334Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface EpicRowItemProps {
  row: EpicRow
  rowNumber: number
  onSave: (id: string, changes: Partial<Pick<EpicRow, 'name' | 'description'>>) => Promise<void>
  onDelete: (id: string, name: string) => void
  saveState: SaveState
}

export function EpicRowItem({ row, rowNumber, onSave, onDelete, saveState }: EpicRowItemProps) {
  const [localName, setLocalName] = useState(row.name)
  const [localDescription, setLocalDescription] = useState(row.description ?? '')

  const handleNameBlur = useCallback(async () => {
    if (!row.isFoundation && localName !== row.name) {
      await onSave(row.id, { name: localName })
    }
  }, [row.id, row.isFoundation, row.name, localName, onSave])

  const handleDescriptionBlur = useCallback(async () => {
    const descVal = localDescription || null
    if (descVal !== row.description) {
      await onSave(row.id, { description: descVal })
    }
  }, [row.id, row.description, localDescription, onSave])

  const foundationBorderStyle: React.CSSProperties = row.isFoundation
    ? { borderLeft: '3px solid var(--cc-gray-mid)' }
    : {}

  return (
    <tr
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--cc-gray-light)',
        transition: 'background-color 0.1s',
        ...foundationBorderStyle,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--cc-off-white)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#ffffff'
      }}
    >
      {/* # */}
      <td
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-gray-mid)',
          width: '48px',
          textAlign: 'center',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {rowNumber}
      </td>

      {/* Epic Name */}
      <td
        style={{
          padding: '10px 12px',
          borderRight: '1px solid var(--cc-gray-light)',
          minWidth: '200px',
        }}
      >
        {row.isFoundation ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--cc-black)',
              }}
            >
              {row.name}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--cc-gray-mid)',
                textTransform: 'uppercase',
                padding: '2px 5px',
                border: '1px solid var(--cc-gray-light)',
                lineHeight: 1.4,
              }}
            >
              Foundation
            </span>
          </div>
        ) : (
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Epic name…"
            style={inputStyle}
          />
        )}
      </td>

      {/* Description */}
      <td
        style={{
          padding: '10px 12px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        <input
          type="text"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Description…"
          style={inputStyle}
        />
      </td>

      {/* Story Hours */}
      <td
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-black)',
          textAlign: 'right',
          width: '110px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {row.storyHours.toFixed(1)}
      </td>

      {/* Foundation Hours */}
      <td
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-black)',
          textAlign: 'right',
          width: '130px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {row.foundationHours.toFixed(1)}
      </td>

      {/* Total Hours */}
      <td
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--cc-black)',
          textAlign: 'right',
          width: '110px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {row.totalHours.toFixed(1)}
      </td>

      {/* % */}
      <td
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-gray-mid)',
          textAlign: 'right',
          width: '72px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {row.percent.toFixed(1)}%
      </td>

      {/* Delete */}
      <td
        style={{
          padding: '10px 12px',
          width: '52px',
          textAlign: 'center',
        }}
      >
        {saveState === 'error' && (
          <span
            title="Save error"
            style={{
              fontSize: '11px',
              color: 'var(--cc-burnt-sienna)',
              display: 'block',
              marginBottom: '2px',
            }}
          >
            !
          </span>
        )}
        {!row.isFoundation && (
          <button
            onClick={() => onDelete(row.id, localName)}
            title="Delete epic"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--cc-gray-mid)',
              lineHeight: 1,
            }}
            aria-label="Delete epic"
          >
            <TrashIcon />
          </button>
        )}
      </td>
    </tr>
  )
}
