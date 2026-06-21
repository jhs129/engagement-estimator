'use client'

import type React from 'react'

// ─── Style constants ─────────────────────────────────────────────────────────

export const GRID_INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--cc-black)',
  padding: '0',
}

export const GRID_NUM_INPUT_STYLE: React.CSSProperties = {
  ...GRID_INPUT_STYLE,
  textAlign: 'right',
  width: '56px',
}

export const GRID_SELECT_STYLE: React.CSSProperties = {
  ...GRID_INPUT_STYLE,
  cursor: 'pointer',
}

export const GRID_HEADER_CELL_STYLE: React.CSSProperties = {
  padding: '10px 12px',
  fontFamily: 'var(--font-display)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--cc-gray-mid)',
  textAlign: 'left',
  borderRight: '1px solid var(--cc-gray-light)',
  whiteSpace: 'nowrap',
  backgroundColor: 'var(--cc-parchment)',
}

export const GRID_TD_STYLE: React.CSSProperties = {
  borderRight: '1px solid var(--cc-gray-light)',
  padding: '10px 12px',
}

export const GRID_ROW_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderBottom: '1px solid var(--cc-gray-light)',
  transition: 'background-color 0.1s',
}

export const GRID_TOOLBAR_BTN_STYLE: React.CSSProperties = {
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
}

export const GRID_ADD_BTN_STYLE: React.CSSProperties = {
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
}

// ─── Row hover handlers ───────────────────────────────────────────────────────

export function onGridRowMouseEnter(e: React.MouseEvent<HTMLTableRowElement>) {
  ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--cc-off-white)'
}

export function onGridRowMouseLeave(e: React.MouseEvent<HTMLTableRowElement>) {
  ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#ffffff'
}

// ─── Shared components ────────────────────────────────────────────────────────

export function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
      <circle cx="3.5" cy="4" r="1.5" />
      <circle cx="8.5" cy="4" r="1.5" />
      <circle cx="3.5" cy="8" r="1.5" />
      <circle cx="8.5" cy="8" r="1.5" />
      <circle cx="3.5" cy="12" r="1.5" />
      <circle cx="8.5" cy="12" r="1.5" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4h9.334Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface GridDeleteButtonProps {
  onClick: () => void
  label?: string
  title?: string
}

export function GridDeleteButton({ onClick, label = 'Delete row', title = 'Delete row' }: GridDeleteButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={label}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        color: 'var(--cc-gray-mid)',
        lineHeight: 1,
      }}
    >
      <TrashIcon />
    </button>
  )
}

interface GridSaveIndicatorProps {
  saveState: 'idle' | 'saving' | 'error'
}

export function GridSaveIndicator({ saveState }: GridSaveIndicatorProps) {
  if (saveState !== 'error') return null
  return (
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
  )
}

interface GridAddRowButtonProps {
  onClick: () => void
  label?: string
  disabled?: boolean
  disabledLabel?: string
}

export function GridAddRowButton({ onClick, label = '+ Add Row', disabled = false, disabledLabel }: GridAddRowButtonProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...GRID_ADD_BTN_STYLE,
          ...(disabled ? { backgroundColor: 'var(--cc-gray-light)', color: 'var(--cc-gray-mid)', cursor: 'not-allowed' } : {}),
        }}
      >
        {label}
      </button>
      {disabled && disabledLabel && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--cc-gray-mid)' }}>
          {disabledLabel}
        </span>
      )}
    </div>
  )
}
