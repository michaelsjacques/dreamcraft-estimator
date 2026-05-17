import { describe, it, expect } from 'vitest'
import { fmt, fmtDate } from '../../utils/format'

describe('fmt', () => {
  it('returns em-dash for 0', () => {
    expect(fmt(0)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(fmt(undefined)).toBe('—')
  })

  it('returns em-dash for null', () => {
    expect(fmt(null)).toBe('—')
  })

  it('formats 1500 as $1,500', () => {
    expect(fmt(1500)).toBe('$1,500')
  })

  it('formats 1000000 as $1,000,000', () => {
    expect(fmt(1000000)).toBe('$1,000,000')
  })

  it('rounds 99.99 correctly', () => {
    // 99.99 rounded to 0 decimal places = $100
    expect(fmt(99.99)).toBe('$100')
  })

  it('rounds 99.49 correctly', () => {
    expect(fmt(99.49)).toBe('$99')
  })
})

describe('fmtDate', () => {
  it('returns em-dash for undefined', () => {
    expect(fmtDate(undefined)).toBe('—')
  })

  it('returns em-dash for empty string', () => {
    expect(fmtDate('')).toBe('—')
  })

  it('formats 2026-05-17 correctly', () => {
    const result = fmtDate('2026-05-17')
    expect(result).toContain('May')
    expect(result).toContain('17')
    expect(result).toContain('2026')
  })

  it('formats 2025-12-25 correctly', () => {
    const result = fmtDate('2025-12-25')
    expect(result).toContain('Dec')
    expect(result).toContain('25')
    expect(result).toContain('2025')
  })
})
