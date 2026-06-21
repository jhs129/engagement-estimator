'use client'

import { useEffect, useRef } from 'react'

interface TextExpandModalProps {
  title: string
  value: string
  onChange: (v: string) => void
  onClose: () => void
}

export function TextExpandModal({ title, value, onChange, onClose }: TextExpandModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          width: '520px',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--cc-gray-mid)',
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
              color: 'var(--cc-gray-mid)',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: '200px',
            resize: 'vertical',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--cc-black)',
            border: '1px solid var(--cc-gray-light)',
            padding: '10px 12px',
            outline: 'none',
            lineHeight: '1.5',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 20px',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backgroundColor: 'var(--cc-burnt-sienna)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
