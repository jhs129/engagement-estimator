'use client'

import { useState, useCallback } from 'react'
import type { EpicRow, EpicsGridProps, SaveState } from './types'
import { EpicRowItem } from './EpicRowItem'
import { exportEpicsToCsv } from './csvExport'

let localIdCounter = 0
function nextLocalId(): string {
  localIdCounter += 1
  return `local-${localIdCounter}`
}

type RowSaveState = Record<string, SaveState>

const COLUMNS = ['#', 'Epic Name', 'Description', 'Story Hours', 'Foundation Hours', 'Total Hours', '%', '']

export function EpicsGrid({ estimateId, initialRows }: EpicsGridProps) {
  const [rows, setRows] = useState<EpicRow[]>(initialRows)
  const [rowSaveStates, setRowSaveStates] = useState<RowSaveState>({})

  const setRowSaveState = useCallback((id: string, state: SaveState) => {
    setRowSaveStates((prev) => ({ ...prev, [id]: state }))
  }, [])

  const handleSave = useCallback(
    async (id: string, changes: Partial<Pick<EpicRow, 'name' | 'description'>>) => {
      const isLocalRow = id.startsWith('local-')

      if (isLocalRow) {
        const currentRow = rows.find((r) => r.id === id)
        if (!currentRow) return

        setRowSaveState(id, 'saving')
        try {
          const payload = {
            name: changes.name ?? currentRow.name,
            description: changes.description !== undefined ? changes.description : currentRow.description,
            isFoundation: false,
            order: rows.length - 1,
          }
          const res = await fetch(`/api/estimates/${estimateId}/epics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) {
            setRowSaveState(id, 'error')
            return
          }
          const created: EpicRow = await res.json()
          setRows((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    ...changes,
                    id: created.id,
                    storyHours: 0,
                    foundationHours: 0,
                    totalHours: 0,
                    percent: 0,
                  }
                : r
            )
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
        const res = await fetch(`/api/estimates/${estimateId}/epics/${id}`, {
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
    async (id: string, name: string) => {
      if (name.trim()) {
        const confirmed = window.confirm('Delete this epic?')
        if (!confirmed) return
      }

      if (id.startsWith('local-')) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      try {
        await fetch(`/api/estimates/${estimateId}/epics/${id}`, {
          method: 'DELETE',
        })
        setRows((prev) => prev.filter((r) => r.id !== id))
      } catch {
        // ignore delete errors silently
      }
    },
    [estimateId]
  )

  const handleAddEpic = useCallback(() => {
    const newRow: EpicRow = {
      id: nextLocalId(),
      name: '',
      description: null,
      isFoundation: false,
      order: rows.length,
      storyHours: 0,
      foundationHours: 0,
      totalHours: 0,
      percent: 0,
    }
    setRows((prev) => [...prev, newRow])
  }, [rows.length])

  const handleExport = useCallback(() => {
    exportEpicsToCsv(rows, estimateId)
  }, [rows, estimateId])

  const totalStoryHours = rows.reduce((sum, r) => sum + r.storyHours, 0)
  const totalFoundationHours = rows.reduce((sum, r) => sum + r.foundationHours, 0)
  const totalHours = rows.reduce((sum, r) => sum + r.totalHours, 0)

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
              {COLUMNS.map((col, i) => (
                <th
                  key={`${col}-${i}`}
                  style={{
                    padding: '10px 12px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--cc-gray-mid)',
                    textAlign: i >= 3 && i <= 6 ? 'right' : 'left',
                    borderRight: i < COLUMNS.length - 1 ? '1px solid var(--cc-gray-light)' : 'none',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <EpicRowItem
                key={row.id}
                row={row}
                rowNumber={index + 1}
                onSave={handleSave}
                onDelete={handleDelete}
                saveState={rowSaveStates[row.id] ?? 'idle'}
              />
            ))}
          </tbody>
          <tfoot>
            <tr
              style={{
                backgroundColor: 'var(--cc-parchment)',
                borderTop: '2px solid var(--cc-gray-light)',
              }}
            >
              <td
                colSpan={3}
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--cc-gray-mid)',
                  borderRight: '1px solid var(--cc-gray-light)',
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--cc-black)',
                  textAlign: 'right',
                  borderRight: '1px solid var(--cc-gray-light)',
                }}
              >
                {totalStoryHours.toFixed(1)}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--cc-black)',
                  textAlign: 'right',
                  borderRight: '1px solid var(--cc-gray-light)',
                }}
              >
                {totalFoundationHours.toFixed(1)}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--cc-black)',
                  textAlign: 'right',
                  borderRight: '1px solid var(--cc-gray-light)',
                }}
              >
                {totalHours.toFixed(1)}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--cc-gray-mid)',
                  textAlign: 'right',
                  borderRight: '1px solid var(--cc-gray-light)',
                }}
              >
                100%
              </td>
              <td style={{ padding: '10px 12px' }} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Epic Button */}
      <button
        onClick={handleAddEpic}
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
        + Add Epic
      </button>
    </div>
  )
}
