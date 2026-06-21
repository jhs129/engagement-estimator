'use client'

import { useState, useCallback } from 'react'
import type { QuestionRow, QuestionsGridProps, SaveState } from './types'
import { QuestionRowItem } from './QuestionRowItem'
import { exportQuestionsToCsv } from './csvExport'
import { CsvImportModal } from '@/components/CsvImportModal'
import { parseQuestionsImport } from '@/lib/csv/import'
import {
  GRID_TOOLBAR_BTN_STYLE,
  GRID_HEADER_CELL_STYLE,
  GridAddRowButton,
} from '@/components/ui/gridShared'

let localIdCounter = 0

function createBlankRow(order: number): QuestionRow {
  localIdCounter += 1
  return {
    id: `local-${localIdCounter}`,
    type: 'Question',
    description: '',
    notes: null,
    order,
  }
}

type RowSaveState = Record<string, SaveState>

export function QuestionsGrid({ estimateId, initialRows }: QuestionsGridProps) {
  const [rows, setRows] = useState<QuestionRow[]>(
    initialRows.length > 0 ? initialRows : [createBlankRow(0)]
  )
  const [rowSaveStates, setRowSaveStates] = useState<RowSaveState>({})
  const [importModalOpen, setImportModalOpen] = useState(false)

  const setRowSaveState = useCallback((id: string, state: SaveState) => {
    setRowSaveStates((prev) => ({ ...prev, [id]: state }))
  }, [])

  const handleSave = useCallback(
    async (id: string, changes: Partial<QuestionRow>) => {
      const isLocalRow = id.startsWith('local-')

      if (isLocalRow) {
        const currentRow = rows.find((r) => r.id === id)
        if (!currentRow) return

        setRowSaveState(id, 'saving')
        try {
          const payload = {
            type: changes.type ?? currentRow.type,
            description: changes.description ?? currentRow.description,
            notes: changes.notes !== undefined ? changes.notes : currentRow.notes,
            order: currentRow.order,
          }
          const res = await fetch(`/api/estimates/${estimateId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) {
            setRowSaveState(id, 'error')
            return
          }
          const created: QuestionRow = await res.json()
          setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...changes, id: created.id } : r))
          )
          setRowSaveStates((prev) => {
            const next = { ...prev }
            delete next[id]
            next[created.id] = 'idle'
            return next
          })
        } catch {
          setRowSaveState(id, 'error')
        }
        return
      }

      setRowSaveState(id, 'saving')
      try {
        const res = await fetch(`/api/estimates/${estimateId}/questions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
        })
        if (!res.ok) {
          setRowSaveState(id, 'error')
          return
        }
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))
        setRowSaveState(id, 'idle')
      } catch {
        setRowSaveState(id, 'error')
      }
    },
    [estimateId, rows, setRowSaveState]
  )

  const handleDelete = useCallback(
    async (id: string, description: string) => {
      if (description.trim()) {
        const confirmed = window.confirm('Delete this row?')
        if (!confirmed) return
      }

      if (id.startsWith('local-')) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      try {
        await fetch(`/api/estimates/${estimateId}/questions/${id}`, {
          method: 'DELETE',
        })
        setRows((prev) => prev.filter((r) => r.id !== id))
      } catch {
        // ignore delete errors silently
      }
    },
    [estimateId]
  )

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, createBlankRow(prev.length)])
  }, [])

  const handleExport = useCallback(() => {
    exportQuestionsToCsv(rows, estimateId)
  }, [rows, estimateId])

  const handleImport = useCallback(
    async (parsedRows: Array<Record<string, string>>, mode: 'merge' | 'replace') => {
      const parsed = parseQuestionsImport(parsedRows)
      if (parsed.errors.length > 0) return

      if (mode === 'replace') {
        const existingIds = rows.filter((r) => !r.id.startsWith('local-')).map((r) => r.id)
        await Promise.all(
          existingIds.map((id) =>
            fetch(`/api/estimates/${estimateId}/questions/${id}`, { method: 'DELETE' })
          )
        )
        setRows([])
      }

      const created: QuestionRow[] = []
      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i]
        const currentRows = mode === 'replace' ? created : [...rows, ...created]
        const res = await fetch(`/api/estimates/${estimateId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: row.type,
            description: row.description,
            notes: row.notes || null,
            order: currentRows.length + i,
          }),
        })
        if (res.ok) {
          const newRow: QuestionRow = await res.json()
          created.push(newRow)
        }
      }

      if (mode === 'replace') {
        setRows(created)
      } else {
        setRows((prev) => [...prev, ...created])
      }
    },
    [estimateId, rows]
  )

  const getValidationErrors = useCallback((parsedRows: Array<Record<string, string>>) => {
    return parseQuestionsImport(parsedRows).errors
  }, [])

  return (
    <div style={{ padding: '24px 32px' }}>
      <CsvImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        tabLabel="Questions"
        expectedColumns={['Type', 'Description', 'Notes/Answers']}
        getValidationErrors={getValidationErrors}
      />

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setImportModalOpen(true)}
          style={GRID_TOOLBAR_BTN_STYLE}
        >
          Import CSV
        </button>
        <button
          onClick={handleExport}
          style={GRID_TOOLBAR_BTN_STYLE}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid var(--cc-gray-light)',
            backgroundColor: '#ffffff',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--cc-parchment)',
                borderBottom: '2px solid var(--cc-gray-light)',
              }}
            >
              {['#', 'Type', 'Description', 'Notes / Answers', ''].map((col) => (
                <th
                  key={col}
                  style={{
                    ...GRID_HEADER_CELL_STYLE,
                    borderRight: col !== '' ? '1px solid var(--cc-gray-light)' : 'none',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <QuestionRowItem
                key={row.id}
                row={row}
                rowNumber={index + 1}
                onSave={handleSave}
                onDelete={handleDelete}
                saveState={rowSaveStates[row.id] ?? 'idle'}
                onAddRow={handleAddRow}
              />
            ))}
          </tbody>
        </table>
      </div>

      <GridAddRowButton onClick={handleAddRow} label="+ Add Row" />
    </div>
  )
}
