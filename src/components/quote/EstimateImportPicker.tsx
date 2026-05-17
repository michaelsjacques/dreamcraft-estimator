import React, { useState, type CSSProperties } from 'react'
import { Btn } from '../ui/Button'
import { blankQuote } from '../../utils/quote'
import type { Quote } from '../../types'

interface EstimateImportPickerProps {
  onClose: () => void
  onImport: (quote: Quote) => void
}

// Stub data — real estimates would come from localStorage/Supabase
const SAMPLE_ESTIMATES = [
  {
    id: 'est-001',
    title: 'CES 2026 – Acme Corp',
    clientName: 'Acme Corp',
    projectName: 'CES 2026 Booth',
    tiers: [
      { label: 'Standard', budget: 45000 },
      { label: 'Enhanced', budget: 62000 },
      { label: 'Premium', budget: 88000 },
    ],
  },
  {
    id: 'est-002',
    title: 'NAB 2026 – Globex',
    clientName: 'Globex',
    projectName: 'NAB 2026 Exhibit',
    tiers: [
      { label: 'Standard', budget: 28000 },
      { label: 'Premium', budget: 52000 },
    ],
  },
]

export function EstimateImportPicker({ onClose, onImport }: EstimateImportPickerProps) {
  const [selected, setSelected] = useState(SAMPLE_ESTIMATES[0])
  const [selectedTier, setSelectedTier] = useState(0)

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }

  const modal: CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    width: 680,
    height: 460,
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }

  const leftPanel: CSSProperties = {
    width: 240,
    borderRight: '1px solid #e2e8f0',
    overflow: 'auto',
    padding: '12px 0',
    flexShrink: 0,
  }

  const rightPanel: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 24,
    gap: 16,
  }

  const estimateRow = (active: boolean): CSSProperties => ({
    padding: '10px 16px',
    cursor: 'pointer',
    background: active ? '#eff6ff' : 'transparent',
    borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
    fontSize: 13,
    color: '#0f172a',
    borderBottom: '1px solid #f1f5f9',
  })

  function handleImport() {
    const tier = selected.tiers[selectedTier]
    const q = blankQuote({
      id: selected.id,
      title: selected.title,
      clientName: selected.clientName,
      projectName: selected.projectName,
    })
    // Pre-fill a Misc section with tier budget
    q.sections = [
      {
        id: 'sec-import',
        title: tier.label + ' Package',
        type: 'Misc',
        notes: `Imported from estimate: ${selected.title}`,
        photos: [],
        lineItems: [
          {
            id: 'li-import',
            description: tier.label + ' exhibit package',
            qty: 1,
            unitPrice: tier.budget,
            category: 'Misc',
            taxable: false,
          },
        ],
      },
    ]
    onImport(q)
    onClose()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Left: estimate list */}
        <div style={leftPanel}>
          <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Estimates
          </div>
          {SAMPLE_ESTIMATES.map((est) => (
            <div
              key={est.id}
              style={estimateRow(selected.id === est.id)}
              onClick={() => {
                setSelected(est)
                setSelectedTier(0)
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{est.title}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{est.clientName}</div>
            </div>
          ))}
        </div>

        {/* Right: tier selection + preview */}
        <div style={rightPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{selected.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selected.projectName}</div>
            </div>
            <Btn onClick={onClose}>✕</Btn>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Select Tier
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {selected.tiers.map((tier, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTier(i)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: selectedTier === i ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                    background: selectedTier === i ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: 130,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{tier.label}</div>
                  <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 2 }}>
                    ${tier.budget.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#475569' }}>
            <strong style={{ color: '#0f172a' }}>Preview:</strong> Will create a new quote &ldquo;{selected.title}&rdquo; with a{' '}
            {selected.tiers[selectedTier]?.label} package at{' '}
            <strong>${selected.tiers[selectedTier]?.budget.toLocaleString()}</strong>.
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn primary onClick={handleImport}>
              ↓ Import as Quote
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
