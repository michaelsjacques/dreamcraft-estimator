import React, { useState, type CSSProperties } from 'react'
import { Btn } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { NON_UNION_RATE, UNION_RATES } from '../../constants/rates'
import { calcLaborSection, fmtDate } from '../../utils'
import { genId } from '../../utils/id'
import { isWeekend } from '../../utils/date'
import { callClaude } from '../../services/claude'
import type { LaborSection, LaborRates, Quote } from '../../types'

const BLUE_BG = '#e8f4fe'
const DARK_HDR = '#1e293b'

interface UnionLaborPanelProps {
  quote: Quote
  onChange: (updated: Quote) => void
}

export function UnionLaborPanel({ quote, onChange }: UnionLaborPanelProps) {
  const [lookingUp, setLookingUp] = useState(false)
  const [jurisdiction, setJurisdiction] = useState<string | null>(null)

  const isUnion = quote.laborType === 'union'

  function getRates(): LaborRates {
    if (!isUnion) return NON_UNION_RATE
    const key = (quote.city || '').toLowerCase().trim()
    return UNION_RATES[key] || NON_UNION_RATE
  }

  const rates = getRates()

  function setLaborType(t: string) {
    onChange({ ...quote, laborType: t })
  }

  async function lookupJurisdiction() {
    if (!quote.venue && !quote.city) return
    setLookingUp(true)
    try {
      const system =
        'You are a trade show labor expert. Given a venue and city, identify the union jurisdiction (IATSE local, Teamsters, etc.) and provide a 2-sentence summary of the labor rules. Be concise.'
      const userMsg = `Venue: ${quote.venue || 'N/A'}\nCity: ${quote.city || 'N/A'}\nZip: (unknown)\n\nWhat is the union jurisdiction and key labor rules?`
      const resp = await callClaude(system, userMsg, 500)
      setJurisdiction(resp)
    } catch {
      setJurisdiction('Could not fetch jurisdiction info. Please check your API connection.')
    } finally {
      setLookingUp(false)
    }
  }

  function addLaborSection() {
    const ls: LaborSection = {
      id: genId(),
      label: 'Install Crew',
      workersPerDay: 2,
      startTime: '07:00',
      endTime: '15:00',
      dates: [],
      notes: '',
    }
    onChange({ ...quote, laborSections: [...(quote.laborSections || []), ls] })
  }

  function updateLaborSection(id: string, patch: Partial<LaborSection>) {
    onChange({
      ...quote,
      laborSections: (quote.laborSections || []).map((ls) =>
        ls.id === id ? { ...ls, ...patch } : ls
      ),
    })
  }

  function removeLaborSection(id: string) {
    onChange({
      ...quote,
      laborSections: (quote.laborSections || []).filter((ls) => ls.id !== id),
    })
  }

  function toggleDate(lsId: string, dateStr: string) {
    const ls = (quote.laborSections || []).find((s) => s.id === lsId)
    if (!ls) return
    const dates = ls.dates.includes(dateStr)
      ? ls.dates.filter((d) => d !== dateStr)
      : [...ls.dates, dateStr].sort()
    updateLaborSection(lsId, { dates })
  }

  // Generate a date range based on quote install/dismantle dates
  function getDateRange(): string[] {
    const start = quote.installStart
    const end = quote.dismantleEnd || quote.dismantleStart || quote.installEnd
    if (!start) return []
    const dates: string[] = []
    const cur = new Date(start + 'T12:00:00')
    const endDate = end ? new Date(end + 'T12:00:00') : new Date(cur.getTime() + 7 * 86400000)
    while (cur <= endDate && dates.length < 30) {
      dates.push(cur.toISOString().slice(0, 10))
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  const dateRange = getDateRange()

  const panelStyle: CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  }

  const headerStyle: CSSProperties = {
    background: DARK_HDR,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const toggleBtnStyle = (active: boolean): CSSProperties => ({
    padding: '5px 14px',
    borderRadius: 5,
    border: 'none',
    background: active ? '#3b82f6' : 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  })

  const bodyStyle: CSSProperties = { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }

  const rateCard: CSSProperties = {
    background: BLUE_BG,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    color: '#1e40af',
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  }

  const sectionCard: CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  }

  const sectionHdr: CSSProperties = {
    background: '#f8fafc',
    padding: '8px 12px',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  }

  const sectionBody: CSSProperties = { padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginRight: 'auto' }}>
          Labor
        </span>
        <button style={toggleBtnStyle(!isUnion)} onClick={() => setLaborType('non-union')}>
          Non-Union
        </button>
        <button style={toggleBtnStyle(isUnion)} onClick={() => setLaborType('union')}>
          Union
        </button>
      </div>

      <div style={bodyStyle}>
        {/* Venue/City/Lookup */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 150 }}>
            <Label>Venue</Label>
            <Input
              value={quote.venue || ''}
              onChange={(e) => onChange({ ...quote, venue: e.target.value })}
              placeholder="Convention Center name"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <Label>City</Label>
            <Input
              value={quote.city || ''}
              onChange={(e) => onChange({ ...quote, city: e.target.value })}
              placeholder="Las Vegas"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
            />
          </div>
          {isUnion && (
            <Btn onClick={lookupJurisdiction} disabled={lookingUp}>
              {lookingUp ? '…' : '⚡ Lookup Jurisdiction'}
            </Btn>
          )}
        </div>

        {/* Rate display */}
        <div style={rateCard}>
          <span><strong>{rates.local}</strong></span>
          <span>ST ${rates.stStraight}/h</span>
          <span>OT ${rates.stOT}/h</span>
          <span>DT ${rates.stDT}/h</span>
          {rates.laborNote && <span style={{ color: '#475569', fontStyle: 'italic', width: '100%' }}>{rates.laborNote}</span>}
        </div>

        {/* Jurisdiction info */}
        {jurisdiction && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534' }}>
            {jurisdiction}
          </div>
        )}

        {/* Labor sections */}
        {(quote.laborSections || []).map((ls) => {
          const calc = calcLaborSection(ls, rates)
          return (
            <div key={ls.id} style={sectionCard}>
              <div style={sectionHdr}>
                <Input
                  value={ls.label}
                  onChange={(e) => updateLaborSection(ls.id, { label: e.target.value })}
                  placeholder="Crew label"
                  style={{ flex: 1, background: 'transparent', border: 'none', fontWeight: 600, fontSize: 13, color: '#0f172a', padding: '2px 0' }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Label style={{ margin: 0 }}>Workers</Label>
                  <Input
                    type="number"
                    min={1}
                    value={ls.workersPerDay}
                    onChange={(e) => updateLaborSection(ls.id, { workersPerDay: parseInt(e.target.value) || 1 })}
                    style={{ width: 60, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', textAlign: 'center' }}
                  />
                  <Label style={{ margin: 0 }}>Start</Label>
                  <Input
                    type="time"
                    value={ls.startTime}
                    onChange={(e) => updateLaborSection(ls.id, { startTime: e.target.value })}
                    style={{ width: 100, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}
                  />
                  <Label style={{ margin: 0 }}>End</Label>
                  <Input
                    type="time"
                    value={ls.endTime}
                    onChange={(e) => updateLaborSection(ls.id, { endTime: e.target.value })}
                    style={{ width: 100, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}
                  />
                  <Btn onClick={() => removeLaborSection(ls.id)} style={{ color: '#ef4444', padding: '4px 8px' }}>✕</Btn>
                </div>
              </div>

              <div style={sectionBody}>
                {/* Date picker */}
                {dateRange.length > 0 ? (
                  <div>
                    <Label>Select Work Days</Label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {dateRange.map((d) => {
                        const active = ls.dates.includes(d)
                        const wknd = isWeekend(d)
                        return (
                          <button
                            key={d}
                            onClick={() => toggleDate(ls.id, d)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 5,
                              border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                              background: active ? '#eff6ff' : wknd ? '#fef9c3' : '#fff',
                              color: active ? '#1e40af' : wknd ? '#854d0e' : '#475569',
                              fontSize: 11,
                              cursor: 'pointer',
                              fontWeight: active ? 600 : 400,
                            }}
                          >
                            {fmtDate(d).replace(', 2026', '').replace(', 2025', '')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Set install/dismantle dates on the quote to see date picker.
                  </div>
                )}

                {/* Cost breakdown */}
                {ls.dates.length > 0 && (
                  <div style={{ background: BLUE_BG, borderRadius: 6, padding: '8px 12px' }}>
                    {calc.breakdown.map((day) => (
                      <div key={day.date} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#1e40af', padding: '2px 0' }}>
                        <span>{fmtDate(day.date)}{day.weekend ? ' (Weekend – DT)' : ''}</span>
                        <span>${day.cost.toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, color: '#1e40af', borderTop: '1px solid #bfdbfe', marginTop: 6, paddingTop: 6 }}>
                      <span>Section Total</span>
                      <span>${calc.total.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <Input
                  value={ls.notes}
                  onChange={(e) => updateLaborSection(ls.id, { notes: e.target.value })}
                  placeholder="Notes for this crew..."
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                />
              </div>
            </div>
          )
        })}

        <Btn onClick={addLaborSection} style={{ alignSelf: 'flex-start' }}>
          + Add Labor Section
        </Btn>
      </div>
    </div>
  )
}
