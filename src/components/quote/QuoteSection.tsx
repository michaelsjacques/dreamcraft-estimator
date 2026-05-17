import React, { useState, type CSSProperties, type ChangeEvent } from 'react'
import { Btn } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { SECTION_TYPES } from '../../constants'
import { genId } from '../../utils/id'
import { fmt } from '../../utils/format'
import { callClaude } from '../../services/claude'
import { extractJSON } from '../../utils/json'
import { InventoryPicker } from './InventoryPicker'
import type { QuoteSection as QuoteSectionType, LineItem } from '../../types'

const DARK_HDR = '#1e293b'
const BLUE_BG = '#e8f4fe'

interface QuoteSectionProps {
  section: QuoteSectionType
  index: number
  total: number
  onChange: (updated: QuoteSectionType) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function QuoteSection({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QuoteSectionProps) {
  const [estimating, setEstimating] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [showInventory, setShowInventory] = useState(false)

  function updateSection(patch: Partial<QuoteSectionType>) {
    onChange({ ...section, ...patch })
  }

  function addLineItem() {
    const item: LineItem = {
      id: genId(),
      description: '',
      qty: 1,
      unitPrice: 0,
      category: section.type,
      taxable: false,
    }
    updateSection({ lineItems: [...(section.lineItems || []), item] })
  }

  function updateLineItem(id: string, patch: Partial<LineItem>) {
    updateSection({
      lineItems: (section.lineItems || []).map((li) =>
        li.id === id ? { ...li, ...patch } : li
      ),
    })
  }

  function removeLineItem(id: string) {
    updateSection({
      lineItems: (section.lineItems || []).filter((li) => li.id !== id),
    })
  }

  function sectionTotal(): number {
    return (section.lineItems || []).reduce(
      (sum, li) => sum + (li.qty || 0) * (li.unitPrice || 0),
      0
    )
  }

  async function estimatePrices() {
    setEstimating(true)
    setAiResult(null)
    try {
      const system = `You are an expert trade show exhibit estimator. Given a section type and line items, suggest realistic pricing for trade show production. Return ONLY a JSON object with a "items" array where each item has "description" and "unitPrice" (number). Be specific and realistic.`
      const items = (section.lineItems || [])
        .map((li) => li.description)
        .filter(Boolean)
        .join(', ')
      const userMsg = `Section type: ${section.type}\nSection title: ${section.title}\nItems to price: ${items || 'general ' + section.type + ' work'}\n\nProvide pricing for these items.`
      const resp = await callClaude(system, userMsg, 1000)
      const parsed = extractJSON(resp) as { items: Array<{ description: string; unitPrice: number }> }
      if (parsed.items && Array.isArray(parsed.items)) {
        // Apply suggested prices to matching line items
        const updated = (section.lineItems || []).map((li) => {
          const match = parsed.items.find(
            (ai) =>
              ai.description.toLowerCase().includes(li.description.toLowerCase()) ||
              li.description.toLowerCase().includes(ai.description.toLowerCase())
          )
          return match ? { ...li, unitPrice: match.unitPrice } : li
        })
        updateSection({ lineItems: updated })
        setAiResult('Prices updated based on AI estimates.')
      } else {
        setAiResult(resp)
      }
    } catch (err) {
      setAiResult('Could not get AI estimates: ' + String(err))
    } finally {
      setEstimating(false)
    }
  }

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const readers = Array.from(files).map(
      (f) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(f)
        })
    )
    Promise.all(readers).then((dataUrls) => {
      updateSection({ photos: [...(section.photos || []), ...dataUrls] })
    })
  }

  function removePhoto(idx: number) {
    updateSection({
      photos: (section.photos || []).filter((_, i) => i !== idx),
    })
  }

  const wrapStyle: CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  }

  const hdrStyle: CSSProperties = {
    background: DARK_HDR,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const colHdr: CSSProperties = {
    display: 'flex',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    padding: '6px 14px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  }

  const lineRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    padding: '0 14px',
    minHeight: 40,
  }

  const bluePanel: CSSProperties = {
    background: BLUE_BG,
    width: 300,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px',
  }

  const actionRow: CSSProperties = {
    padding: '8px 14px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  }

  const totBar: CSSProperties = {
    background: BLUE_BG,
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#1e40af',
  }

  return (
    <div style={wrapStyle}>
      {/* Dark header */}
      <div style={hdrStyle}>
        <span style={{ color: 'rgba(255,255,255,0.3)', cursor: 'grab', fontSize: 18 }}>⠿</span>
        <Input
          value={section.title}
          onChange={(e) => updateSection({ title: e.target.value })}
          placeholder="Section title"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            padding: '2px 4px',
          }}
        />
        <select
          value={section.type}
          onChange={(e) => updateSection({ type: e.target.value })}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 5,
            color: '#fff',
            fontSize: 12,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          {SECTION_TYPES.map((t) => (
            <option key={t} value={t} style={{ background: '#1e293b' }}>
              {t}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,100,100,0.8)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div style={colHdr}>
        <span style={{ flex: 1 }}>Description</span>
        <div style={{ width: 300, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <span style={{ width: 60, textAlign: 'center' }}>Qty</span>
          <span style={{ width: 90, textAlign: 'right' }}>Unit $</span>
          <span style={{ width: 90, textAlign: 'right' }}>Total</span>
          <span style={{ width: 24 }} />
        </div>
      </div>

      {/* Line items */}
      {(section.lineItems || []).map((li, i) => (
        <div key={li.id} style={lineRow}>
          {/* Number */}
          <span style={{ color: '#94a3b8', fontSize: 11, width: 20, flexShrink: 0 }}>
            {i + 1}.
          </span>
          {/* Description */}
          <Input
            value={li.description}
            onChange={(e) => updateLineItem(li.id, { description: e.target.value })}
            placeholder="Item description"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: '#0f172a',
              fontSize: 13,
              padding: '0 6px',
            }}
          />
          {/* Blue panel: qty / price / total */}
          <div style={bluePanel}>
            <Input
              type="number"
              min={0}
              value={li.qty}
              onChange={(e) => updateLineItem(li.id, { qty: parseFloat(e.target.value) || 0 })}
              style={{
                width: 60,
                background: 'transparent',
                border: 'none',
                color: '#1e40af',
                textAlign: 'center',
                fontWeight: 600,
              }}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              value={li.unitPrice}
              onChange={(e) => updateLineItem(li.id, { unitPrice: parseFloat(e.target.value) || 0 })}
              style={{
                width: 90,
                background: 'transparent',
                border: 'none',
                color: '#1e40af',
                textAlign: 'right',
                fontWeight: 600,
              }}
            />
            <span style={{ width: 90, textAlign: 'right', color: '#1e40af', fontWeight: 700, fontSize: 13 }}>
              {fmt(li.qty * li.unitPrice)}
            </span>
            <button
              onClick={() => removeLineItem(li.id)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}
            >
              ✕
            </button>
          </div>
          {/* Taxable checkbox */}
          <label style={{ marginLeft: 8, fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={li.taxable}
              onChange={(e) => updateLineItem(li.id, { taxable: e.target.checked })}
            />
            Tax
          </label>
        </div>
      ))}

      {/* Action row */}
      <div style={actionRow}>
        <Btn onClick={addLineItem}>+ Add Line Item</Btn>
        <Btn onClick={estimatePrices} disabled={estimating} style={{ color: '#7c3aed' }}>
          {estimating ? '…' : '✨ Estimate Prices'}
        </Btn>
        {section.type === 'Rental' && (
          <Btn onClick={() => setShowInventory(true)}>📦 Browse Inventory</Btn>
        )}
      </div>

      {/* AI result */}
      {aiResult && (
        <div style={{ padding: '8px 14px', background: '#faf5ff', borderTop: '1px solid #e9d5ff', fontSize: 12, color: '#6b21a8' }}>
          {aiResult}
        </div>
      )}

      {/* Notes */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9' }}>
        <Label>Section Notes</Label>
        <textarea
          value={section.notes || ''}
          onChange={(e) => updateSection({ notes: e.target.value })}
          placeholder="Notes for this section..."
          rows={2}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            fontFamily: 'inherit',
            resize: 'vertical',
            color: '#475569',
            background: '#f8fafc',
          }}
        />
      </div>

      {/* Photo upload */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9' }}>
        <Label>Photos</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {(section.photos || []).map((src, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <img
                src={src}
                alt={`Section photo ${idx + 1}`}
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
              />
              <button
                onClick={() => removePhoto(idx)}
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, lineHeight: '18px', textAlign: 'center' }}
              >
                ✕
              </button>
            </div>
          ))}
          <label style={{ width: 64, height: 64, border: '2px dashed #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', fontSize: 22 }}>
            +
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Section total */}
      <div style={totBar}>
        <span>Section Total</span>
        <span style={{ minWidth: 80, textAlign: 'right' }}>{fmt(sectionTotal())}</span>
      </div>

      {/* Inventory picker modal */}
      {showInventory && (
        <InventoryPicker
          onClose={() => setShowInventory(false)}
          onSelect={(items) => {
            const newItems: LineItem[] = items.map((it) => ({
              id: genId(),
              description: it.description,
              qty: 1,
              unitPrice: it.unitPrice,
              category: 'Rental',
              taxable: false,
            }))
            updateSection({ lineItems: [...(section.lineItems || []), ...newItems] })
          }}
        />
      )}
    </div>
  )
}
