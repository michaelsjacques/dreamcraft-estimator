export function getProxyUrl(): string {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    return 'https://dreamcraft-estimator.vercel.app/api/claude'
  }
  return '/api/claude'
}

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>
}

export async function callClaude(
  system: string,
  userMsg: string,
  maxTokens = 4000
): Promise<string> {
  const messages: ClaudeMessage[] = [{ role: 'user', content: userMsg }]

  const res = await fetch(getProxyUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as ClaudeResponse
  return data.content?.[0]?.text ?? ''
}
