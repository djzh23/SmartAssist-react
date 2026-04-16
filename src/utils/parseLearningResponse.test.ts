import { describe, expect, it } from 'vitest'
import { normalizeLearningResponseMarkers, parseLearningResponse } from './parseLearningResponse'

describe('normalizeLearningResponseMarkers', () => {
  it('maps_uebersetzung_variants_to_ue', () => {
    const raw = '---ZIELSPRACHE---\nHallo\n---Übersetzung---\nHi'
    expect(normalizeLearningResponseMarkers(raw)).toContain('---UEBERSETZUNG---')
  })
})

describe('parseLearningResponse', () => {
  it('returns_null_when_missing_markers', () => {
    expect(parseLearningResponse('plain text')).toBeNull()
  })

  it('parses_structured_blocks', () => {
    const text = `---ZIELSPRACHE---
Guten Tag
---UEBERSETZUNG---
Good day
---KONTEXT---
ctx
---TIPP---
tip`
    const p = parseLearningResponse(text)
    expect(p).not.toBeNull()
    expect(p!.targetText).toBe('Guten Tag')
    expect(p!.translationText).toBe('Good day')
    expect(p!.contextText).toBe('ctx')
    expect(p!.tipText).toBe('tip')
    expect(p!.isStructured).toBe(true)
  })
})
