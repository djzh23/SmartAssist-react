/** Parses backend ---ZIELSPRACHE--- / ---UEBERSETZUNG--- / optional ---KONTEXT--- / ---VARIANTEN--- / ---TIPP---. */
export interface ParsedLearningStructured {
  targetText: string
  translationText: string
  contextText: string | null
  variantsText: string | null
  tipText: string | null
  isStructured: true
}

/**
 * Normalizes delimiter spellings so parsing matches model output (umlauts, spaces, optional END).
 */
export function normalizeLearningResponseMarkers(raw: string): string {
  let t = raw.replace(/\r\n/g, '\n')
  // Übersetzung: models often write Ü instead of UE in the delimiter
  t = t.replace(/---\s*ÜBERSETZUNG\s*---/gi, '---UEBERSETZUNG---')
  t = t.replace(/---\s*Uebersetzung\s*---/gi, '---UEBERSETZUNG---')
  t = t.replace(/---\s*übersetzung\s*---/gi, '---UEBERSETZUNG---')
  t = t.replace(/---\s*Übersetzung\s*---/gi, '---UEBERSETZUNG---')
  t = t.replace(/---\s*Translation\s*---/gi, '---UEBERSETZUNG---')
  t = t.replace(/---\s*ZIELSPRACHE\s*---/gi, '---ZIELSPRACHE---')
  t = t.replace(/---\s*Zielsprache\s*---/gi, '---ZIELSPRACHE---')
  t = t.replace(/---\s*KONTEXT\s*---/gi, '---KONTEXT---')
  t = t.replace(/---\s*VARIANTEN\s*---/gi, '---VARIANTEN---')
  t = t.replace(/---\s*TIPP\s*---/gi, '---TIPP---')
  t = t.replace(/---\s*END\s*---/gi, '---END---')
  return t
}

export function parseLearningResponse(text: string): ParsedLearningStructured | null {
  const normalized = normalizeLearningResponseMarkers(text)

  const targetMatch = normalized.match(/---ZIELSPRACHE---([\s\S]*?)---UEBERSETZUNG---/i)
  if (!targetMatch) return null

  const translationMatch = normalized.match(
    /---UEBERSETZUNG---([\s\S]*?)(?=---KONTEXT---|---VARIANTEN---|---TIPP---|---END---|$)/i,
  )
  const kontextMatch = normalized.match(
    /---KONTEXT---([\s\S]*?)(?=---VARIANTEN---|---TIPP---|---END---|$)/i,
  )
  const variantenMatch = normalized.match(/---VARIANTEN---([\s\S]*?)(?=---TIPP---|---END---|$)/i)
  const tipMatch = normalized.match(/---TIPP---([\s\S]*?)(?:---END---|$)/i)

  return {
    targetText: targetMatch[1].trim(),
    translationText: translationMatch?.[1].trim() ?? '',
    contextText: kontextMatch?.[1].trim() ? kontextMatch[1].trim() : null,
    variantsText: variantenMatch?.[1].trim() ? variantenMatch[1].trim() : null,
    tipText: tipMatch?.[1].trim() ? tipMatch[1].trim() : null,
    isStructured: true,
  }
}
