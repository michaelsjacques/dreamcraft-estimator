import { SB_URL, SB_KEY } from '../constants'

const HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates',
}

interface SupabaseRow {
  id: string
  data: unknown
}

export async function sbLoad(table: string): Promise<unknown[]> {
  const res = await fetch(
    `${SB_URL}/rest/v1/${table}?select=id,data&order=updated_at.desc`,
    { headers: HEADERS }
  )
  if (!res.ok) throw new Error(`sbLoad ${table} failed: ${res.status}`)
  const rows = (await res.json()) as SupabaseRow[]
  return rows.map((r) =>
    typeof r.data === 'object' && r.data !== null
      ? { ...(r.data as Record<string, unknown>), id: r.id }
      : r
  )
}

export async function sbSave(
  table: string,
  id: string,
  data: unknown
): Promise<void> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`sbSave ${table}/${id} failed: ${res.status}`)
}

export async function sbDelete(table: string, id: string): Promise<void> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: HEADERS,
  })
  if (!res.ok) throw new Error(`sbDelete ${table}/${id} failed: ${res.status}`)
}

export async function sbSaveAll(
  table: string,
  items: Array<{ id: string }>
): Promise<void> {
  await Promise.all(items.map((item) => sbSave(table, item.id, item)))
}
