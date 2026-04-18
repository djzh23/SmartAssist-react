/** Parses `READINESS: NN/100` (or variants) from interview assistant Markdown. */
export function pickInterviewReadinessScore(text: string): number | undefined {
  const m = text.match(/\bREADINESS:\s*(\d{1,3})(?:\s*\/\s*100)?\b/i)
  if (!m) return undefined
  const n = Number(m[1])
  if (!Number.isFinite(n)) return undefined
  return Math.min(100, Math.max(0, Math.round(n)))
}
