export function isWeekend(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}
