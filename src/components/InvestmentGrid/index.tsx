'use client'

import { useState, useCallback } from 'react'
import type { InvestmentMemberRow, InvestmentGridProps } from './types'
import { InvestmentRow } from './InvestmentRow'
import { exportInvestmentToCsv } from './csvExport'

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const COLUMNS = [
  { label: '#', align: 'center' as const, width: '40px' },
  { label: 'Title', align: 'left' as const },
  { label: 'Abbrev', align: 'left' as const },
  { label: 'Hours', align: 'right' as const },
  { label: 'Rack Rate', align: 'right' as const },
  { label: 'Rack Fees', align: 'right' as const },
  { label: 'Adj. Client Rate', align: 'left' as const },
  { label: 'Effective Rate', align: 'right' as const },
  { label: 'Client Investment', align: 'right' as const },
]

function recomputeRow(row: InvestmentMemberRow, adjustedClientRate: number | null): InvestmentMemberRow {
  const effectiveRate = adjustedClientRate ?? row.rackRate
  return {
    ...row,
    adjustedClientRate,
    effectiveRate,
    rackFees: row.plannedHours * row.rackRate,
    clientInvestment: row.plannedHours * effectiveRate,
  }
}

export function InvestmentGrid({
  estimateId,
  initialRows,
  riskPremiumPct: initialRiskPremiumPct,
  totalRackFeesTM: initialTotalRackFeesTM,
  totalClientInvestmentTM: initialTotalClientInvestmentTM,
  totalRackFeesFixed: initialTotalRackFeesFixed,
  totalClientInvestmentFixed: initialTotalClientInvestmentFixed,
}: InvestmentGridProps) {
  const [rows, setRows] = useState<InvestmentMemberRow[]>(initialRows)
  const [riskPremiumPct, setRiskPremiumPct] = useState<number>(initialRiskPremiumPct)
  const [riskPremiumInput, setRiskPremiumInput] = useState<string>(
    String(Math.round(initialRiskPremiumPct * 100))
  )

  // Derive totals from current rows and riskPremiumPct
  const totalHoursTM = rows.reduce((s, r) => s + r.plannedHours, 0)
  const totalRackFeesTM = rows.reduce((s, r) => s + r.rackFees, 0)
  const totalClientInvestmentTM = rows.reduce((s, r) => s + r.clientInvestment, 0)
  const multiplier = 1 + riskPremiumPct
  const totalRackFeesFixed = totalRackFeesTM * multiplier
  const totalClientInvestmentFixed = totalClientInvestmentTM * multiplier

  // Suppress unused-prop lint warning for the initial prop-derived totals
  void initialTotalRackFeesTM
  void initialTotalClientInvestmentTM
  void initialTotalRackFeesFixed
  void initialTotalClientInvestmentFixed

  const handleRateChange = useCallback((teamMemberId: string, adjustedClientRate: number | null) => {
    setRows((prev) =>
      prev.map((r) => (r.teamMemberId === teamMemberId ? recomputeRow(r, adjustedClientRate) : r))
    )
  }, [])

  async function handleRiskPremiumBlur() {
    const parsed = parseFloat(riskPremiumInput)
    if (isNaN(parsed)) return
    const clamped = Math.max(0, Math.min(100, parsed))
    const pct = clamped / 100
    setRiskPremiumPct(pct)
    setRiskPremiumInput(String(clamped))

    try {
      await fetch(`/api/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskPremiumPct: pct }),
      })
    } catch {
      // fire and forget
    }
  }

  const handleExport = useCallback(() => {
    exportInvestmentToCsv(
      rows,
      estimateId,
      totalHoursTM,
      totalRackFeesTM,
      totalClientInvestmentTM,
      totalRackFeesFixed,
      totalClientInvestmentFixed
    )
  }, [
    rows,
    estimateId,
    totalHoursTM,
    totalRackFeesTM,
    totalClientInvestmentTM,
    totalRackFeesFixed,
    totalClientInvestmentFixed,
  ])

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--cc-gray-mid)',
    borderRight: '1px solid var(--cc-gray-light)',
    whiteSpace: 'nowrap',
  }

  const totalRowStyle: React.CSSProperties = {
    backgroundColor: 'var(--cc-off-white)',
    borderTop: '2px solid var(--cc-gray-light)',
  }

  const totalCellStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--cc-black)',
    borderRight: '1px solid var(--cc-gray-light)',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '16px',
        }}
      >
        {/* Risk Premium */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            htmlFor="risk-premium-input"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--cc-gray-mid)',
            }}
          >
            Risk Premium
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              id="risk-premium-input"
              type="number"
              step={1}
              min={0}
              max={100}
              value={riskPremiumInput}
              onChange={(e) => setRiskPremiumInput(e.target.value)}
              onBlur={handleRiskPremiumBlur}
              style={{
                width: '64px',
                padding: '6px 8px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--cc-black)',
                border: '1px solid var(--cc-gray-light)',
                background: '#ffffff',
                outline: 'none',
                borderRadius: 0,
                textAlign: 'right',
              }}
            />
            <span
              style={{
                padding: '6px 8px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--cc-gray-mid)',
                border: '1px solid var(--cc-gray-light)',
                borderLeft: 'none',
                background: 'var(--cc-off-white)',
              }}
            >
              %
            </span>
          </div>
        </div>

        {/* Export CSV */}
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
                  key={`${col.label}-${i}`}
                  style={{
                    ...thStyle,
                    textAlign: col.align,
                    width: col.width,
                    borderRight: i < COLUMNS.length - 1 ? '1px solid var(--cc-gray-light)' : 'none',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <InvestmentRow
                key={row.teamMemberId}
                row={row}
                rowNumber={index + 1}
                estimateId={estimateId}
                onRateChange={handleRateChange}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'var(--cc-gray-mid)',
                  }}
                >
                  No team members added. Go to the Team tab to add members.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {/* Separator */}
            <tr style={{ height: '8px', backgroundColor: 'var(--cc-parchment)' }}>
              <td colSpan={COLUMNS.length} />
            </tr>

            {/* T&M Total */}
            <tr style={totalRowStyle}>
              <td style={{ ...totalCellStyle, textAlign: 'center' }} />
              <td
                colSpan={2}
                style={{
                  ...totalCellStyle,
                  fontSize: '15px',
                  letterSpacing: '0.02em',
                }}
              >
                Total (T&amp;M)
              </td>
              <td style={{ ...totalCellStyle, textAlign: 'right' }}>{totalHoursTM.toFixed(1)}</td>
              <td style={{ ...totalCellStyle }} />
              <td style={{ ...totalCellStyle, textAlign: 'right' }}>
                {currencyFmt.format(totalRackFeesTM)}
              </td>
              <td style={{ ...totalCellStyle }} />
              <td style={{ ...totalCellStyle }} />
              <td style={{ ...totalCellStyle, textAlign: 'right', borderRight: 'none', fontSize: '15px' }}>
                {currencyFmt.format(totalClientInvestmentTM)}
              </td>
            </tr>

            {/* Fixed Fee Total */}
            <tr style={{ ...totalRowStyle, borderTop: '1px solid var(--cc-gray-light)' }}>
              <td style={{ ...totalCellStyle, textAlign: 'center' }} />
              <td
                colSpan={2}
                style={{
                  ...totalCellStyle,
                  fontSize: '15px',
                  letterSpacing: '0.02em',
                }}
              >
                Total (Fixed Fee)
              </td>
              <td style={{ ...totalCellStyle }} />
              <td style={{ ...totalCellStyle }} />
              <td style={{ ...totalCellStyle, textAlign: 'right' }}>
                {currencyFmt.format(totalRackFeesFixed)}
              </td>
              <td style={{ ...totalCellStyle }} />
              <td style={{ ...totalCellStyle }} />
              <td style={{ ...totalCellStyle, textAlign: 'right', borderRight: 'none', fontSize: '15px' }}>
                {currencyFmt.format(totalClientInvestmentFixed)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
