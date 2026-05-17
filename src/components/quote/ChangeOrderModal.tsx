import React, { useState, type CSSProperties } from 'react'
import { Btn } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { genId } from '../../utils/id'
import type { ChangeOrder } from '../../types'

interface ChangeOrderModalProps {
  onClose: () => void
  onSave: (co: ChangeOrder) => void
}

export function ChangeOrderModal({ onClose, onSave }: ChangeOrderModalProps) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [coDate, setCoDate] = useState(new Date().toISOString().slice(0, 10))
  const [coTime, setCoTime] = useState(
    new Date().toTimeString().slice(0, 5)
  )

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
    width: 480,
    padding: 28,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }

  const row: CSSProperties = {
    display: 'flex',
    gap: 12,
  }

  const field: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }

  function handleSave() {
    if (!desc.trim() || !amount) return
    const co: ChangeOrder = {
      id: genId(),
      desc: desc.trim(),
      amount: parseFloat(amount) || 0,
      status: 'pending',
      coDate,
      coTime,
      images: [],
    }
    onSave(co)
    onClose()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
            + Add Change Order
          </span>
          <Btn onClick={onClose}>✕</Btn>
        </div>

        <div style={field}>
          <Label>Description</Label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the change order..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={field}>
          <Label>Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ color: '#0f172a', background: '#f8fafc', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={row}>
          <div style={field}>
            <Label>Date</Label>
            <Input
              type="date"
              value={coDate}
              onChange={(e) => setCoDate(e.target.value)}
              style={{ color: '#0f172a', background: '#f8fafc', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={field}>
            <Label>Time</Label>
            <Input
              type="time"
              value={coTime}
              onChange={(e) => setCoTime(e.target.value)}
              style={{ color: '#0f172a', background: '#f8fafc', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            primary
            onClick={handleSave}
            disabled={!desc.trim() || !amount}
          >
            Add Change Order
          </Btn>
        </div>
      </div>
    </div>
  )
}
