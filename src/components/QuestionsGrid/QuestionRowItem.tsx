'use client'

import { useState, useCallback } from 'react'
import type { QuestionRow, SaveState } from './types'
import {
  GRID_INPUT_STYLE,
  GRID_SELECT_STYLE,
  GRID_TD_STYLE,
  GRID_ROW_STYLE,
  onGridRowMouseEnter,
  onGridRowMouseLeave,
  GridDeleteButton,
  GridSaveIndicator,
} from '@/components/ui/gridShared'

interface QuestionRowItemProps {
  row: QuestionRow
  rowNumber: number
  onSave: (id: string, changes: Partial<QuestionRow>) => Promise<void>
  onDelete: (id: string, description: string) => void
  saveState: SaveState
  onAddRow: () => void
}

export function QuestionRowItem({ row, rowNumber, onSave, onDelete, saveState, onAddRow }: QuestionRowItemProps) {
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
      style={GRID_ROW_STYLE}
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

      {/* Type */}
      <td style={{ ...GRID_TD_STYLE, width: '140px' }}>
        <select
          value={localType}
          onChange={(e) => handleTypeChange(e.target.value as 'Question' | 'Assumption')}
          style={GRID_SELECT_STYLE}
        >
          <option value="Question">Question</option>
          <option value="Assumption">Assumption</option>
        </select>
      </td>

      {/* Description */}
      <td style={GRID_TD_STYLE}>
        <input
          type="text"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Enter description…"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Notes/Answers */}
      <td style={GRID_TD_STYLE}>
        <input
          type="text"
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={handleNotesBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNotesBlur(); onAddRow() } }}
          placeholder="Notes or answers…"
          style={GRID_INPUT_STYLE}
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
        <GridSaveIndicator saveState={saveState} />
        <GridDeleteButton
          onClick={() => onDelete(row.id, localDescription)}
          label="Delete question"
          title="Delete question"
        />
      </td>
    </tr>
  )
}
