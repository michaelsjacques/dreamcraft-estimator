import React, { type CSSProperties, type ReactNode } from 'react'

interface LabelProps {
  children: ReactNode
  style?: CSSProperties
}

export function Label({ children, style }: LabelProps) {
  const base: CSSProperties = {
    display: 'block',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
    marginBottom: 4,
    ...style,
  }
  return <span style={base}>{children}</span>
}
