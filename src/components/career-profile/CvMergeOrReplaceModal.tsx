import { AlertTriangle, PlusCircle, RefreshCcw, X } from 'lucide-react'
import type { ParsedCvData } from '../../api/profileClient'

interface Props {
  open: boolean
  draft: ParsedCvData | null
  onCancel: () => void
  onMerge: () => void
  onReplace: () => void
}

function countLabel(n: number, singular: string, plural: string): string | null {
  if (n === 0) return null
  return `${n} ${n === 1 ? singular : plural}`
}

/**
 * Shown only when a new CV is parsed while the profile already has skills/experience/education/
 * languages from an earlier one. Merging silently risks mixing two unrelated CVs (e.g. an old
 * software-developer profile with a new nursing one) into one incoherent profile the analysis
 * would then read from. The user decides explicitly, every time.
 */
export default function CvMergeOrReplaceModal({ open, draft, onCancel, onMerge, onReplace }: Props) {
  if (!open || !draft) return null

  const found = [
    countLabel(draft.skills?.length ?? 0, 'Skill', 'Skills'),
    countLabel(draft.experience?.length ?? 0, 'Erfahrung', 'Erfahrungen'),
    countLabel(draft.education?.length ?? 0, 'Ausbildungseintrag', 'Ausbildungseinträge'),
    countLabel(draft.languages?.length ?? 0, 'Sprache', 'Sprachen'),
  ].filter((x): x is string => x !== null)

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-merge-replace-title"
    >
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Abbrechen" onClick={onCancel} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl border border-white/10 bg-[#1a140f] shadow-2xl sm:mx-4 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-4 sm:px-5">
          <h2 id="cv-merge-replace-title" className="pr-2 text-lg font-semibold text-stone-100">
            Du hast schon ein Profil
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-lg p-2 text-stone-400 transition hover:bg-white/5 hover:text-stone-100"
            aria-label="Abbrechen"
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3 sm:px-5">
          <p className="text-sm leading-relaxed text-stone-300">
            Dieser Lebenslauf enthält {found.length > 0 ? found.join(', ') : 'neue Daten'}. Wie soll das mit
            deinem bestehenden Profil zusammengehen?
          </p>

          <button
            type="button"
            onClick={onMerge}
            className="mt-4 flex w-full items-start gap-3 rounded-xl border border-[#d97757]/40 bg-[rgba(217,119,87,0.10)] px-4 py-3.5 text-left transition hover:bg-[rgba(217,119,87,0.16)]"
          >
            <PlusCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#d97757]" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-stone-100">Ergänzen</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-stone-400">
                Neue Skills, Erfahrung, Ausbildung und Sprachen kommen zu deinem bestehenden Profil dazu.
                Nichts wird gelöscht. Sinnvoll, wenn der Lebenslauf zu deinem bisherigen Werdegang passt.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onReplace}
            className="mt-3 flex w-full items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3.5 text-left transition hover:bg-rose-950/35"
          >
            <RefreshCcw className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-stone-100">Profil ersetzen</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-stone-400">
                Skills, Erfahrung, Ausbildung und Sprachen werden durch die Daten aus diesem Lebenslauf
                ersetzt. Für eine berufliche Neuorientierung, z. B. von Softwareentwicklung zu Pflege.
                Deine bisherigen Einträge in diesen Bereichen gehen dabei verloren.
              </span>
            </span>
          </button>

          <div className="mt-4 flex gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.06]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#e89372]" aria-hidden />
            <p className="text-xs leading-relaxed text-stone-400">
              Egal wofür du dich entscheidest: Du kannst dein Profil danach jederzeit hier anpassen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
