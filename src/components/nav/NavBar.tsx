import React, { useState, type CSSProperties } from 'react'
import { NAV_GROUPS } from '../../constants'
import { useTheme } from '../../hooks/useTheme'
import { BC } from '../ui/BarconText'
import type { NavGroup } from '../../types'

interface NavBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  syncStatus?: 'idle' | 'syncing' | 'error'
}

export function NavBar({ activeTab, onTabChange, syncStatus = 'idle' }: NavBarProps) {
  const { isDark, toggleTheme } = useTheme()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const navStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: 48,
    background: 'var(--navBg)',
    borderBottom: '1px solid var(--navBorder)',
    padding: '0 20px',
    gap: 0,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  }

  const logoStyle: CSSProperties = {
    marginRight: 28,
    cursor: 'pointer',
    flexShrink: 0,
  }

  const navItemsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  }

  const rightStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
    flexShrink: 0,
  }

  const syncDot: CSSProperties = {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background:
      syncStatus === 'syncing'
        ? '#f59e0b'
        : syncStatus === 'error'
        ? '#ef4444'
        : '#22c55e',
  }

  function isGroupActive(group: NavGroup): boolean {
    if (group.subs.length === 0) return activeTab === group.id
    return group.subs.some((s) => s.id === activeTab) || activeTab === group.id
  }

  function handleGroupClick(group: NavGroup) {
    if (group.subs.length === 0) {
      onTabChange(group.id)
      setOpenDropdown(null)
    } else {
      setOpenDropdown(openDropdown === group.id ? null : group.id)
    }
  }

  function handleSubClick(subId: string) {
    onTabChange(subId)
    setOpenDropdown(null)
  }

  const btnBase = (active: boolean): CSSProperties => ({
    position: 'relative',
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text2)',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  })

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    background: 'var(--navBg)',
    border: '1px solid var(--navBorder)',
    borderRadius: 8,
    padding: '4px 0',
    minWidth: 180,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    zIndex: 200,
  }

  const dropItemStyle = (active: boolean): CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text2)',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    transition: 'background 0.1s',
  })

  const iconBtn: CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--text2)',
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px 6px',
    borderRadius: 6,
    lineHeight: 1,
  }

  return (
    <nav style={navStyle} onClick={() => setOpenDropdown(null)}>
      {/* Logo */}
      <div style={logoStyle} onClick={() => onTabChange('estimator')}>
        <BC size={20} weight={900} style={{ color: 'var(--text)', letterSpacing: '0.08em' }}>
          Dream
        </BC>
        <BC size={20} weight={700} style={{ color: 'var(--text2)', letterSpacing: '0.08em', marginLeft: 2 }}>
          Craft
        </BC>
      </div>

      {/* Nav items */}
      <div style={navItemsStyle} onClick={(e) => e.stopPropagation()}>
        {NAV_GROUPS.map((group) => {
          const active = isGroupActive(group)
          const isOpen = openDropdown === group.id
          const hasSubs = group.subs.length > 0

          return (
            <div key={group.id} style={{ position: 'relative' }}>
              <button
                style={btnBase(active)}
                onClick={() => handleGroupClick(group)}
              >
                {group.label}
                {hasSubs && (
                  <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                )}
              </button>

              {hasSubs && isOpen && (
                <div style={dropdownStyle}>
                  {group.subs.map((sub) => (
                    <button
                      key={sub.id}
                      style={dropItemStyle(activeTab === sub.id)}
                      onClick={() => handleSubClick(sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Right controls */}
      <div style={rightStyle}>
        <div style={syncDot} title={`Sync: ${syncStatus}`} />
        <button style={iconBtn} onClick={toggleTheme} title="Toggle theme">
          {isDark ? '☀' : '🌙'}
        </button>
        <button
          style={iconBtn}
          onClick={() => onTabChange('settings')}
          title="Settings"
        >
          ⚙
        </button>
      </div>
    </nav>
  )
}
