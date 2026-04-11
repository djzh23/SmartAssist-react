import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Loader2, X } from 'lucide-react'

/** Session only: user closed modal to try chat without entering data (not the same as API skip). */
export const ONBOARDING_CHAT_PROMPT_DISMISS_KEY = 'privateprep_onboarding_chat_prompt_dismissed'

interface Props {
  isOpen: boolean
  onDismissSession: () => void
  onSkipApi: () => Promise<void>
  onAfterSkip: () => void
}

export default function OnboardingPromptModal({
  isOpen,
  onDismissSession,
  onSkipApi,
  onAfterSkip,
}: Props) {
  const navigate = useNavigate()
  const [skipBusy, setSkipBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSetup = () => {
    navigate('/onboarding')
  }

  const handleSkip = async () => {
    setError(null)
    setSkipBusy(true)
    try {
      await onSkipApi()
      onAfterSkip()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Überspringen fehlgeschlagen')
    } finally {
      setSkipBusy(false)
    }
  }

  const handleCloseTry = () => {
    onDismissSession()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-prompt-title"
      onClick={handleCloseTry}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleCloseTry}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>

        <div className="border-b border-slate-100 bg-gradient-to-br from-primary-light/80 to-white px-5 pb-4 pt-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 id="onboarding-prompt-title" className="text-lg font-semibold text-slate-900">
                Karriereprofil — einmal einrichten
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Du kannst den Chat sofort nutzen. Wenn du ein kurzes Profil anlegst, passen sich Antworten besser an dich
                an — <strong className="font-medium text-slate-800">du gibst nichts doppelt ein</strong>: entweder hier
                die geführten 3 Schritte oder später alles unter <strong className="font-medium text-slate-800">Karriereprofil</strong>{' '}
                in der Seitenleiste.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Was die Einrichtung macht</p>
          <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
            <li>Berufsfeld &amp; Erfahrung (für passenden Ton und Themen)</li>
            <li>Ziele wählen (z.&nbsp;B. Bewerbung, Interview, CV)</li>
            <li>Optional: CV-Text — oder überspringen</li>
          </ol>
        </div>

        {error && (
          <div className="mx-5 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          <button
            type="button"
            onClick={handleSetup}
            disabled={skipBusy}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Jetzt einrichten (3 kurze Schritte)
          </button>
          <button
            type="button"
            onClick={() => void handleSkip()}
            disabled={skipBusy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {skipBusy ? <Loader2 size={16} className="animate-spin" /> : null}
            Ohne Profil weitermachen (dauerhaft überspringen)
          </button>
          <button
            type="button"
            onClick={handleCloseTry}
            disabled={skipBusy}
            className="w-full py-2 text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline disabled:opacity-50"
          >
            Schließen — nur testen (ich richte später ein)
          </button>
        </div>
      </div>
    </div>
  )
}
