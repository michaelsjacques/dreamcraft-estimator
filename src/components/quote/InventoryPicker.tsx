import React, { type CSSProperties } from 'react'
import { Btn } from '../ui/Button'

interface InventoryPickerProps {
  onClose: () => void
  onSelect: (items: Array<{ description: string; unitPrice: number }>) => void
}

const SAMPLE_INVENTORY = [
  { description: '10x10 Pop-up Canopy', unitPrice: 450 },
  { description: '8ft Folding Table', unitPrice: 85 },
  { description: 'Padded Folding Chair', unitPrice: 18 },
  { description: '6ft Pipe & Drape Section', unitPrice: 65 },
  { description: 'LED Par Can Light', unitPrice: 95 },
  { description: '55" Monitor on Stand', unitPrice: 380 },
  { description: 'Carpet 10x10 (charcoal)', unitPrice: 120 },
  { description: 'Lockable Storage Cabinet', unitPrice: 210 },
  { description: 'Literature Rack', unitPrice: 55 },
  { description: 'Pedestal Display', unitPrice: 90 },
]

export function InventoryPicker({ onClose, onSelect }: InventoryPickerProps) {
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
    width: 520,
    maxHeight: '70vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }

  const header: CSSProperties = {
    padding: '18px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const list: CSSProperties = {
    overflow: 'auto',
    flex: 1,
    padding: '8px 0',
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 13,
    color: '#0f172a',
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
            Browse Inventory
          </span>
          <Btn onClick={onClose}>✕ Close</Btn>
        </div>
        <div style={list}>
          {SAMPLE_INVENTORY.map((item, i) => (
            <div
              key={i}
              style={rowStyle}
              onClick={() => {
                onSelect([item])
                onClose()
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background = '#f8fafc')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
              }
            >
              <span>{item.description}</span>
              <span style={{ color: '#64748b', fontWeight: 500 }}>
                ${item.unitPrice.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
