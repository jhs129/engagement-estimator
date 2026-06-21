'use client'

import { useState, useCallback } from 'react'
import type { EpicRow, SaveState } from './types'
import {
  GRID_INPUT_STYLE,
  GRID_TD_STYLE,
  GRID_ROW_STYLE,
  onGridRowMouseEnter,
  onGridRowMouseLeave,
  GridDeleteButton,
  GridSaveIndicator,
} from '@/components/ui/gridShared'

interface EpicRowItemProps {
  row: EpicRow
  rowNumber: number
  onSave: (id: string, changes: Partial<Pick<EpicRow, 'name' | 'description'>>) => Promise<void>
  onDelete: (id: string, name: string) => void
  onAddRow: () => void
  saveState: SaveState
}

export function EpicRowItem({ row, rowNumber, onSave, onDelete, onAddRow, saveState }: EpicRowItemProps) {
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
      style={{ ...GRID_ROW_STYLE, ...foundationBorderStyle }}
      onMouseEnter={onGridRowMouseEnter}
      onMouseLeave={onGridRowMouseLeave}
    >
      {/* # */}
      <td
        style={{
          ...GRID_TD_STYLE,
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-gray-mid)',
          width: '48px',
          textAlign: 'center',
        }}
      >
        {rowNumber}
      </td>

      {/* Epic Name */}
      <td
        style={{
          ...GRID_TD_STYLE,
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
            style={GRID_INPUT_STYLE}
          />
        )}
      </td>

      {/* Description */}
      <td style={GRID_TD_STYLE}>
        <input
          type="text"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleDescriptionBlur()
              onAddRow()
            }
          }}
          placeholder="Description…"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Story Hours */}
      <td
        style={{
          ...GRID_TD_STYLE,
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-black)',
          textAlign: 'right',
          width: '110px',
        }}
      >
        {row.storyHours.toFixed(1)}
      </td>

      {/* Foundation Hours */}
      <td
        style={{
          ...GRID_TD_STYLE,
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-black)',
          textAlign: 'right',
          width: '130px',
        }}
      >
        {row.foundationHours.toFixed(1)}
      </td>

      {/* Total Hours */}
      <td
        style={{
          ...GRID_TD_STYLE,
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--cc-black)',
          textAlign: 'right',
          width: '110px',
        }}
      >
        {row.totalHours.toFixed(1)}
      </td>

      {/* % */}
      <td
        style={{
          ...GRID_TD_STYLE,
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-gray-mid)',
          textAlign: 'right',
          width: '72px',
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
        <GridSaveIndicator saveState={saveState} />
        {!row.isFoundation && (
          <GridDeleteButton
            onClick={() => onDelete(row.id, localName)}
            label="Delete epic"
            title="Delete epic"
          />
        )}
      </td>
    </tr>
  )
}
