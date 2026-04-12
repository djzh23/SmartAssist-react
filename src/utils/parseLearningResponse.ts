/** Parses backend ---ZIELSPRACHE--- / ---UEBERSETZUNG--- / optional ---KONTEXT--- / ---VARIANTEN--- / ---TIPP---. */
export interface ParsedLearningStructured {
  targetText: string
  translationText: string
  contextText: string | null
  variantsText: string | null
  tipText: string | null
  isStructured: true
}

export function parseLearningResponse(text: string): ParsedLearningStructured | null {
  const targetMatch = text.match(/---ZIELSPRACHE---([\s\S]*?)---UEBERSETZUNG---/i)
  if (!targetMatch) return null

  const translationMatch = text.match(
    /---UEBERSETZUNG---([\s\S]*?)(?=---KONTEXT---|---VARIANTEN---|---TIPP---|---END---)/i,
  )
  const kontextMatch = text.match(/---KONTEXT---([\s\S]*?)(?=---VARIANTEN---|---TIPP---|---END---)/i)
  const variantenMatch = text.match(/---VARIANTEN---([\s\S]*?)(?=---TIPP---|---END---)/i)
  const tipMatch = text.match(/---TIPP---([\s\S]*?)---END---/i)

  return {
    targetText: targetMatch[1].trim(),
    translationText: translationMatch?.[1].trim() ?? '',
    contextText: kontextMatch?.[1].trim() ? kontextMatch[1].trim() : null,
    variantsText: variantenMatch?.[1].trim() ? variantenMatch[1].trim() : null,
    tipText: tipMatch?.[1].trim() ? tipMatch[1].trim() : null,
    isStructured: true,
  }
}
