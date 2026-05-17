import { TAX_RATE, QUOTE_STORAGE } from '../constants'
import { sbSaveAll } from '../services/supabase'
import { genId } from './id'
import { isWeekend } from './date'
import type {
  Quote,
  QuoteSection,
  LaborSection,
  ChangeOrder,
  LaborRates,
  LaborCalcResult,
  LaborBreakdownDay,
  QuoteTotals,
} from '../types'

// ---------------------------------------------------------------------------
// sanitizeQuote
// ---------------------------------------------------------------------------
export function sanitizeQuote(q: unknown): Quote | null {
  if (!q || typeof q !== 'object') return null
  const raw = q as Record<string, unknown>
  return {
    ...raw,
    sections: Array.isArray(raw.sections) ? (raw.sections as QuoteSection[]) : [],
    laborSections: Array.isArray(raw.laborSections)
      ? (raw.laborSections as LaborSection[])
      : [],
    changeOrders: Array.isArray(raw.changeOrders)
      ? (raw.changeOrders as ChangeOrder[])
      : [],
  } as Quote
}

// ---------------------------------------------------------------------------
// loadQuotes / saveQuotes
// ---------------------------------------------------------------------------
export function loadQuotes(): Quote[] {
  try {
    const raw = localStorage.getItem(QUOTE_STORAGE)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    return parsed.map(sanitizeQuote).filter(Boolean) as Quote[]
  } catch {
    return []
  }
}

export function saveQuotes(arr: Quote[]): void {
  const sanitized = arr.map(sanitizeQuote).filter(Boolean) as Quote[]
  localStorage.setItem(QUOTE_STORAGE, JSON.stringify(sanitized))
  sbSaveAll('quotes', sanitized).catch(() => {
    // silently fail — local save is source of truth
  })
}

// ---------------------------------------------------------------------------
// calcLaborSection
// ---------------------------------------------------------------------------
export function calcLaborSection(
  section: LaborSection,
  rates: LaborRates
): LaborCalcResult {
  const { workersPerDay, startTime, endTime, dates } = section

  // Parse hours from "HH:MM" strings
  const parseHour = (t: string): number => {
    const [h, m] = t.split(':').map(Number)
    return h + (m || 0) / 60
  }

  const startH = parseHour(startTime || '07:00')
  const endH = parseHour(endTime || '15:00')
  const totalHours = Math.max(0, endH - startH)

  const straightH = Math.min(totalHours, 8)
  const otH = Math.min(Math.max(0, totalHours - 8), 4)
  const dtH = Math.max(0, totalHours - 12)

  const breakdown: LaborBreakdownDay[] = (dates || []).map((date) => {
    const weekend = isWeekend(date)
    let cost: number
    if (weekend) {
      // All hours at DT rate on weekends
      cost = totalHours * rates.stDT * workersPerDay
    } else {
      cost =
        (straightH * rates.stStraight +
          otH * rates.stOT +
          dtH * rates.stDT) *
        workersPerDay
    }
    return { date, weekend, cost }
  })

  const total = breakdown.reduce((sum, d) => sum + d.cost, 0)

  return { straightH, otH, dtH, breakdown, total }
}

// ---------------------------------------------------------------------------
// calcTotals
// ---------------------------------------------------------------------------
export function calcTotals(q: Quote | null | undefined): Partial<QuoteTotals> {
  if (!q) return {}

  const sections = q.sections || []
  const laborSections = q.laborSections || []
  const changeOrders = q.changeOrders || []

  // Subtotal: sum of all line items
  let subtotal = 0
  let taxable = 0
  for (const section of sections) {
    for (const item of section.lineItems || []) {
      const lineTotal = (item.qty || 0) * (item.unitPrice || 0)
      subtotal += lineTotal
      if (item.taxable) taxable += lineTotal
    }
  }

  // Labor total — need rates; use a zero-rate fallback if laborType not resolved here
  // Callers pass pre-resolved rates into calcLaborSection; here we just sum section totals
  // by calling calcLaborSection with a stub if no rates are available.
  // For the pure utility we accept optional rates on the quote object itself.
  const resolvedRates = (q as Quote & { _rates?: LaborRates })._rates
  let laborTotal = 0
  if (resolvedRates) {
    for (const ls of laborSections) {
      laborTotal += calcLaborSection(ls, resolvedRates).total
    }
  }

  const tax = taxable * TAX_RATE

  // Approved change orders only
  const coTotal = changeOrders
    .filter((co) => co.status === 'approved')
    .reduce((sum, co) => sum + (co.amount || 0), 0)

  const total = subtotal + laborTotal + tax + coTotal

  return { subtotal, laborTotal, tax, coTotal, total }
}

// ---------------------------------------------------------------------------
// blankQuote
// ---------------------------------------------------------------------------
export function blankQuote(fromEstimate?: Record<string, unknown>): Quote {
  const now = new Date().toISOString()
  const quoteNum =
    'DCE-Q-' + String(Math.floor(10000 + Math.random() * 90000))

  const base: Quote = {
    id: genId(),
    quoteNumber: quoteNum,
    title: '',
    clientName: '',
    projectName: '',
    status: 'draft',
    sections: [],
    laborSections: [],
    changeOrders: [],
    venue: '',
    city: '',
    boothNumber: '',
    shipDate: '',
    installStart: '',
    installEnd: '',
    showStart: '',
    showEnd: '',
    dismantleStart: '',
    dismantleEnd: '',
    notes: '',
    laborType: 'non-union',
    createdAt: now,
    updatedAt: now,
  }

  if (fromEstimate) {
    return {
      ...base,
      title: (fromEstimate.title as string) || '',
      clientName: (fromEstimate.clientName as string) || '',
      projectName: (fromEstimate.projectName as string) || '',
      estimateId: fromEstimate.id as string | undefined,
    }
  }

  return base
}
