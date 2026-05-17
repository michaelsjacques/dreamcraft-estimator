export function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in text')
  return JSON.parse(match[0])
}
