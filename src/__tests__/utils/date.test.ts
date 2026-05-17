import { describe, it, expect } from 'vitest'
import { isWeekend } from '../../utils/date'

describe('isWeekend', () => {
  it('2026-05-16 (Saturday) → true', () => {
    expect(isWeekend('2026-05-16')).toBe(true)
  })

  it('2026-05-17 (Sunday) → true', () => {
    expect(isWeekend('2026-05-17')).toBe(true)
  })

  it('2026-05-18 (Monday) → false', () => {
    expect(isWeekend('2026-05-18')).toBe(false)
  })

  it('2026-05-22 (Friday) → false', () => {
    expect(isWeekend('2026-05-22')).toBe(false)
  })

  it('empty string → false', () => {
    expect(isWeekend('')).toBe(false)
  })

  it('undefined → false', () => {
    expect(isWeekend(undefined)).toBe(false)
  })
})
