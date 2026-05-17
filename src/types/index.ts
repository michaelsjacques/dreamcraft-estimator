export interface Theme {
  bg: string
  bg2: string
  bg3: string
  border: string
  border2: string
  text: string
  text2: string
  text3: string
  text4: string
  navBg: string
  navBorder: string
  cardBg: string
  cardHover: string
  inputBg: string
  inputBorder: string
}

export interface NavGroup {
  id: string
  label: string
  subs: NavGroup[]
}

export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
  category: string
  taxable: boolean
}

export interface QuoteSection {
  id: string
  title: string
  type: string
  notes: string
  photos: string[]
  lineItems: LineItem[]
  _showInventoryPicker?: boolean
}

export interface LaborSection {
  id: string
  label: string
  workersPerDay: number
  startTime: string
  endTime: string
  dates: string[]
  notes: string
}

export interface ChangeOrder {
  id: string
  desc: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  coDate?: string
  coTime?: string
  images?: string[]
}

export interface Quote {
  id: string
  quoteNumber: string
  title: string
  clientName: string
  projectName: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  sections: QuoteSection[]
  laborSections: LaborSection[]
  changeOrders: ChangeOrder[]
  venue: string
  city: string
  boothNumber: string
  shipDate: string
  installStart: string
  installEnd: string
  showStart: string
  showEnd: string
  dismantleStart: string
  dismantleEnd: string
  notes: string
  laborType: string
  estimateId?: string
  createdAt: string
  updatedAt: string
}

export interface LaborRates {
  local: string
  stStraight: number
  stOT: number
  stDT: number
  laborNote: string
}

export interface LaborBreakdownDay {
  date: string
  weekend: boolean
  cost: number
}

export interface LaborCalcResult {
  straightH: number
  otH: number
  dtH: number
  breakdown: LaborBreakdownDay[]
  total: number
}

export interface QuoteTotals {
  subtotal: number
  laborTotal: number
  tax: number
  coTotal: number
  total: number
}
