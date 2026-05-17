import type { Theme, NavGroup } from '../types'

export const TAX_RATE = 0.0775

export const SECTION_TYPES = [
  'Fabrication',
  'Graphics',
  'Installation',
  'Dismantle',
  'Shipping',
  'AV/Tech',
  'Storage',
  'Rental',
  'Misc',
]

export const QUOTE_STORAGE = 'dce_quotes_v1'

export const SB_URL = 'https://gsjuqsmrqhyphzedwspa.supabase.co'
export const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzanVxc21ycWh5cGh6ZWR3c3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzg0MzAsImV4cCI6MjA4NzcxNDQzMH0.QPS0R0CzpKyPPB18Q1HksNCSuomrR_Yna0EH5l06YJc'

export const DARK: Theme = {
  bg: '#000',
  bg2: '#0a0a0a',
  bg3: '#111',
  border: 'rgba(255,255,255,0.1)',
  border2: 'rgba(255,255,255,0.06)',
  text: '#fff',
  text2: 'rgba(255,255,255,0.7)',
  text3: 'rgba(255,255,255,0.4)',
  text4: 'rgba(255,255,255,0.2)',
  navBg: '#000',
  navBorder: 'rgba(255,255,255,0.1)',
  cardBg: '#000',
  cardHover: 'rgba(255,255,255,0.04)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.15)',
}

export const LIGHT: Theme = {
  bg: '#f4f4f4',
  bg2: '#ffffff',
  bg3: '#eaeaea',
  border: 'rgba(0,0,0,0.1)',
  border2: 'rgba(0,0,0,0.06)',
  text: '#0a0a0a',
  text2: 'rgba(0,0,0,0.65)',
  text3: 'rgba(0,0,0,0.4)',
  text4: 'rgba(0,0,0,0.2)',
  navBg: '#ffffff',
  navBorder: 'rgba(0,0,0,0.1)',
  cardBg: '#ffffff',
  cardHover: 'rgba(0,0,0,0.025)',
  inputBg: 'rgba(0,0,0,0.04)',
  inputBorder: 'rgba(0,0,0,0.15)',
}

export const NAV_GROUPS: NavGroup[] = [
  { id: 'estimator', label: 'Estimator', subs: [] },
  { id: 'quotes', label: 'Quoter', subs: [] },
  {
    id: 'planning',
    label: 'Planning',
    subs: [
      { id: 'projects', label: 'Overview', subs: [] },
      { id: 'todo', label: 'To Do', subs: [] },
      { id: 'milestone', label: 'Milestone Creator', subs: [] },
      { id: 'milcalendar', label: 'Milestone Calendar', subs: [] },
      { id: 'workorder', label: 'Work Order', subs: [] },
    ],
  },
  { id: 'shophours', label: 'Shop', subs: [] },
  { id: 'chat', label: 'Chat', subs: [] },
  {
    id: 'dreamteam',
    label: 'Dream Team',
    subs: [
      { id: 'contacts', label: 'Contacts', subs: [] },
      { id: 'documents', label: 'Documents', subs: [] },
      { id: 'brandkit', label: 'Brand Kit', subs: [] },
    ],
  },
]
