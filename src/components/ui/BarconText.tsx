import React, { type CSSProperties, type ReactNode, type ElementType } from 'react'

interface BCProps {
  children: ReactNode
  as?: ElementType
  size?: number
  weight?: 700 | 800 | 900
  style?: CSSProperties
  className?: string
}

export function BC({
  children,
  as: Tag = 'span',
  size = 24,
  weight = 800,
  style,
  className,
}: BCProps) {
  const base: CSSProperties = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: size,
    fontWeight: weight,
    lineHeight: 1,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    ...style,
  }

  return (
    <Tag style={base} className={className}>
      {children}
    </Tag>
  )
}
