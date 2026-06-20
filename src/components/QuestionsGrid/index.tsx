'use client'

import { useState, useCallback } from 'react'
import type { QuestionRow, QuestionsGridProps, SaveState } from './types'
import { QuestionRowItem } from './QuestionRowItem'
import { exportQuestionsToCsv } from './csvExport'

let localIdCounter = 0
function nextLocalId(): string {
  localIdCounter += 1
  return `local-${localIdCounter}`
}

type RowSaveState = Record<string, SaveState>

export function QuestionsGrid({ estimateId, initialRows }: QuestionsGridProps) {
  const [rows, setRows] = useState<QuestionRow[]>(initialRows)
  const [rowSaveStates, setRowSaveStates] = useState<RowSaveState>({})

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
    const newRow: QuestionRow = {
      id: nextLocalId(),
      type: 'Question',
      description: '',
      notes: null,
      order: rows.length,
    }
    setRows((prev) => [...prev, newRow])
  }, [rows.length])

  const handleExport = useCallback(() => {
    exportQuestionsToCsv(rows, estimateId)
  }, [rows, estimateId])

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={handleExport}
          style={{
            padding: '7px 16px',
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: 'none',
            border: '1px solid var(--cc-gray-light)',
            cursor: 'pointer',
            color: 'var(--cc-black)',
          }}
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
                    padding: '10px 12px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--cc-gray-mid)',
                    textAlign: 'left',
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
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <button
        onClick={handleAddRow}
        style={{
          marginTop: '12px',
          padding: '8px 16px',
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          backgroundColor: 'var(--cc-burnt-sienna)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        + Add Row
      </button>
    </div>
  )
}
