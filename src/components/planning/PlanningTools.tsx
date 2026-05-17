import React, { type CSSProperties } from 'react'
import { BC } from '../ui/BarconText'

interface PlanningToolsProps {
  tab?: string
}

const TOOL_LABELS: Record<string, string> = {
  projects: 'Project Overview',
  todo: 'To Do',
  milestone: 'Milestone Creator',
  milcalendar: 'Milestone Calendar',
  workorder: 'Work Order',
}

export function PlanningTools({ tab = 'projects' }: PlanningToolsProps) {
  const wrap: CSSProperties = {
    padding: '60px 40px',
    textAlign: 'center',
    color: 'var(--text)',
  }

  const note: CSSProperties = {
    marginTop: 16,
    fontSize: 14,
    color: 'var(--text2)',
    lineHeight: 1.6,
  }

  const label = TOOL_LABELS[tab] || tab

  return (
    <div style={wrap}>
      <BC size={32} weight={900} style={{ color: 'var(--text)', display: 'block', marginBottom: 8 }}>
        {label.toUpperCase()}
      </BC>
      <p style={note}>Coming soon — migrating from legacy hub.</p>
    </div>
  )
}
