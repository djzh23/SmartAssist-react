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
    <section className="rounded-2xl border border-stone-600/40 bg-app-surface/90 p-5 shadow-landing" aria-live="polite">
      <p className="text-sm font-semibold text-stone-50">Analyse läuft</p>
      <ol className="mt-4 space-y-2.5">
        {STEPS.map((label, i) => {
          const done = i < step
          const current = i === step
          return (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              ) : current ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" aria-hidden />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-stone-600" aria-hidden />
              )}
              <span className={done ? 'text-stone-300' : current ? 'text-stone-50' : 'text-stone-500'}>
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
