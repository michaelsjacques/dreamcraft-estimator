import React, { type CSSProperties } from 'react'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import { useLocalStorage } from './hooks/useLocalStorage'
import { NavBar } from './components/nav/NavBar'
import { QuoteTool } from './components/quote/QuoteTool'
import { EstimatorTool } from './components/estimator/EstimatorTool'
import { PlanningTools } from './components/planning/PlanningTools'
import { AppSettings } from './components/settings/AppSettings'
import { BC } from './components/ui/BarconText'
import type { Theme } from './types'

// ---------------------------------------------------------------------------
// GlobalStyle — injects CSS variables into :root whenever theme changes
// ---------------------------------------------------------------------------
function GlobalStyle({ theme }: { theme: Theme }) {
  const vars = Object.entries(theme)
    .map(([k, v]) => `--${k}: ${v};`)
    .join('\n  ')

  return (
    <style>{`
      :root {
        --accent: #3b82f6;
        ${vars}
      }
      body {
        background: var(--bg);
        color: var(--text);
        margin: 0;
        font-family: 'Inter', sans-serif;
      }
      * { box-sizing: border-box; }
      input, textarea, select, button {
        font-family: inherit;
      }
    `}</style>
  )
}

// ---------------------------------------------------------------------------
// Stub views
// ---------------------------------------------------------------------------
function StubView({ label }: { label: string }) {
  const style: CSSProperties = {
    padding: '60px 40px',
    textAlign: 'center',
  }
  return (
    <div style={style}>
      <BC size={32} weight={900} style={{ color: 'var(--text)', display: 'block', marginBottom: 8 }}>
        {label.toUpperCase()}
      </BC>
      <p style={{ color: 'var(--text2)', fontSize: 14 }}>Coming soon.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner app (needs ThemeProvider in scope)
// ---------------------------------------------------------------------------
function AppInner() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useLocalStorage<string>('dce_active_tab', 'estimator')

  function renderContent() {
    switch (activeTab) {
      case 'estimator':
        return <EstimatorTool />
      case 'quotes':
        return <QuoteTool />
      case 'planning':
      case 'projects':
      case 'todo':
      case 'milestone':
      case 'milcalendar':
      case 'workorder':
        return <PlanningTools tab={activeTab} />
      case 'shophours':
        return <StubView label="Shop Hours" />
      case 'chat':
        return <StubView label="Chat" />
      case 'contacts':
        return <StubView label="Contacts" />
      case 'documents':
        return <StubView label="Documents" />
      case 'brandkit':
        return <StubView label="Brand Kit" />
      case 'dreamteam':
        return <StubView label="Dream Team" />
      case 'settings':
        return <AppSettings onTabChange={setActiveTab} />
      case 'portal':
        return <StubView label="Client Portal" />
      case 'crm':
        return <StubView label="CRM" />
      case 'rfps':
        return <StubView label="RFPs" />
      case 'inventory':
        return <StubView label="Inventory" />
      case 'quickquote':
        return <StubView label="Quick Quote" />
      default:
        return <StubView label={activeTab} />
    }
  }

  const layoutStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  }

  const contentStyle: CSSProperties = {
    flex: 1,
  }

  return (
    <>
      <GlobalStyle theme={theme} />
      <div style={layoutStyle}>
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
        <main style={contentStyle}>{renderContent()}</main>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
