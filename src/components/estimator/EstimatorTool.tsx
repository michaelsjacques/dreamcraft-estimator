import React, { type CSSProperties } from 'react'
import { BC } from '../ui/BarconText'

export function EstimatorTool() {
  const wrap: CSSProperties = {
    padding: '60px 40px',
    textAlign: 'center',
    color: 'var(--text)',
  }

  const note: CSSProperties = {
    marginTop: 16,
    fontSize: 14,
    color: 'var(--text2)',
    maxWidth: 440,
    margin: '16px auto 0',
    lineHeight: 1.6,
  }

  return (
    <div style={wrap}>
      <BC size={36} weight={900} style={{ color: 'var(--text)', display: 'block', marginBottom: 8 }}>
        AI ESTIMATOR
      </BC>
      <p style={note}>
        Full estimator migrating to this codebase. Use the legacy{' '}
        <a href="/hub.html" style={{ color: 'var(--text)', textDecoration: 'underline' }}>
          hub.html
        </a>{' '}
        in the meantime.
      </p>
    </div>
  )
}
