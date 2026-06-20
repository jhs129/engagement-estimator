'use client'

import { useState } from 'react'
import type { InvestmentMemberRow } from './types'

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const cellStyle: React.CSSProperties = {
  padding: '9px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--cc-black)',
  borderRight: '1px solid var(--cc-gray-light)',
  borderBottom: '1px solid var(--cc-gray-light)',
  whiteSpace: 'nowrap',
}

interface InvestmentRowProps {
  row: InvestmentMemberRow
  rowNumber: number
  estimateId: string
  onRateChange: (teamMemberId: string, adjustedClientRate: number | null) => void
}

export function InvestmentRow({ row, rowNumber, estimateId, onRateChange }: InvestmentRowProps) {
  const [inputValue, setInputValue] = useState<string>(
    row.adjustedClientRate !== null ? String(row.adjustedClientRate) : ''
  )

  const effectivePlaceholder = `(${currencyFmt.format(row.effectiveRate)})`

  async function handleBlur() {
    const trimmed = inputValue.trim()
    const parsed = trimmed === '' ? null : Number(trimmed)

    if (parsed !== null && isNaN(parsed)) return

    onRateChange(row.teamMemberId, parsed)

    try {
      await fetch(`/api/estimates/${estimateId}/team/${row.teamMemberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustedClientRate: parsed }),
      })
    } catch {
      // fire and forget — local state already updated
    }
  }

  return (
    <tr>
      <td style={{ ...cellStyle, textAlign: 'center', width: '40px' }}>{rowNumber}</td>
      <td style={cellStyle}>{row.title}</td>
      <td style={cellStyle}>{row.abbreviation}</td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{row.plannedHours.toFixed(1)}</td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{currencyFmt.format(row.rackRate)}</td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{currencyFmt.format(row.rackFees)}</td>
      <td style={{ ...cellStyle, padding: '4px 8px' }}>
        <input
          type="number"
          value={inputValue}
          placeholder={effectivePlaceholder}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          min={0}
          style={{
            width: '100%',
            padding: '5px 8px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--cc-black)',
            border: '1px solid var(--cc-gray-light)',
            background: '#ffffff',
            outline: 'none',
            borderRadius: 0,
          }}
        />
      </td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{currencyFmt.format(row.effectiveRate)}</td>
      <td style={{ ...cellStyle, textAlign: 'right', borderRight: 'none' }}>
        {currencyFmt.format(row.clientInvestment)}
      </td>
    </tr>
  )
}
