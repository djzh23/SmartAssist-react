import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import type { JobApplicationApi } from '../../api/client'
import type { CvStudioResumeSummary } from '../../types'
import {
  getLinkedCvForApplication,
  hasCoverLetter,
  hasLeftDraft,
  hasLinkedCv,
  nextApplicationStep,
} from '../../utils/applicationReadiness'

interface ApplicationInfoModalProps {
  app: JobApplicationApi
  cvSummaries: CvStudioResumeSummary[]
  onClose: () => void
}

function Row({
  ok,
  title,
  detail,
}: {
  ok: boolean
  title: string
  detail: string
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <span className="mt-0.5 shrink-0" aria-hidden>
        {ok
          ? <CheckCircle2 className="text-emerald-600" size={20} strokeWidth={2.25} />
          : <XCircle className="text-rose-600" size={20} strokeWidth={2.25} />}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{detail}</p>
      </div>
    </div>
  )
}

export default function ApplicationInfoModal({ app, cvSummaries, onClose }: ApplicationInfoModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const cvOk = hasLinkedCv(app.id, cvSummaries)
  const letterOk = hasCoverLetter(app)
  const pipeOk = hasLeftDraft(app)
  const linked = getLinkedCvForApplication(app.id, cvSummaries)
  const next = nextApplicationStep(app, cvSummaries)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-info-title"
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative max-h-[min(90vh,36rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Schließen"
        >
          <X size={18} aria-hidden />
        </button>
        <div className="p-5 pr-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Bewerbung</p>
          <h2 id="app-info-title" className="mt-1 text-lg font-bold text-slate-900">
            {app.jobTitle || 'Ohne Titel'}
          </h2>
          <p className="text-sm text-slate-600">{app.company || '—'}</p>
        </div>

        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fortschritt</p>
          <Row
            ok={cvOk}
            title="Lebenslauf (CV.Studio)"
            detail={
              cvOk && linked
                ? `Mit dieser Bewerbung verknüpft: „${linked.title}“. Bearbeiten über CV.Studio → Lebenslauf öffnen.`
                : 'Noch kein Lebenslauf mit dieser Bewerbungs-ID in CV.Studio verknüpft. Über „CV.Studio“ einen CV anlegen oder verknüpfen — die ID kommt von dieser Bewerbung.'
            }
          />
          <Row
            ok={letterOk}
            title="Anschreiben"
            detail={
              letterOk
                ? 'Es ist Text im Feld Anschreiben gespeichert.'
                : 'Unter „Anschreiben“ auf der Bewerbungsseite Text einfügen und speichern.'
            }
          />
          <Row
            ok={pipeOk}
            title="Pipeline-Status"
            detail={
              pipeOk
                ? 'Der Bewerbungs-Status ist nicht mehr „Entwurf“ — du trackst den weiteren Verlauf in der Pipeline.'
                : 'Status ist noch „Entwurf“. Nach dem Bewerben den Status anheben (z. B. „Beworben“), damit die Pipeline stimmt.'
            }
          />
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nächster Schritt</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{next}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Schließen
          </button>
          <Link
            to={`/applications/${encodeURIComponent(app.id)}`}
            onClick={onClose}
            className="inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-white hover:bg-amber-700"
          >
            Bewerbung bearbeiten
          </Link>
        </div>
      </div>
    </div>
  )
}
