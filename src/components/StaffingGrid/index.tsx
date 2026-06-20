'use client'

import { useState, useCallback } from 'react'
import type { StaffingMemberRow, StaffingGridProps } from './types'
import { StaffingRow, StaffingTotalRow, formatWeekHeader } from './StaffingRow'
import { exportStaffingToCsv } from './csvExport'
import { getWeekColumns, snapToMonday, FALLBACK_START_DATE, formatWeekTooltip } from './weekUtils'

const headerCellStyle: React.CSSProperties = {
  padding: '10px',
  fontFamily: 'var(--font-display)',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--cc-gray-mid)',
  borderRight: '1px solid var(--cc-gray-light)',
  whiteSpace: 'nowrap',
  backgroundColor: 'var(--cc-parchment)',
}

export function StaffingGrid({
  estimateId,
  initialRows,
  weekColumns: initialWeekColumns,
  estimatedStartDate,
}: StaffingGridProps) {
  const [rows, setRows] = useState<StaffingMemberRow[]>(initialRows)

  // Compute week columns from existing data or use the passed-in columns
  const startDate = estimatedStartDate
    ? snapToMonday(estimatedStartDate)
    : FALLBACK_START_DATE

  const existingWeeks = rows.flatMap((r) => Object.keys(r.weeklyHours))
  const weekColumns =
    initialWeekColumns.length > 0
      ? initialWeekColumns
      : getWeekColumns(startDate, existingWeeks)

  const handleWeekHoursChange = useCallback(
    (
      teamMemberId: string,
      weekStartDate: string,
      hours: number,
      newStaffedHours: number,
      newDelta: number,
      newStatus: 'green' | 'yellow' | 'red'
    ) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.teamMemberId !== teamMemberId) return r
          return {
            ...r,
            weeklyHours: { ...r.weeklyHours, [weekStartDate]: hours },
            staffedHours: newStaffedHours,
            staffingDelta: newDelta,
            deltaStatus: newStatus,
          }
        })
      )
    },
    []
  )

  const handleExport = useCallback(() => {
    exportStaffingToCsv(rows, weekColumns, estimateId)
  }, [rows, weekColumns, estimateId])

  if (rows.length === 0) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <p
          style={{
            color: 'var(--cc-gray-mid)',
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
          }}
        >
          No team members found. Add team members on the Team tab first.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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

      {/* Horizontally scrollable table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'collapse',
            border: '1px solid var(--cc-gray-light)',
            backgroundColor: '#ffffff',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--cc-gray-light)' }}>
              {/* Fixed columns */}
              <th style={{ ...headerCellStyle, width: '40px', textAlign: 'center' }}>#</th>
              <th style={{ ...headerCellStyle, minWidth: '160px', textAlign: 'left' }}>Title</th>
              <th style={{ ...headerCellStyle, width: '70px', textAlign: 'center' }}>Abbrev</th>
              <th style={{ ...headerCellStyle, width: '72px', textAlign: 'right' }}>Planned</th>
              <th style={{ ...headerCellStyle, width: '72px', textAlign: 'right' }}>Staffed</th>
              <th style={{ ...headerCellStyle, width: '72px', textAlign: 'right' }}>Delta</th>
              <th
                style={{
                  ...headerCellStyle,
                  width: '52px',
                  textAlign: 'center',
                  borderRight: '2px solid var(--cc-gray-light)',
                }}
              >
                Status
              </th>

              {/* Dynamic week columns */}
              {weekColumns.map((wk) => (
                <th
                  key={wk}
                  style={{ ...headerCellStyle, width: '72px', textAlign: 'right' }}
                  title={formatWeekTooltip(wk)}
                >
                  {formatWeekHeader(wk)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <StaffingRow
                key={row.teamMemberId}
                row={row}
                rowNumber={idx + 1}
                weekColumns={weekColumns}
                estimateId={estimateId}
                onWeekHoursChange={handleWeekHoursChange}
              />
            ))}
          </tbody>
          <tfoot>
            <StaffingTotalRow rows={rows} weekColumns={weekColumns} />
          </tfoot>
        </table>
      </div>
    </div>
  )
}
