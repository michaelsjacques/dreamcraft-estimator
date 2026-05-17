import { describe, it, expect } from 'vitest'
import { extractJSON } from '../../utils/json'

describe('extractJSON', () => {
  it('extracts JSON from surrounding text', () => {
    const text = 'Here is the result: {"name":"test","value":42} and that is it.'
    const result = extractJSON(text) as { name: string; value: number }
    expect(result.name).toBe('test')
    expect(result.value).toBe(42)
  })

  it('extracts nested objects', () => {
    const text = 'Response: {"outer":{"inner":"data"}}'
    const result = extractJSON(text) as { outer: { inner: string } }
    expect(result.outer.inner).toBe('data')
  })

  it('throws when no JSON object found', () => {
    expect(() => extractJSON('no json here at all')).toThrow('No JSON object found')
  })

  it('throws for text with only an array (no curly braces)', () => {
    // The regex matches { } only, so bare arrays are not matched
    expect(() => extractJSON('[1,2,3]')).toThrow()
  })

  it('throws on invalid JSON object syntax', () => {
    expect(() => extractJSON('{invalid json}')).toThrow()
  })
})
