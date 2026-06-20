'use client'

import { calculateStaffingDelta } from '@/lib/calculations/staffing'
import { formatWeekHeader, formatWeekTooltip } from './weekUtils'
import type { StaffingMemberRow } from './types'

const cellStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--cc-black)',
  borderRight: '1px solid var(--cc-gray-light)',
  borderBottom: '1px solid var(--cc-gray-light)',
  backgroundColor: '#ffffff',
  textAlign: 'right',
  whiteSpace: 'nowrap',
}

const fixedCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#fafafa',
}

const statusColors: Record<'green' | 'yellow' | 'red', string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
}

interface StaffingRowProps {
  row: StaffingMemberRow
  rowNumber: number
  weekColumns: string[]
  estimateId: string
  onWeekHoursChange: (
    teamMemberId: string,
    weekStartDate: string,
    hours: number,
    newStaffedHours: number,
    newDelta: number,
    newStatus: 'green' | 'yellow' | 'red'
  ) => void
}

export function StaffingRow({
  row,
  rowNumber,
  weekColumns,
  estimateId,
  onWeekHoursChange,
}: StaffingRowProps) {
  const deltaSign =
    row.staffingDelta > 0 ? `+${row.staffingDelta}` : String(row.staffingDelta)

  async function handleBlur(weekStartDate: string, rawValue: string) {
    const hours = rawValue === '' ? 0 : parseFloat(rawValue)
    if (isNaN(hours) || hours < 0) return

    // Build new weeklyHours to recompute staffed total
    const newWeeklyHours = { ...row.weeklyHours, [weekStartDate]: hours }
    const newStaffedHours = Object.values(newWeeklyHours).reduce((sum, h) => sum + h, 0)
    const calc = calculateStaffingDelta(row.plannedHours, newStaffedHours)

    // Optimistic update via callback
    onWeekHoursChange(
      row.teamMemberId,
      weekStartDate,
      hours,
      newStaffedHours,
      calc.delta,
      calc.status
    )

    // Persist to API
    try {
      const isoDate = weekStartDate + 'T00:00:00.000Z'
      await fetch(`/api/estimates/${estimateId}/staffing-weeks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeks: [{ teamMemberId: row.teamMemberId, weekStartDate: isoDate, hours }],
        }),
      })
    } catch (err) {
      console.error('Error saving staffing week', err)
    }
  }

  return (
    <tr>
      {/* Fixed columns */}
      <td style={{ ...fixedCellStyle, textAlign: 'center', width: '40px' }}>
        {rowNumber}
      </td>
      <td style={{ ...fixedCellStyle, textAlign: 'left', minWidth: '160px' }}>
        {row.title}
      </td>
      <td style={{ ...fixedCellStyle, textAlign: 'center', width: '70px' }}>
        {row.abbreviation}
      </td>
      <td style={{ ...fixedCellStyle, width: '72px' }}>{row.plannedHours.toFixed(1)}</td>
      <td style={{ ...fixedCellStyle, width: '72px' }}>{row.staffedHours.toFixed(1)}</td>
      <td style={{ ...fixedCellStyle, width: '72px' }}>{deltaSign}</td>
      <td
        style={{
          ...fixedCellStyle,
          width: '52px',
          textAlign: 'center',
          borderRight: '2px solid var(--cc-gray-light)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: statusColors[row.deltaStatus],
          }}
          title={`Status: ${row.deltaStatus}`}
        />
      </td>

      {/* Dynamic week columns */}
      {weekColumns.map((wk) => {
        const currentHours = row.weeklyHours[wk] ?? 0
        return (
          <td
            key={wk}
            style={{ ...cellStyle, width: '72px', padding: '4px 6px' }}
          >
            <input
              type="number"
              min="0"
              step="0.5"
              defaultValue={currentHours === 0 ? '' : String(currentHours)}
              placeholder=""
              title={`${row.abbreviation} — week of ${formatWeekTooltip(wk)}`}
              onBlur={(e) => handleBlur(wk, e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                textAlign: 'right',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--cc-black)',
                outline: 'none',
                padding: '2px 0',
              }}
            />
          </td>
        )
      })}
    </tr>
  )
}

interface StaffingTotalRowProps {
  rows: StaffingMemberRow[]
  weekColumns: string[]
}

export function StaffingTotalRow({ rows, weekColumns }: StaffingTotalRowProps) {
  const totalPlanned = rows.reduce((sum, r) => sum + r.plannedHours, 0)
  const totalStaffed = rows.reduce((sum, r) => sum + r.staffedHours, 0)
  const totalDelta = rows.reduce((sum, r) => sum + r.staffingDelta, 0)
  const deltaSign = totalDelta > 0 ? `+${totalDelta.toFixed(1)}` : totalDelta.toFixed(1)

  const totalCellStyle: React.CSSProperties = {
    padding: '10px',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--cc-black)',
    borderRight: '1px solid var(--cc-gray-light)',
    borderTop: '2px solid var(--cc-gray-light)',
    textAlign: 'right',
    backgroundColor: 'var(--cc-parchment)',
    whiteSpace: 'nowrap',
  }

  return (
    <tr>
      <td
        colSpan={3}
        style={{
          ...totalCellStyle,
          textAlign: 'left',
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--cc-gray-mid)',
        }}
      >
        Total
      </td>
      <td style={{ ...totalCellStyle }}>{totalPlanned.toFixed(1)}</td>
      <td style={{ ...totalCellStyle }}>{totalStaffed.toFixed(1)}</td>
      <td style={{ ...totalCellStyle }}>{deltaSign}</td>
      <td
        style={{
          ...totalCellStyle,
          borderRight: '2px solid var(--cc-gray-light)',
        }}
      />
      {weekColumns.map((wk) => {
        const colTotal = rows.reduce((sum, r) => sum + (r.weeklyHours[wk] ?? 0), 0)
        return (
          <td key={wk} style={{ ...totalCellStyle, width: '72px' }}>
            {colTotal > 0 ? colTotal.toFixed(1) : ''}
          </td>
        )
      })}
    </tr>
  )
}

// Re-export formatWeekHeader for use in parent
export { formatWeekHeader }
