import React, { useState, type CSSProperties } from 'react'
import { Btn } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { BC } from '../ui/BarconText'
import { QuoteSection } from './QuoteSection'
import { UnionLaborPanel } from './UnionLaborPanel'
import { ChangeOrderModal } from './ChangeOrderModal'
import { EstimateImportPicker } from './EstimateImportPicker'
import { loadQuotes, saveQuotes, blankQuote, calcTotals } from '../../utils/quote'
import { fmt, fmtDate } from '../../utils/format'
import { genId } from '../../utils/id'
import { NON_UNION_RATE } from '../../constants/rates'
import { UNION_RATES } from '../../constants/rates'
import type { Quote, QuoteSection as QuoteSectionType, ChangeOrder, LineItem } from '../../types'

const BLUE_BG = '#e8f4fe'
const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  sent: '#3b82f6',
  accepted: '#22c55e',
  rejected: '#ef4444',
}

function resolveRates(quote: Quote) {
  if (quote.laborType !== 'union') return NON_UNION_RATE
  const key = (quote.city || '').toLowerCase().trim()
  return UNION_RATES[key] || NON_UNION_RATE
}

export function QuoteTool() {
  const [quotes, setQuotes] = useState<Quote[]>(loadQuotes)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [search, setSearch] = useState('')
  const [showCOModal, setShowCOModal] = useState(false)
  const [showImportPicker, setShowImportPicker] = useState(false)

  // -------------------------------------------------------------------------
  // Persistence helpers
  // -------------------------------------------------------------------------
  function persist(updated: Quote[]) {
    setQuotes(updated)
    saveQuotes(updated)
  }

  function saveEditing(q: Quote) {
    const now = new Date().toISOString()
    const updated = quotes.some((x) => x.id === q.id)
      ? quotes.map((x) => (x.id === q.id ? { ...q, updatedAt: now } : x))
      : [{ ...q, updatedAt: now }, ...quotes]
    persist(updated)
    setEditing({ ...q, updatedAt: now })
  }

  function deleteQuote(id: string) {
    if (!window.confirm('Delete this quote?')) return
    persist(quotes.filter((q) => q.id !== id))
  }

  // -------------------------------------------------------------------------
  // Pipeline stats
  // -------------------------------------------------------------------------
  function pipelineStats() {
    const stats: Record<string, { count: number; value: number }> = {
      draft: { count: 0, value: 0 },
      sent: { count: 0, value: 0 },
      accepted: { count: 0, value: 0 },
    }
    for (const q of quotes) {
      const s = q.status === 'rejected' ? 'draft' : q.status
      if (stats[s]) {
        stats[s].count++
        const totals = calcTotals({ ...q, _rates: resolveRates(q) } as Parameters<typeof calcTotals>[0])
        stats[s].value += (totals.total as number) || 0
      }
    }
    return stats
  }

  const stats = pipelineStats()

  // -------------------------------------------------------------------------
  // Section helpers (in edit view)
  // -------------------------------------------------------------------------
  function addSection() {
    if (!editing) return
    const sec: QuoteSectionType = {
      id: genId(),
      title: 'New Section',
      type: 'Fabrication',
      notes: '',
      photos: [],
      lineItems: [
        { id: genId(), description: '', qty: 1, unitPrice: 0, category: 'Fabrication', taxable: false },
      ] as LineItem[],
    }
    const updated = { ...editing, sections: [...(editing.sections || []), sec] }
    setEditing(updated)
    saveEditing(updated)
  }

  function updateSection(idx: number, sec: QuoteSectionType) {
    if (!editing) return
    const sections = [...editing.sections]
    sections[idx] = sec
    const updated = { ...editing, sections }
    setEditing(updated)
    saveEditing(updated)
  }

  function removeSection(idx: number) {
    if (!editing) return
    const sections = editing.sections.filter((_, i) => i !== idx)
    const updated = { ...editing, sections }
    setEditing(updated)
    saveEditing(updated)
  }

  function moveSection(idx: number, dir: -1 | 1) {
    if (!editing) return
    const sections = [...editing.sections]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= sections.length) return
    ;[sections[idx], sections[swapIdx]] = [sections[swapIdx], sections[idx]]
    const updated = { ...editing, sections }
    setEditing(updated)
    saveEditing(updated)
  }

  function updateEditing(patch: Partial<Quote>) {
    if (!editing) return
    const updated = { ...editing, ...patch }
    setEditing(updated)
    saveEditing(updated)
  }

  function addChangeOrder(co: ChangeOrder) {
    if (!editing) return
    updateEditing({ changeOrders: [...(editing.changeOrders || []), co] })
  }

  function updateChangeOrderStatus(id: string, status: ChangeOrder['status']) {
    if (!editing) return
    updateEditing({
      changeOrders: (editing.changeOrders || []).map((co) =>
        co.id === id ? { ...co, status } : co
      ),
    })
  }

  // -------------------------------------------------------------------------
  // Computed totals for edit view
  // -------------------------------------------------------------------------
  function getTotals() {
    if (!editing) return null
    return calcTotals({ ...editing, _rates: resolveRates(editing) } as Parameters<typeof calcTotals>[0])
  }

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------
  const pageStyle: CSSProperties = {
    background: '#f8fafc',
    minHeight: '100vh',
    padding: '40px 32px',
    fontFamily: 'Inter, sans-serif',
  }

  const listHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  }

  const statCardStyle = (color: string): CSSProperties => ({
    background: '#fff',
    border: `1px solid ${color}33`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 10,
    padding: '14px 20px',
    minWidth: 160,
    flex: '1 1 140px',
  })

  const quoteCardStyle = (status: string): CSSProperties => ({
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderLeft: `4px solid ${STATUS_COLORS[status] || '#94a3b8'}`,
    borderRadius: 10,
    padding: '14px 20px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  })

  const statusBadge = (status: string): CSSProperties => ({
    background: (STATUS_COLORS[status] || '#94a3b8') + '22',
    color: STATUS_COLORS[status] || '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  })

  const actionBarStyle: CSSProperties = {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '10px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    position: 'sticky',
    top: 48,
    zIndex: 50,
    flexWrap: 'wrap',
  }

  const editPageStyle: CSSProperties = {
    background: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
  }

  const whiteCard: CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  }

  // -------------------------------------------------------------------------
  // Filtered quotes
  // -------------------------------------------------------------------------
  const filtered = quotes.filter((q) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      q.title?.toLowerCase().includes(s) ||
      q.clientName?.toLowerCase().includes(s) ||
      q.quoteNumber?.toLowerCase().includes(s) ||
      q.city?.toLowerCase().includes(s)
    )
  })

  // =========================================================================
  // LIST VIEW
  // =========================================================================
  if (!editing) {
    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={listHeaderStyle}>
          <div style={{ flex: 1 }}>
            <BC size={11} weight={700} style={{ color: '#94a3b8', display: 'block', marginBottom: 4 }}>
              DreamCraft Events
            </BC>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Quotes</h2>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotes..."
            style={{ width: 220, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a' }}
          />
          <Btn onClick={() => setShowImportPicker(true)}>↓ From Estimate</Btn>
          <Btn
            primary
            onClick={() => {
              const q = blankQuote()
              persist([q, ...quotes])
              setEditing(q)
            }}
          >
            + New Quote
          </Btn>
        </div>

        {/* Pipeline stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {(['draft', 'sent', 'accepted'] as const).map((status) => (
            <div key={status} style={statCardStyle(STATUS_COLORS[status])}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                {status}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {fmt(stats[status].value)}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {stats[status].count} quote{stats[status].count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Quote rows */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: 14 }}>
            No quotes yet. Create your first quote above.
          </div>
        )}

        {filtered.map((q) => {
          const totals = calcTotals({ ...q, _rates: resolveRates(q) } as Parameters<typeof calcTotals>[0])
          return (
            <div
              key={q.id}
              style={quoteCardStyle(q.status)}
              onClick={() => setEditing(q)}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')
              }
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.title || 'Untitled Quote'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {q.quoteNumber}
                  {q.clientName ? ` · ${q.clientName}` : ''}
                  {q.city ? ` · ${q.city}` : ''}
                  {q.installStart ? ` · ${fmtDate(q.installStart)}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                  {fmt((totals.total as number) || 0)}
                </div>
                <div style={statusBadge(q.status)}>{q.status}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteQuote(q.id)
                }}
                style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 16, padding: '4px 6px', flexShrink: 0 }}
                title="Delete quote"
              >
                🗑
              </button>
            </div>
          )
        })}

        {showImportPicker && (
          <EstimateImportPicker
            onClose={() => setShowImportPicker(false)}
            onImport={(q) => {
              persist([q, ...quotes])
              setEditing(q)
            }}
          />
        )}
      </div>
    )
  }

  // =========================================================================
  // EDIT VIEW
  // =========================================================================
  const totals = getTotals()

  return (
    <div style={editPageStyle}>
      {/* Action bar */}
      <div style={actionBarStyle}>
        <Btn onClick={() => setEditing(null)}>← All Quotes</Btn>

        <select
          value={editing.status}
          onChange={(e) => updateEditing({ status: e.target.value as Quote['status'] })}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#fff',
            fontSize: 13,
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        {editing.status === 'accepted' && (
          <Btn onClick={() => setShowCOModal(true)}>+ Change Order</Btn>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn onClick={() => setShowImportPicker(true)}>↓ Re-import</Btn>
          <Btn>🚀 Handoff</Btn>
          <Btn>↓ Export PDF</Btn>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 960, margin: '0 auto' }}>
        {/* Header card */}
        <div style={whiteCard}>
          <input
            value={editing.title}
            onChange={(e) => updateEditing({ title: e.target.value })}
            placeholder="Quote title..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: 28,
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 16,
              fontFamily: 'Inter, sans-serif',
              background: 'transparent',
            }}
          />

          {/* FROM / FOR / QUOTE # */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <Label>From</Label>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>DreamCraft Events</div>
            </div>
            <div>
              <Label>For</Label>
              <Input
                value={editing.clientName}
                onChange={(e) => updateEditing({ clientName: e.target.value })}
                placeholder="Client name"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
              />
            </div>
            <div>
              <Label>Quote #</Label>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{editing.quoteNumber}</div>
            </div>
          </div>

          {/* Venue / City / Booth */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <Label>Venue</Label>
              <Input
                value={editing.venue}
                onChange={(e) => updateEditing({ venue: e.target.value })}
                placeholder="Convention center"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={editing.city}
                onChange={(e) => updateEditing({ city: e.target.value })}
                placeholder="Las Vegas"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
              />
            </div>
            <div>
              <Label>Booth #</Label>
              <Input
                value={editing.boothNumber}
                onChange={(e) => updateEditing({ boothNumber: e.target.value })}
                placeholder="1234"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
              />
            </div>
          </div>

          {/* Date grid row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            {(
              [
                ['Ship Date', 'shipDate'],
                ['Install Start', 'installStart'],
                ['Install End', 'installEnd'],
                ['Show Start', 'showStart'],
              ] as const
            ).map(([label, key]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type="date"
                  value={(editing[key] as string) || ''}
                  onChange={(e) => updateEditing({ [key]: e.target.value })}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                />
              </div>
            ))}
          </div>

          {/* Date grid row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {(
              [
                ['Show End', 'showEnd'],
                ['Dismantle Start', 'dismantleStart'],
                ['Dismantle End', 'dismantleEnd'],
                ['Project Name', 'projectName'],
              ] as const
            ).map(([label, key]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type={key === 'projectName' ? 'text' : 'date'}
                  value={(editing[key] as string) || ''}
                  onChange={(e) => updateEditing({ [key]: e.target.value })}
                  placeholder={key === 'projectName' ? 'Project name' : undefined}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        {(editing.sections || []).map((sec, idx) => (
          <QuoteSection
            key={sec.id}
            section={sec}
            index={idx}
            total={editing.sections.length}
            onChange={(updated) => updateSection(idx, updated)}
            onRemove={() => removeSection(idx)}
            onMoveUp={() => moveSection(idx, -1)}
            onMoveDown={() => moveSection(idx, 1)}
          />
        ))}

        <Btn onClick={addSection} style={{ marginBottom: 16 }}>+ Add Section</Btn>

        {/* Labor panel */}
        <UnionLaborPanel
          quote={editing}
          onChange={(updated) => {
            setEditing(updated)
            saveEditing(updated)
          }}
        />

        {/* Notes */}
        <div style={whiteCard}>
          <Label>Notes</Label>
          <textarea
            value={editing.notes || ''}
            onChange={(e) => updateEditing({ notes: e.target.value })}
            placeholder="Project notes, terms, special instructions..."
            rows={4}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              resize: 'vertical',
              color: '#475569',
              background: '#f8fafc',
            }}
          />
        </div>

        {/* Change orders */}
        {(editing.changeOrders || []).length > 0 && (
          <div style={whiteCard}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>
              Change Orders
            </div>
            {(editing.changeOrders || []).map((co) => (
              <div
                key={co.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{co.desc}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {co.coDate ? fmtDate(co.coDate) : ''}
                    {co.coTime ? ` at ${co.coTime}` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(co.amount)}</div>
                <select
                  value={co.status}
                  onChange={(e) => updateChangeOrderStatus(co.id, e.target.value as ChangeOrder['status'])}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 5,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    color: '#0f172a',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {totals && (
          <div
            style={{
              background: BLUE_BG,
              borderRadius: 12,
              padding: '20px 24px',
              maxWidth: 340,
              marginLeft: 'auto',
              marginBottom: 40,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
              <span>Subtotal</span>
              <span>{fmt(totals.subtotal as number)}</span>
            </div>
            {(totals.laborTotal as number) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
                <span>Labor</span>
                <span>{fmt(totals.laborTotal as number)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
              <span>Tax (7.75%)</span>
              <span>{fmt(totals.tax as number)}</span>
            </div>
            {(totals.coTotal as number) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
                <span>Change Orders</span>
                <span>{fmt(totals.coTotal as number)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 18,
                fontWeight: 800,
                color: '#1e40af',
                borderTop: '2px solid #bfdbfe',
                paddingTop: 10,
                marginTop: 6,
              }}
            >
              <span>TOTAL</span>
              <span>{fmt(totals.total as number)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCOModal && (
        <ChangeOrderModal
          onClose={() => setShowCOModal(false)}
          onSave={addChangeOrder}
        />
      )}
      {showImportPicker && (
        <EstimateImportPicker
          onClose={() => setShowImportPicker(false)}
          onImport={(q) => {
            // Re-import: merge sections into current quote
            updateEditing({ sections: q.sections })
          }}
        />
      )}
    </div>
  )
}
