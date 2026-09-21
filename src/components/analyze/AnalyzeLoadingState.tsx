import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const STEPS = [
  'Lebenslauf wird gelesen',
  'Stellenanzeige wird analysiert',
  'Skill-Abgleich läuft',
  'Bewertung wird erstellt',
  'Prüfung auf Fakten',
] as const

const STEP_MS = 1600

export default function AnalyzeLoadingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="rounded-[20px] border border-[#3a332d] bg-[#232019] p-5 sm:p-6" aria-live="polite">
      <p className="font-display text-lg text-[#f5f1eb]">Analyse läuft</p>
      <ol className="mt-4 space-y-2.5">
        {STEPS.map((label, i) => {
          const done = i < step
          const current = i === step
          return (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <Check className="h-4 w-4 shrink-0 text-[#6f8f6d]" aria-hidden />
              ) : current ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#d97757]" aria-hidden />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-[#3a332d]" aria-hidden />
              )}
              <span className={done ? 'text-[#cfc6b8]' : current ? 'text-[#f5f1eb]' : 'text-[#8a7f70]'}>
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
