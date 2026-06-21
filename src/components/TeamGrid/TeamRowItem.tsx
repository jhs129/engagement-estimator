'use client'

import { useState, useCallback } from 'react'
import type { TeamMemberRow, LaborRoleOption, SaveState } from './types'
import {
  GRID_INPUT_STYLE,
  GRID_SELECT_STYLE,
  GRID_TD_STYLE,
  GridDeleteButton,
  GridSaveIndicator,
  GripIcon,
} from '@/components/ui/gridShared'

interface TeamRowItemProps {
  row: TeamMemberRow
  rowNumber: number
  laborRoles: LaborRoleOption[]
  onSave: (id: string, changes: Partial<TeamMemberRow>) => Promise<void>
  onDelete: (id: string, hasTitle: boolean) => void
  saveState: SaveState
  onAddRow: () => void
  onDragStart: (id: string) => void
  onDragOver: (id: string) => void
  onDrop: (id: string) => void
  onDragEnd: () => void
  isDragging: boolean
  isDragOver: boolean
}

export function TeamRowItem({
  row,
  rowNumber,
  laborRoles,
  onSave,
  onDelete,
  saveState,
  onAddRow,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: TeamRowItemProps) {
  const [localLaborRoleId, setLocalLaborRoleId] = useState<string | null>(row.laborRoleId)
  const [localTitleOverride, setLocalTitleOverride] = useState(row.titleOverride ?? '')
  const [localAbbrevOverride, setLocalAbbrevOverride] = useState(row.abbreviationOverride ?? '')
  const [localRackRateOverride, setLocalRackRateOverride] = useState<string>(
    row.rackRateOverride !== null ? String(row.rackRateOverride) : ''
  )
  const [localTargetedResource, setLocalTargetedResource] = useState(row.targetedResource ?? '')
  const [editingRackRate, setEditingRackRate] = useState(false)
  const [gripHovered, setGripHovered] = useState(false)
  const [rowHovered, setRowHovered] = useState(false)

  const selectedRole = laborRoles.find((lr) => lr.id === localLaborRoleId) ?? null
  const computedAbbreviation = localAbbrevOverride || selectedRole?.abbreviation || ''
  const computedRackRate =
    localRackRateOverride !== ''
      ? Number(localRackRateOverride)
      : selectedRole?.rackRate ?? null

  const bgColor = isDragging
    ? '#ffffff'
    : isDragOver
    ? '#FFF5F0'
    : rowHovered
    ? 'var(--cc-off-white)'
    : '#ffffff'

  const handleRoleChange = useCallback(
    async (value: string) => {
      if (value === '__freetext__') return
      const roleId = value === '' ? null : value
      setLocalLaborRoleId(roleId)
      setLocalTitleOverride('')
      await onSave(row.id, { laborRoleId: roleId, titleOverride: null })
    },
    [row.id, onSave]
  )

  const handleTitleOverrideBlur = useCallback(async () => {
    const override = localTitleOverride || null
    if (override !== row.titleOverride) {
      await onSave(row.id, {
        titleOverride: override,
        laborRoleId: override ? null : localLaborRoleId,
      })
      if (override) setLocalLaborRoleId(null)
    }
  }, [row.id, row.titleOverride, localTitleOverride, localLaborRoleId, onSave])

  const handleAbbrevBlur = useCallback(async () => {
    const override = localAbbrevOverride || null
    if (override !== row.abbreviationOverride) {
      await onSave(row.id, { abbreviationOverride: override })
    }
  }, [row.id, row.abbreviationOverride, localAbbrevOverride, onSave])

  const handleRackRateBlur = useCallback(async () => {
    setEditingRackRate(false)
    const parsed = localRackRateOverride !== '' ? Number(localRackRateOverride) : null
    if (parsed !== row.rackRateOverride) {
      await onSave(row.id, { rackRateOverride: parsed })
    }
  }, [row.id, row.rackRateOverride, localRackRateOverride, onSave])

  const handleTargetedResourceBlur = useCallback(async () => {
    const val = localTargetedResource || null
    if (val !== row.targetedResource) {
      await onSave(row.id, { targetedResource: val })
    }
  }, [row.id, row.targetedResource, localTargetedResource, onSave])

  const hasTitle = !!(localTitleOverride || selectedRole)

  return (
    <tr
      draggable={gripHovered}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(row.id)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver(row.id)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(row.id)
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
      style={{
        backgroundColor: bgColor,
        borderBottom: '1px solid var(--cc-gray-light)',
        transition: isDragging ? 'none' : 'background-color 0.1s',
        opacity: isDragging ? 0.4 : 1,
        outline: isDragOver && !isDragging ? '2px solid var(--cc-burnt-sienna)' : 'none',
        outlineOffset: '-2px',
      }}
    >
      {/* Drag handle */}
      <td
        onPointerEnter={() => setGripHovered(true)}
        onPointerLeave={() => setGripHovered(false)}
        style={{
          padding: '10px 12px',
          width: '36px',
          textAlign: 'center',
          borderRight: '1px solid var(--cc-gray-light)',
          cursor: 'grab',
          color: rowHovered ? 'var(--cc-gray-mid)' : 'var(--cc-gray-light)',
          userSelect: 'none',
        }}
        title="Drag to reorder"
      >
        <GripIcon />
      </td>

      {/* # */}
      <td
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--cc-gray-mid)',
          width: '36px',
          textAlign: 'center',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {rowNumber}
      </td>

      {/* Title — role select OR free-text override */}
      <td style={{ ...GRID_TD_STYLE, minWidth: '180px' }}>
        {localTitleOverride ? (
          <input
            type="text"
            value={localTitleOverride}
            onChange={(e) => setLocalTitleOverride(e.target.value)}
            onBlur={handleTitleOverrideBlur}
            placeholder="Free-text title…"
            style={GRID_INPUT_STYLE}
          />
        ) : (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <select
              value={localLaborRoleId ?? ''}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{ ...GRID_SELECT_STYLE, flex: 1 }}
            >
              <option value="">-- Select role --</option>
              {laborRoles.map((lr) => (
                <option key={lr.id} value={lr.id}>
                  {lr.fullTitle}
                </option>
              ))}
            </select>
            <button
              title="Use free-text title instead"
              onClick={() => setLocalTitleOverride(' ')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--cc-gray-mid)',
                fontSize: '11px',
                padding: '0 2px',
                flexShrink: 0,
              }}
            >
              ✎
            </button>
          </div>
        )}
        {localTitleOverride && (
          <button
            title="Switch back to role select"
            onClick={() => setLocalTitleOverride('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--cc-gray-mid)',
              fontSize: '11px',
              padding: '0',
              marginTop: '2px',
              display: 'block',
            }}
          >
            ← Use role
          </button>
        )}
      </td>

      {/* Abbrev Override */}
      <td style={{ ...GRID_TD_STYLE, width: '120px' }}>
        <input
          type="text"
          value={localAbbrevOverride}
          onChange={(e) => setLocalAbbrevOverride(e.target.value)}
          onBlur={handleAbbrevBlur}
          placeholder="Override…"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Abbreviation (computed, read-only) */}
      <td
        style={{
          ...GRID_TD_STYLE,
          width: '100px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: computedAbbreviation ? 'var(--cc-black)' : 'var(--cc-gray-light)',
        }}
      >
        {computedAbbreviation || '—'}
      </td>

      {/* Rack Rate */}
      <td style={{ ...GRID_TD_STYLE, width: '110px' }}>
        {editingRackRate ? (
          <input
            type="number"
            value={localRackRateOverride}
            onChange={(e) => setLocalRackRateOverride(e.target.value)}
            onBlur={handleRackRateBlur}
            placeholder="0"
            autoFocus
            style={{ ...GRID_INPUT_STYLE, width: '80px' }}
          />
        ) : (
          <button
            title="Click to override rack rate"
            onClick={() => setEditingRackRate(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: computedRackRate !== null ? 'var(--cc-black)' : 'var(--cc-gray-light)',
              textAlign: 'left',
            }}
          >
            {computedRackRate !== null ? `$${computedRackRate.toLocaleString()}` : '—'}
          </button>
        )}
      </td>

      {/* Targeted Resource */}
      <td style={GRID_TD_STYLE}>
        <input
          type="text"
          value={localTargetedResource}
          onChange={(e) => setLocalTargetedResource(e.target.value)}
          onBlur={handleTargetedResourceBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleTargetedResourceBlur()
              onAddRow()
            }
          }}
          placeholder="e.g. John Smith"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Save + Delete */}
      <td style={{ padding: '10px 12px', width: '52px', textAlign: 'center' }}>
        <GridSaveIndicator saveState={saveState} />
        <GridDeleteButton
          onClick={() => onDelete(row.id, hasTitle)}
          label="Delete team member"
          title="Delete team member"
        />
      </td>
    </tr>
  )
}
