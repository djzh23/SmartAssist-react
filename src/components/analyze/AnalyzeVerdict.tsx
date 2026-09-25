import { Sparkles } from 'lucide-react'
import { plainGerman } from './analyzeFormat'

interface Props {
  /** Short recommendation sentence (≤ 20 words). */
  headline?: string | null
  /** 2–3 sentence rationale citing CV / posting specifics. */
  paragraph?: string | null
}

/**
 * The concrete recommendation, above the score grid. Renders `null` when the
 * model returned neither field — older stored reports and v1 responses stay
 * intact.
 */
export default function AnalyzeVerdict({ headline, paragraph }: Props) {
  const cleanHeadline = plainGerman(headline ?? '').trim()
  const cleanParagraph = plainGerman(paragraph ?? '').trim()
  if (!cleanHeadline && !cleanParagraph) return null

  return (
    <section
      aria-label="Bewerbungs-Empfehlung"
      className="rounded-2xl border border-[#e8e0d0] bg-[#faf7f0] px-5 py-5 sm:px-6 sm:py-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#b45539]" aria-hidden />
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#b45539]">
          Empfehlung
        </p>
      </div>
      {cleanHeadline ? (
        <p className="mt-2.5 text-[17px] font-semibold leading-snug text-[#1a1613] sm:text-lg">
          {cleanHeadline}
        </p>
      ) : null}
      {cleanParagraph ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[#4a4238] sm:text-[15px]">
          {cleanParagraph}
        </p>
      ) : null}
    </section>
  )
}
