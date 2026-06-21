'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { TeamMemberRow, TeamGridProps, SaveState } from './types'
import { TeamRowItem } from './TeamRowItem'
import { exportTeamToCsv } from './csvExport'
import { CsvImportModal } from '@/components/CsvImportModal'
import { parseTeamImport } from '@/lib/csv/import'
import {
  GRID_TOOLBAR_BTN_STYLE,
  GRID_HEADER_CELL_STYLE,
  GridAddRowButton,
} from '@/components/ui/gridShared'

const MAX_TEAM_MEMBERS = 20

let localIdCounter = 0

type RowSaveState = Record<string, SaveState>

function createBlankRow(order: number): TeamMemberRow {
  localIdCounter += 1
  return {
    id: `local-team-${localIdCounter}`,
    laborRoleId: null,
    laborRoleName: null,
    titleOverride: null,
    abbreviationOverride: null,
    rackRateOverride: null,
    adjustedClientRate: null,
    targetedResource: null,
    order,
  }
}

export function TeamGrid({ estimateId, initialRows, laborRoles }: TeamGridProps) {
  const [rows, setRows] = useState<TeamMemberRow[]>(
    initialRows.length > 0 ? initialRows : [createBlankRow(0)]
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
    async (id: string, changes: Partial<TeamMemberRow>) => {
      const isLocalRow = id.startsWith('local-team-')

      if (isLocalRow) {
        const currentRow = rows.find((r) => r.id === id)
        if (!currentRow) return

        setRowSaveState(id, 'saving')
        try {
          const payload = {
            laborRoleId: changes.laborRoleId !== undefined ? changes.laborRoleId : currentRow.laborRoleId,
            titleOverride: changes.titleOverride !== undefined ? changes.titleOverride : currentRow.titleOverride,
            abbreviationOverride:
              changes.abbreviationOverride !== undefined
                ? changes.abbreviationOverride
                : currentRow.abbreviationOverride,
            rackRateOverride:
              changes.rackRateOverride !== undefined ? changes.rackRateOverride : currentRow.rackRateOverride,
            adjustedClientRate:
              changes.adjustedClientRate !== undefined ? changes.adjustedClientRate : currentRow.adjustedClientRate,
            targetedResource:
              changes.targetedResource !== undefined ? changes.targetedResource : currentRow.targetedResource,
            order: currentRow.order,
          }
          const res = await fetch(`/api/estimates/${estimateId}/team`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) {
            setRowSaveState(id, 'error')
            return
          }
          const created: TeamMemberRow & { laborRole?: { id: string; fullTitle: string } } = await res.json()
          const newRow: TeamMemberRow = {
            id: created.id,
            laborRoleId: created.laborRoleId,
            laborRoleName: created.laborRole?.fullTitle ?? null,
            titleOverride: created.titleOverride,
            abbreviationOverride: created.abbreviationOverride,
            rackRateOverride: created.rackRateOverride,
            adjustedClientRate: created.adjustedClientRate,
            targetedResource: created.targetedResource,
            order: created.order,
          }
          setRows((prev) => prev.map((r) => (r.id === id ? newRow : r)))
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
        const res = await fetch(`/api/estimates/${estimateId}/team/${id}`, {
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
    async (id: string, hasTitle: boolean) => {
      if (hasTitle) {
        const confirmed = window.confirm('Delete this team member?')
        if (!confirmed) return
      }

      if (id.startsWith('local-team-')) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      try {
        await fetch(`/api/estimates/${estimateId}/team/${id}`, {
          method: 'DELETE',
        })
        setRows((prev) => prev.filter((r) => r.id !== id))
      } catch {
        // ignore delete errors silently
      }
    },
    [estimateId]
  )

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
          fetch(`/api/estimates/${estimateId}/team/${r.id}`, {
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

  const handleAddRow = useCallback(() => {
    if (rows.length >= MAX_TEAM_MEMBERS) return
    setRows((prev) => [...prev, createBlankRow(prev.length)])
  }, [rows.length])

  const handleExport = useCallback(() => {
    exportTeamToCsv(rows, laborRoles, estimateId)
  }, [rows, laborRoles, estimateId])

  const handleImport = useCallback(
    async (parsedRows: Array<Record<string, string>>, mode: 'merge' | 'replace') => {
      const parsed = parseTeamImport(parsedRows)
      if (parsed.errors.length > 0) return

      if (mode === 'replace') {
        const existingIds = rows.filter((r) => !r.id.startsWith('local-team-')).map((r) => r.id)
        await Promise.all(
          existingIds.map((id) =>
            fetch(`/api/estimates/${estimateId}/team/${id}`, { method: 'DELETE' })
          )
        )
        setRows([])
      }

      const created: TeamMemberRow[] = []
      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i]
        const currentRows = mode === 'replace' ? created : [...rows, ...created]
        const res = await fetch(`/api/estimates/${estimateId}/team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titleOverride: row.titleOverride || null,
            abbreviationOverride: row.abbreviationOverride || null,
            targetedResource: row.targetedResource || null,
            order: currentRows.length + i,
          }),
        })
        if (res.ok) {
          const data: TeamMemberRow & { laborRole?: { id: string; fullTitle: string } } = await res.json()
          created.push({
            id: data.id,
            laborRoleId: data.laborRoleId,
            laborRoleName: data.laborRole?.fullTitle ?? null,
            titleOverride: data.titleOverride,
            abbreviationOverride: data.abbreviationOverride,
            rackRateOverride: data.rackRateOverride,
            adjustedClientRate: data.adjustedClientRate,
            targetedResource: data.targetedResource,
            order: data.order,
          })
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
    return parseTeamImport(parsedRows).errors
  }, [])

  const atLimit = rows.length >= MAX_TEAM_MEMBERS

  return (
    <div style={{ padding: '24px 32px' }}>
      <CsvImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        tabLabel="Team"
        expectedColumns={['Title', 'AbbreviationOverride', 'TargetedResource']}
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
              {['', '#', 'Title', 'Abbrev Override', 'Abbreviation', 'Rack Rate', 'Targeted Resource', ''].map(
                (col, i, arr) => (
                  <th
                    key={`${col}-${i}`}
                    style={{
                      ...GRID_HEADER_CELL_STYLE,
                      width: i === 0 ? '36px' : undefined,
                      borderRight: i < arr.length - 1 ? '1px solid var(--cc-gray-light)' : 'none',
                    }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {[...rows].sort((a, b) => a.order - b.order).map((row, index) => (
              <TeamRowItem
                key={row.id}
                row={row}
                rowNumber={index + 1}
                laborRoles={laborRoles}
                onSave={handleSave}
                onDelete={handleDelete}
                saveState={rowSaveStates[row.id] ?? 'idle'}
                onAddRow={handleAddRow}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={dragSourceId === row.id}
                isDragOver={dragOverId === row.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <GridAddRowButton
        onClick={handleAddRow}
        label="+ Add Member"
        disabled={atLimit}
        disabledLabel={`Maximum ${MAX_TEAM_MEMBERS} team members reached`}
      />
    </div>
  )
}
