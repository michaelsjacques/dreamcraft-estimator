import React, { type InputHTMLAttributes, type CSSProperties } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  style?: CSSProperties
}

export function Input({ style, ...rest }: InputProps) {
  const base: CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 6,
    border: '1px solid var(--inputBorder)',
    background: 'var(--inputBg)',
    color: 'var(--text)',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    ...style,
  }

  return <input style={base} {...rest} />
}
