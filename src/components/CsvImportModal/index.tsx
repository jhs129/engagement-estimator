'use client'

import { useState, useRef, useCallback } from 'react'
import { parseCsv } from '@/lib/csv/import'

export interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rows: Array<Record<string, string>>, mode: 'merge' | 'replace') => Promise<void>
  tabLabel: string
  expectedColumns: string[]
  teamMemberAbbreviations?: string[]
  getValidationErrors?: (rows: Array<Record<string, string>>) => string[]
}

type ImportMode = 'merge' | 'replace'

export function CsvImportModal({
  isOpen,
  onClose,
  onImport,
  tabLabel,
  expectedColumns,
  getValidationErrors,
}: CsvImportModalProps) {
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [mode, setMode] = useState<ImportMode>('merge')
  const [fileName, setFileName] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setParsedRows([])
    setValidationErrors([])
    setFileName('')
    setMode('merge')
    setIsSubmitting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) {
        setParsedRows([])
        setValidationErrors([])
        setFileName('')
        return
      }

      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result
        if (typeof text !== 'string') return
        const rows = parseCsv(text)
        setParsedRows(rows)

        const errors = getValidationErrors ? getValidationErrors(rows) : []
        setValidationErrors(errors)
      }
      reader.readAsText(file)
    },
    [getValidationErrors]
  )

  const handleConfirm = useCallback(async () => {
    if (parsedRows.length === 0 || validationErrors.length > 0) return
    setIsSubmitting(true)
    try {
      await onImport(parsedRows, mode)
      reset()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }, [parsedRows, validationErrors, mode, onImport, reset, onClose])

  if (!isOpen) return null

  const previewRows = parsedRows.slice(0, 5)
  const previewHeaders = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : []
  const canConfirm = parsedRows.length > 0 && validationErrors.length === 0 && !isSubmitting

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={handleClose}
    >
      {/* Modal panel */}
      <div
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--cc-gray-light)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--cc-gray-light)',
            backgroundColor: 'var(--cc-parchment)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--cc-black)',
            }}
          >
            Import CSV — {tabLabel}
          </span>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: 'var(--cc-gray-mid)',
              lineHeight: 1,
              padding: '2px 6px',
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Expected columns hint */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--cc-gray-mid)',
              marginBottom: '16px',
            }}
          >
            Expected columns:{' '}
            <span style={{ color: 'var(--cc-black)', fontWeight: 600 }}>
              {expectedColumns.join(', ')}
            </span>
          </p>

          {/* File picker */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--cc-gray-mid)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Select CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--cc-black)',
                cursor: 'pointer',
              }}
            />
            {fileName && (
              <span
                style={{
                  marginLeft: '12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: 'var(--cc-gray-mid)',
                }}
              >
                {fileName} — {parsedRows.length} data row{parsedRows.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--cc-gray-mid)',
                  marginBottom: '8px',
                }}
              >
                Preview (first {previewRows.length} row{previewRows.length !== 1 ? 's' : ''})
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    borderCollapse: 'collapse',
                    border: '1px solid var(--cc-gray-light)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    width: '100%',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: 'var(--cc-parchment)' }}>
                      {previewHeaders.map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '6px 10px',
                            textAlign: 'left',
                            borderRight: '1px solid var(--cc-gray-light)',
                            borderBottom: '1px solid var(--cc-gray-light)',
                            fontFamily: 'var(--font-display)',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--cc-gray-mid)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr
                        key={i}
                        style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'var(--cc-parchment)' }}
                      >
                        {previewHeaders.map((h) => (
                          <td
                            key={h}
                            style={{
                              padding: '5px 10px',
                              borderRight: '1px solid var(--cc-gray-light)',
                              borderBottom: '1px solid var(--cc-gray-light)',
                              color: 'var(--cc-black)',
                              maxWidth: '160px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={row[h]}
                          >
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                backgroundColor: '#fff5f5',
                border: '1px solid #fca5a5',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#dc2626',
                  marginBottom: '8px',
                }}
              >
                Validation Errors
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: '#dc2626',
                }}
              >
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Import mode */}
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--cc-gray-mid)',
                marginBottom: '10px',
              }}
            >
              Import Mode
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--cc-black)',
                }}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={mode === 'merge'}
                  onChange={() => setMode('merge')}
                />
                Merge (add to existing)
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--cc-black)',
                }}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                />
                Replace (delete all existing first)
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '8px 20px',
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
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              style={{
                padding: '8px 20px',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                backgroundColor: canConfirm ? 'var(--cc-burnt-sienna)' : 'var(--cc-gray-light)',
                color: canConfirm ? '#ffffff' : 'var(--cc-gray-mid)',
                border: 'none',
                cursor: canConfirm ? 'pointer' : 'not-allowed',
              }}
            >
              {isSubmitting ? 'Importing…' : 'Confirm Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
