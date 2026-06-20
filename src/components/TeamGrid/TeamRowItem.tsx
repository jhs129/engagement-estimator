'use client'

import { useState, useCallback } from 'react'
import type { TeamMemberRow, LaborRoleOption, SaveState } from './types'

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

interface TeamRowItemProps {
  row: TeamMemberRow
  rowNumber: number
  laborRoles: LaborRoleOption[]
  onSave: (id: string, changes: Partial<TeamMemberRow>) => Promise<void>
  onDelete: (id: string, hasTitle: boolean) => void
  saveState: SaveState
}

export function TeamRowItem({
  row,
  rowNumber,
  laborRoles,
  onSave,
  onDelete,
  saveState,
}: TeamRowItemProps) {
  const [localLaborRoleId, setLocalLaborRoleId] = useState<string | null>(row.laborRoleId)
  const [localTitleOverride, setLocalTitleOverride] = useState(row.titleOverride ?? '')
  const [localAbbrevOverride, setLocalAbbrevOverride] = useState(row.abbreviationOverride ?? '')
  const [localRackRateOverride, setLocalRackRateOverride] = useState<string>(
    row.rackRateOverride !== null ? String(row.rackRateOverride) : ''
  )
  const [localTargetedResource, setLocalTargetedResource] = useState(row.targetedResource ?? '')
  const [editingRackRate, setEditingRackRate] = useState(false)

  const selectedRole = laborRoles.find((lr) => lr.id === localLaborRoleId) ?? null

  const computedAbbreviation = localAbbrevOverride || selectedRole?.abbreviation || ''
  const computedRackRate =
    localRackRateOverride !== ''
      ? Number(localRackRateOverride)
      : selectedRole?.rackRate ?? null

  const handleRoleChange = useCallback(
    async (value: string) => {
      if (value === '__freetext__') return
      const roleId = value === '' ? null : value
      setLocalLaborRoleId(roleId)
      setLocalTitleOverride('')
      await onSave(row.id, {
        laborRoleId: roleId,
        titleOverride: null,
      })
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
      if (override) {
        setLocalLaborRoleId(null)
      }
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

  const rowBg = '#ffffff'
  const rowHoverBg = 'var(--cc-off-white)'

  return (
    <tr
      style={{
        backgroundColor: rowBg,
        borderBottom: '1px solid var(--cc-gray-light)',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowHoverBg
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowBg
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

      {/* Title — role select OR free-text override */}
      <td
        style={{
          padding: '10px 12px',
          minWidth: '180px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {localTitleOverride ? (
          <input
            type="text"
            value={localTitleOverride}
            onChange={(e) => setLocalTitleOverride(e.target.value)}
            onBlur={handleTitleOverrideBlur}
            placeholder="Free-text title…"
            style={inputStyle}
          />
        ) : (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <select
              value={localLaborRoleId ?? ''}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{ ...selectStyle, flex: 1 }}
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
            onClick={() => {
              setLocalTitleOverride('')
            }}
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
      <td
        style={{
          padding: '10px 12px',
          width: '120px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        <input
          type="text"
          value={localAbbrevOverride}
          onChange={(e) => setLocalAbbrevOverride(e.target.value)}
          onBlur={handleAbbrevBlur}
          placeholder="Override…"
          style={inputStyle}
        />
      </td>

      {/* Abbreviation (computed, read-only) */}
      <td
        style={{
          padding: '10px 12px',
          width: '100px',
          borderRight: '1px solid var(--cc-gray-light)',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: computedAbbreviation ? 'var(--cc-black)' : 'var(--cc-gray-light)',
        }}
      >
        {computedAbbreviation || '—'}
      </td>

      {/* Rack Rate */}
      <td
        style={{
          padding: '10px 12px',
          width: '110px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        {editingRackRate ? (
          <input
            type="number"
            value={localRackRateOverride}
            onChange={(e) => setLocalRackRateOverride(e.target.value)}
            onBlur={handleRackRateBlur}
            placeholder="0"
            autoFocus
            style={{ ...inputStyle, width: '80px' }}
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
      <td
        style={{
          padding: '10px 12px',
          borderRight: '1px solid var(--cc-gray-light)',
        }}
      >
        <input
          type="text"
          value={localTargetedResource}
          onChange={(e) => setLocalTargetedResource(e.target.value)}
          onBlur={handleTargetedResourceBlur}
          placeholder="e.g. John Smith"
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
          onClick={() => onDelete(row.id, hasTitle)}
          title="Delete row"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--cc-gray-mid)',
            lineHeight: 1,
          }}
          aria-label="Delete team member"
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
