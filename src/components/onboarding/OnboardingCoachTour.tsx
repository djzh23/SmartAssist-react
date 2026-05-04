import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  FileText,
  FolderOpen,
  MessageSquare,
  NotebookPen,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AppCtaButton from '../ui/AppCtaButton'

interface CoachStep {
  icon: LucideIcon
  title: string
  body: string
  route: string
  cta: string
}

const COACH_STEPS: CoachStep[] = [
  {
    icon: ClipboardList,
    title: 'Karriereprofil',
    body: 'Hier pflegst du Berufsfeld, Skills und Ziele – je vollständiger, desto präziser die KI-Antworten.',
    route: '/career-profile',
    cta: 'Profil öffnen',
  },
  {
    icon: MessageSquare,
    title: 'KI-Chat',
    body: 'Stelle konkrete Fragen zu Bewerbungen, Vorstellungsgesprächen oder Karriereplanung.',
    route: '/chat',
    cta: 'Chat öffnen',
  },
  {
    icon: FolderOpen,
    title: 'Bewerbungen',
    body: 'Behalte alle laufenden Bewerbungen im Überblick – Pipeline, Status und Dokumente.',
    route: '/applications',
    cta: 'Pipeline öffnen',
  },
  {
    icon: FileText,
    title: 'CV.Studio',
    body: 'Erstelle und versioniere Lebensläufe – direkt auf Stellenanzeigen zugeschnitten.',
    route: '/cv-studio',
    cta: 'CV.Studio öffnen',
  },
  {
    icon: NotebookPen,
    title: 'Notizen',
    body: 'Gespeicherte Ergebnisse aus dem Chat: filterbar, suchbar, sofort einsatzbereit.',
    route: '/notes',
    cta: 'Notizen öffnen',
  },
]

interface Props {
  /** Where to navigate after tour completion or skip. */
  destination: string
  /** Called when the tour ends (finish or skip) — use to set the server flag. */
  onDone: () => void
}

export default function OnboardingCoachTour({ destination, onDone }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const current = COACH_STEPS[step]
  const Icon = current.icon
  const isLast = step === COACH_STEPS.length - 1
  const total = COACH_STEPS.length

  const finish = (route: string) => {
    onDone()
    navigate(route, { replace: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-canvas/80 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-app-border bg-app-surface shadow-landing-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Kurzführung durch PrivatePrep"
      >
        {/* Skip button */}
        <button
          type="button"
          onClick={() => finish(destination)}
          aria-label="Tour überspringen"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-white/5 hover:text-stone-300"
        >
          <X size={16} />
        </button>

        <div className="p-8">
          {/* Step header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
              <Icon className="text-amber-400" size={22} />
            </div>
            <div>
              <p className="text-xs text-stone-500">
                {step + 1} / {total}
              </p>
              <h3 className="font-semibold text-stone-100">{current.title}</h3>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-stone-400">{current.body}</p>

          {/* Progress bar */}
          <div className="mb-6 flex gap-1">
            {COACH_STEPS.map((_, i) => (
              <div
                key={i}
                className={[
                  'h-0.5 flex-1 rounded-full transition-all duration-300',
                  i <= step ? 'bg-amber-500' : 'bg-stone-700',
                ].join(' ')}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {isLast ? (
              <AppCtaButton onClick={() => finish(destination)}>
                App erkunden
              </AppCtaButton>
            ) : (
              <>
                <AppCtaButton onClick={() => setStep(s => s + 1)}>
                  Weiter
                </AppCtaButton>
                <AppCtaButton variant="secondary" onClick={() => finish(current.route)}>
                  {current.cta}
                </AppCtaButton>
              </>
            )}
            <button
              type="button"
              onClick={() => finish(destination)}
              className="py-2 text-sm text-stone-500 hover:text-stone-300"
            >
              Tour überspringen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
