'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { EpicRow, EpicsGridProps, SaveState } from './types'
import { EpicRowItem } from './EpicRowItem'
import { exportEpicsToCsv } from './csvExport'
import { CsvImportModal } from '@/components/CsvImportModal'
import { parseEpicsImport } from '@/lib/csv/import'
import {
  GRID_HEADER_CELL_STYLE,
  GRID_TOOLBAR_BTN_STYLE,
  GridAddRowButton,
} from '@/components/ui/gridShared'

let epicLocalIdCounter = 0
function createBlankEpic(order: number): EpicRow {
  epicLocalIdCounter += 1
  return {
    id: `local-${epicLocalIdCounter}`,
    name: '',
    description: null,
    isFoundation: false,
    order,
    storyHours: 0,
    foundationHours: 0,
    totalHours: 0,
    percent: 0,
  }
}

type RowSaveState = Record<string, SaveState>

const COLUMNS = ['', '#', 'Epic Name', 'Description', 'Story Hours', 'Foundation Hours', 'Total Hours', '%', '']

export function EpicsGrid({ estimateId, initialRows }: EpicsGridProps) {
  const [rows, setRows] = useState<EpicRow[]>(
    initialRows.length === 0 ? [createBlankEpic(0)] : initialRows
  )
  const [rowSaveStates, setRowSaveStates] = useState<RowSaveState>({})
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const rowsRef = useRef(rows)
  useEffect(() => { rowsRef.current = rows }, [rows])
  const dragSourceIdRef = useRef<string | null>(null)

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
    setRows((prev) => [...prev, createBlankEpic(prev.length)])
  }, [])

  const handleDragStart = useCallback((id: string) => {
    setDragSourceId(id)
    dragSourceIdRef.current = id
  }, [])

  const handleDragOver = useCallback((id: string) => {
    setDragOverId(id)
  }, [])

  const handleDrop = useCallback(
    async (targetId: string) => {
      const sourceId = dragSourceIdRef.current
      setDragSourceId(null)
      setDragOverId(null)
      dragSourceIdRef.current = null
      if (!sourceId || sourceId === targetId) return

      const sorted = [...rowsRef.current].sort((a, b) => a.order - b.order)
      const sourceIdx = sorted.findIndex((r) => r.id === sourceId)
      const targetIdx = sorted.findIndex((r) => r.id === targetId)
      if (sourceIdx < 0 || targetIdx < 0) return

      const reordered = [...sorted]
      const [moved] = reordered.splice(sourceIdx, 1)
      reordered.splice(targetIdx, 0, moved)

      const withNewOrders = reordered.map((r, i) => ({ ...r, order: i }))
      setRows(withNewOrders)

      const originalOrderById = Object.fromEntries(sorted.map((r) => [r.id, r.order]))
      const toUpdate = withNewOrders.filter(
        (r) => r.order !== originalOrderById[r.id] && !r.id.startsWith('local-')
      )
      await Promise.all(
        toUpdate.map((r) =>
          fetch(`/api/estimates/${estimateId}/epics/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: r.order }),
          })
        )
      )
    },
    [estimateId]
  )

  const handleDragEnd = useCallback(() => {
    setDragSourceId(null)
    setDragOverId(null)
    dragSourceIdRef.current = null
  }, [])

  const handleExport = useCallback(() => {
    exportEpicsToCsv(rows, estimateId)
  }, [rows, estimateId])

  const handleImport = useCallback(
    async (parsedRows: Array<Record<string, string>>, mode: 'merge' | 'replace') => {
      const parsed = parseEpicsImport(parsedRows)
      if (parsed.errors.length > 0) return

      if (mode === 'replace') {
        // Only delete non-foundation epics
        const nonFoundationIds = rows
          .filter((r) => !r.isFoundation && !r.id.startsWith('local-'))
          .map((r) => r.id)
        await Promise.all(
          nonFoundationIds.map((id) =>
            fetch(`/api/estimates/${estimateId}/epics/${id}`, { method: 'DELETE' })
          )
        )
        setRows((prev) => prev.filter((r) => r.isFoundation))
      }

      const created: EpicRow[] = []
      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i]
        const res = await fetch(`/api/estimates/${estimateId}/epics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: row.name,
            description: row.description || null,
            isFoundation: false,
            order: rows.filter((r) => !r.isFoundation).length + created.length + i,
          }),
        })
        if (res.ok) {
          const newEpic: EpicRow = await res.json()
          created.push({
            ...newEpic,
            storyHours: 0,
            foundationHours: 0,
            totalHours: 0,
            percent: 0,
          })
        }
      }

      if (mode === 'replace') {
        setRows((prev) => [...prev, ...created])
      } else {
        setRows((prev) => [...prev, ...created])
      }
    },
    [estimateId, rows]
  )

  const getValidationErrors = useCallback((parsedRows: Array<Record<string, string>>) => {
    return parseEpicsImport(parsedRows).errors
  }, [])

  const totalStoryHours = rows.reduce((sum, r) => sum + r.storyHours, 0)
  const totalFoundationHours = rows.reduce((sum, r) => sum + r.foundationHours, 0)
  const totalHours = rows.reduce((sum, r) => sum + r.totalHours, 0)

  return (
    <div style={{ padding: '24px 32px' }}>
      <CsvImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        tabLabel="Epics"
        expectedColumns={['EpicName', 'Description']}
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
              {COLUMNS.map((col, i) => (
                <th
                  key={`${col}-${i}`}
                  style={{
                    ...GRID_HEADER_CELL_STYLE,
                    width: i === 0 ? '36px' : undefined,
                    textAlign: i >= 4 && i <= 7 ? 'right' : 'left',
                    borderRight: i < COLUMNS.length - 1 ? '1px solid var(--cc-gray-light)' : 'none',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...rows].sort((a, b) => a.order - b.order).map((row, index) => (
              <EpicRowItem
                key={row.id}
                row={row}
                rowNumber={index + 1}
                onSave={handleSave}
                onDelete={handleDelete}
                onAddRow={handleAddEpic}
                saveState={rowSaveStates[row.id] ?? 'idle'}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={dragSourceId === row.id}
                isDragOver={dragOverId === row.id}
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
                colSpan={4}
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
      <GridAddRowButton onClick={handleAddEpic} label="+ Add Epic" />
    </div>
  )
}
