import { Check } from 'lucide-react'
import { scoreLabel, scoreLevel, scorePercent, warningLevel, type LevelTone } from './analyzeFormat'

interface Props {
  cvMatch: number
  roleAlignment: number
  culture: number
  redFlags: number
  /** Only set when the automatic skill comparison is reliable. */
  coveredCount?: number
  requirementTotal?: number
  warningCount: number
}

const TONE_TEXT: Record<LevelTone, string> = {
  good: 'text-[#5e7a5c]',
  mid: 'text-[#8a6a3a]',
  low: 'text-[#b45539]',
}

const TONE_FILL: Record<LevelTone, string> = {
  good: 'bg-[#6f8f6d]',
  mid: 'bg-[#d4a574]',
  low: 'bg-[#d97757]',
}

function ScoreRow({ title, value, text }: { title: string; value: number; text: string }) {
  const level = scoreLevel(value)
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-[#1a1613]">{title}</p>
        <p className={`shrink-0 text-[13px] font-medium ${TONE_TEXT[level.tone]}`}>
          {level.word}
          <span className="ml-1.5 font-normal text-[#8a7f70]">{scoreLabel(value)} von 5</span>
        </p>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#efe8da]"
        role="img"
        aria-label={`${title}: ${scoreLabel(value)} von 5`}
      >
        <div className={`h-full rounded-full ${TONE_FILL[level.tone]}`} style={{ width: `${scorePercent(value)}%` }} />
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#6e665e]">{text}</p>
    </li>
  )
}

/** Warning signs run the other way round (1 = nothing found), so they get a word instead of a number. */
function WarningRow({ score, count }: { score: number; count: number }) {
  const level = warningLevel(score)
  let text: string
  if (count > 0) {
    text = `${count === 1 ? 'Eine Auffälligkeit' : `${count} Auffälligkeiten`} in der Anzeige, siehe Hinweise.`
  } else if (level.tone === 'good') {
    text = 'Keine unklaren Aufgaben, unrealistischen Anforderungen oder ähnliche Auffälligkeiten erkannt.'
  } else {
    text = 'Die Bewertung sieht Auffälligkeiten in der Anzeige, etwa unklare Aufgaben oder Anforderungen.'
  }

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-[#1a1613]">Warnsignale in der Anzeige</p>
        <p className={`inline-flex shrink-0 items-center gap-1 text-[13px] font-medium ${TONE_TEXT[level.tone]}`}>
          {level.tone === 'good' ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : null}
          {level.word}
        </p>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#6e665e]">{text}</p>
    </li>
  )
}

export default function AnalyzeScoreBreakdown({
  cvMatch,
  roleAlignment,
  culture,
  redFlags,
  coveredCount,
  requirementTotal,
  warningCount,
}: Props) {
  const skillsText =
    typeof coveredCount === 'number' && typeof requirementTotal === 'number' && requirementTotal > 0
      ? `Dein Lebenslauf belegt ${coveredCount} von ${requirementTotal} Anforderungen der Stellenanzeige.`
      : 'Wie gut dein Lebenslauf die Anforderungen der Stellenanzeige abdeckt.'

  return (
    <section aria-label="Bewertung im Detail">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">So setzt sich die Bewertung zusammen</p>
      <p className="mt-1 text-[13px] text-[#6e665e]">Bezogen auf die Stellenanzeige. 1 ist schwach, 5 ist sehr stark.</p>
      <ul className="mt-5 space-y-5">
        <ScoreRow title="Fähigkeiten und Erfahrung" value={cvMatch} text={skillsText} />
        <ScoreRow
          title="Passung zur Rolle"
          value={roleAlignment}
          text="Wie gut die Stelle zu deinen Zielen und deinem bisherigen Weg passt."
        />
        <ScoreRow
          title="Arbeitsumfeld"
          value={culture}
          text="Was die Anzeige über Team, Arbeitsweise und Rahmenbedingungen erkennen lässt."
        />
        <WarningRow score={redFlags} count={warningCount} />
      </ul>
    </section>
  )
}
