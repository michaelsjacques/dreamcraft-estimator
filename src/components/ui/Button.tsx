import React, { type ButtonHTMLAttributes, type CSSProperties } from 'react'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  primary?: boolean
  style?: CSSProperties
}

export function Btn({ primary, children, style, disabled, ...rest }: BtnProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 6,
    border: primary ? 'none' : '1px solid var(--border)',
    background: primary ? 'var(--accent, #3b82f6)' : 'transparent',
    color: primary ? '#fff' : 'var(--text)',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s, background 0.15s',
    whiteSpace: 'nowrap',
    ...style,
  }

  return (
    <button style={base} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
