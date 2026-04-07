/** Parses backend ---ZIELSPRACHE--- / ---UEBERSETZUNG--- / ---TIPP--- blocks. */
export interface ParsedLearningStructured {
  targetText: string
  translationText: string
  tipText: string | null
  isStructured: true
}

export function parseLearningResponse(text: string): ParsedLearningStructured | null {
  const targetMatch = text.match(/---ZIELSPRACHE---([\s\S]*?)---UEBERSETZUNG---/i)
  const translationMatch = text.match(/---UEBERSETZUNG---([\s\S]*?)(?:---TIPP---|---END---)/i)
  const tipMatch = text.match(/---TIPP---([\s\S]*?)---END---/i)

  if (!targetMatch) return null

  return {
    targetText: targetMatch[1].trim(),
    translationText: translationMatch?.[1].trim() ?? '',
    tipText: tipMatch?.[1].trim() ? tipMatch[1].trim() : null,
    isStructured: true,
  }
}
