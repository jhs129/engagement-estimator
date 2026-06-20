'use client'

import { useState, useCallback } from 'react'
import type { QuestionRow, SaveState } from './types'

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

const selectStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--cc-black)',
  cursor: 'pointer',
  width: '100%',
}

interface QuestionRowItemProps {
  row: QuestionRow
  rowNumber: number
  onSave: (id: string, changes: Partial<QuestionRow>) => Promise<void>
  onDelete: (id: string, description: string) => void
  saveState: SaveState
}

export function QuestionRowItem({ row, rowNumber, onSave, onDelete, saveState }: QuestionRowItemProps) {
  const [localType, setLocalType] = useState<'Question' | 'Assumption'>(row.type)
  const [localDescription, setLocalDescription] = useState(row.description)
  const [localNotes, setLocalNotes] = useState(row.notes ?? '')

  const handleTypeChange = useCallback(
    async (value: 'Question' | 'Assumption') => {
      setLocalType(value)
      await onSave(row.id, { type: value })
    },
    [row.id, onSave]
  )

  const handleDescriptionBlur = useCallback(async () => {
    if (localDescription !== row.description) {
      await onSave(row.id, { description: localDescription })
    }
  }, [row.id, row.description, localDescription, onSave])

  const handleNotesBlur = useCallback(async () => {
    const notesValue = localNotes || null
    if (notesValue !== row.notes) {
      await onSave(row.id, { notes: notesValue })
    }
  }, [row.id, row.notes, localNotes, onSave])

  return (
    <tr
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--cc-gray-light)',
        transition: 'background-color 0.1s',
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

      {/* Type */}
      <td
        style={{
          padding: '10px 12px',
          width: '140px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        <select
          value={localType}
          onChange={(e) => handleTypeChange(e.target.value as 'Question' | 'Assumption')}
          style={selectStyle}
        >
          <option value="Question">Question</option>
          <option value="Assumption">Assumption</option>
        </select>
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
          placeholder="Enter description…"
          style={inputStyle}
        />
      </td>

      {/* Notes/Answers */}
      <td
        style={{
          padding: '10px 12px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        <input
          type="text"
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Notes or answers…"
          style={inputStyle}
        />
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
        <button
          onClick={() => onDelete(row.id, localDescription)}
          title="Delete row"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--cc-gray-mid)',
            lineHeight: 1,
          }}
          aria-label="Delete question"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4h9.334Z"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </td>
    </tr>
  )
}
