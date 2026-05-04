import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  MessageSquare,
  NotebookPen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AppCtaButton from '../ui/AppCtaButton'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: ClipboardList,
    title: 'Karriereprofil',
    description:
      'Berufsfeld, Erfahrung, Skills und Ziele – präzise Grundlage für alle KI-Antworten.',
  },
  {
    icon: MessageSquare,
    title: 'KI-Chat',
    description:
      'Stelle Fragen zu Bewerbungen, Gehaltsverhandlungen oder Interviews – profilbasiert und kontextuell.',
  },
  {
    icon: FolderOpen,
    title: 'Bewerbungen',
    description: 'Alle Bewerbungen in einer Pipeline mit Status, Notizen und Dokumenten.',
  },
  {
    icon: FileText,
    title: 'CV.Studio',
    description:
      'Lebensläufe strukturiert erstellen, versionieren und auf Stellen zuschneiden.',
  },
  {
    icon: NotebookPen,
    title: 'Notizen',
    description: 'Gespeicherte Chat-Ergebnisse suchen, filtern und direkt weiterverarbeiten.',
  },
]

interface Props {
  onNext: () => void
  onBack: () => void
}

export default function OnboardingFeatureTour({ onNext, onBack }: Props) {
  const [current, setCurrent] = useState(0)
  const feature = FEATURES[current]
  const Icon = feature.icon
  const isFirst = current === 0
  const isLast = current === FEATURES.length - 1

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="w-full max-w-sm">
        {/* Feature card */}
        <div className="relative rounded-2xl border border-app-border bg-app-surface/60 px-10 py-10 shadow-landing-md">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
              <Icon className="text-amber-400" size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-stone-100">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-stone-400">{feature.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrent(i => i - 1)}
            disabled={isFirst}
            aria-label="Vorherige Funktion"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-stone-400 transition hover:bg-white/10 hover:text-stone-200 disabled:opacity-0"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCurrent(i => i + 1)}
            disabled={isLast}
            aria-label="Nächste Funktion"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-stone-400 transition hover:bg-white/10 hover:text-stone-200 disabled:opacity-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="mt-4 flex justify-center gap-2">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Feature ${i + 1}`}
              className={[
                'h-1.5 rounded-full transition-all duration-200',
                i === current ? 'w-6 bg-amber-400' : 'w-1.5 bg-stone-600 hover:bg-stone-500',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <AppCtaButton size="lg" onClick={onNext}>
          Weiter zum Setup
        </AppCtaButton>
        <button
          type="button"
          onClick={onBack}
          className="py-2 text-sm text-stone-500 hover:text-stone-300"
        >
          Zurück
        </button>
      </div>
    </div>
  )
}
