import React, { type CSSProperties } from 'react'
import { BC } from '../ui/BarconText'
import { Btn } from '../ui/Button'
import { useTheme } from '../../hooks/useTheme'
import { QUOTE_STORAGE } from '../../constants'

interface AppSettingsProps {
  onTabChange: (tab: string) => void
}

export function AppSettings({ onTabChange }: AppSettingsProps) {
  const { isDark, toggleTheme } = useTheme()

  function getStorageInfo(): string {
    try {
      const raw = localStorage.getItem(QUOTE_STORAGE)
      if (!raw) return '0 quotes stored (0 KB)'
      const count = (JSON.parse(raw) as unknown[]).length
      const kb = (new Blob([raw]).size / 1024).toFixed(1)
      return `${count} quotes · ${kb} KB`
    } catch {
      return 'Unable to read storage'
    }
  }

  function clearStorage() {
    if (!window.confirm('Clear all quote data from local storage? This cannot be undone.')) return
    localStorage.removeItem(QUOTE_STORAGE)
    window.location.reload()
  }

  const wrap: CSSProperties = {
    padding: '40px 32px',
    maxWidth: 640,
    color: 'var(--text)',
    fontFamily: 'Inter, sans-serif',
  }

  const section: CSSProperties = {
    background: 'var(--cardBg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  }

  const sectionTitle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
    marginBottom: 14,
  }

  const row: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  }

  const HIDDEN_PAGES = [
    { id: 'portal', label: 'Client Portal' },
    { id: 'crm', label: 'CRM' },
    { id: 'rfps', label: 'RFPs' },
    { id: 'inventory', label: 'Inventory' },
  ]

  return (
    <div style={wrap}>
      <BC size={28} weight={900} style={{ color: 'var(--text)', display: 'block', marginBottom: 24 }}>
        Settings
      </BC>

      {/* Appearance */}
      <div style={section}>
        <div style={sectionTitle}>Appearance</div>
        <div style={row}>
          <span style={{ fontSize: 14, color: 'var(--text)' }}>Dark Mode</span>
          <Btn onClick={toggleTheme}>
            {isDark ? '☀ Switch to Light' : '🌙 Switch to Dark'}
          </Btn>
        </div>
      </div>

      {/* Storage */}
      <div style={section}>
        <div style={sectionTitle}>Local Storage</div>
        <div style={row}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>{getStorageInfo()}</span>
          <Btn onClick={clearStorage} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
            Clear Data
          </Btn>
        </div>
      </div>

      {/* Hidden pages */}
      <div style={section}>
        <div style={sectionTitle}>Hidden Pages</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {HIDDEN_PAGES.map((p) => (
            <Btn key={p.id} onClick={() => onTabChange(p.id)}>
              {p.label}
            </Btn>
          ))}
        </div>
      </div>

      {/* Legacy app */}
      <div style={section}>
        <div style={sectionTitle}>Legacy App</div>
        <div style={row}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            Original hub.html (full-featured)
          </span>
          <a href="/hub.html" style={{ textDecoration: 'none' }}>
            <Btn>Open hub.html →</Btn>
          </a>
        </div>
      </div>
    </div>
  )
}
