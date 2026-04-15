import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, Copy, Loader2, Trash2 } from 'lucide-react'
import {
  type ApplicationStatusApi,
  type JobApplicationApi,
  deleteJobApplication,
  fetchJobApplication,
  saveJobApplicationCoverLetter,
  saveJobApplicationInterviewNotes,
  updateJobApplicationStatus,
} from '../api/client'

const STATUS_OPTIONS: { value: ApplicationStatusApi; label: string }[] = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'applied', label: 'Beworben' },
  { value: 'phoneScreen', label: 'Erstgespräch' },
  { value: 'interview', label: 'Interview' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'offer', label: 'Angebot' },
  { value: 'accepted', label: 'Angenommen' },
  { value: 'rejected', label: 'Absage' },
  { value: 'withdrawn', label: 'Zurückgezogen' },
]

function interviewSeedText(app: JobApplicationApi): string {
  const role = app.jobTitle
    ? `ROLE: ${app.jobTitle}${app.company ? ` at ${app.company}` : ''}`
    : (app.company ? `COMPANY: ${app.company}` : '')
  const body = (app.jobDescription ?? '').trim().slice(0, 2800)
  return [role, body].filter(Boolean).join('\n')
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [app, setApp] = useState<JobApplicationApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [savingCover, setSavingCover] = useState(false)
  const [interviewNotes, setInterviewNotes] = useState('')
  const [savingInterview, setSavingInterview] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return
      }
      const a = await fetchJobApplication(token, id)
      setApp(a)
      setCoverLetter(a.coverLetterText ?? '')
      setInterviewNotes(a.interviewNotes ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
      setApp(null)
    } finally {
      setLoading(false)
    }
  }, [getToken, id])

  useEffect(() => {
    void load()
  }, [load])

  const timelineSorted = useMemo(() => {
    if (!app) return []
    return [...app.timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [app])

  const goAnalyze = () => {
    if (!app) return
    navigate('/chat?tool=jobanalyzer', {
      state: {
        seedFromApplication: {
          applicationId: app.id,
          mode: 'jobanalyzer' as const,
          jobTitle: app.jobTitle,
          company: app.company,
          jobDescription: (app.jobDescription ?? '').slice(0, 3000),
        },
      },
    })
  }

  const goInterview = () => {
    if (!app) return
    navigate('/chat?tool=interview', {
      state: {
        seedFromApplication: {
          applicationId: app.id,
          mode: 'interview' as const,
          jobTitle: app.jobTitle,
          company: app.company,
          jobDescription: interviewSeedText(app),
        },
      },
    })
  }

  const onStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!app || !id) return
    const next = e.target.value as ApplicationStatusApi
    try {
      const token = await getToken()
      if (!token) return
      await updateJobApplicationStatus(token, id, { status: next })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status speichern fehlgeschlagen')
    }
  }

  const saveCover = async () => {
    if (!id) return
    setSavingCover(true)
    try {
      const token = await getToken()
      if (!token) return
      await saveJobApplicationCoverLetter(token, id, coverLetter.slice(0, 5000))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSavingCover(false)
    }
  }

  const saveInterview = async () => {
    if (!id) return
    setSavingInterview(true)
    try {
      const token = await getToken()
      if (!token) return
      await saveJobApplicationInterviewNotes(token, id, interviewNotes.slice(0, 3000))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSavingInterview(false)
    }
  }

  const removeApp = async () => {
    if (!id || !app) return
    if (!window.confirm('Diese Bewerbung wirklich löschen?')) return
    try {
      const token = await getToken()
      if (!token) return
      await deleteJobApplication(token, id)
      navigate('/applications', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  const copyCover = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter)
    } catch {
      setError('Zwischenablage nicht verfügbar.')
    }
  }

  if (loading && !app) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center gap-2 text-slate-600">
        <Loader2 className="animate-spin" size={22} />
        Lädt…
      </div>
    )
  }

  if (!app) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-slate-600">{error ?? 'Bewerbung nicht gefunden.'}</p>
        <Link to="/applications" className="mt-4 inline-block text-primary hover:underline">
          Zur Übersicht
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/applications"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft size={16} />
              Zurück
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{app.jobTitle}</h1>
            <p className="text-slate-600">{app.company}</p>
            {app.jobUrl && (
              <a href={app.jobUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-primary hover:underline">
                Stellenanzeige öffnen
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="app-status">Status</label>
            <select
              id="app-status"
              value={app.status}
              onChange={onStatusChange}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none ring-primary focus:ring-2"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void removeApp()}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Löschen
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Stellenanzeige</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-800">
            {app.jobDescription?.trim() || 'Kein Stellentext hinterlegt.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goAnalyze}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Analyse starten
            </button>
            {app.analysisSessionId && (
              <span className="self-center text-xs text-slate-500">
                Verknüpfte Analyse-Session: {app.analysisSessionId}
              </span>
            )}
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Anschreiben</h2>
          <textarea
            className="min-h-[140px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value.slice(0, 5000))}
            placeholder="Text bearbeiten oder von der KI generieren lassen (extern), dann hier speichern."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveCover()}
              disabled={savingCover}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {savingCover ? 'Speichert…' : 'Speichern'}
            </button>
            <button
              type="button"
              onClick={() => void copyCover()}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Copy size={16} />
              Kopieren
            </button>
            <span className="self-center text-xs text-slate-500">PDF-Export erfolgt über das Karriereprofil.</span>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">CV-Anpassungen</h2>
          <p className="text-sm text-slate-700">
            {app.tailoredCvNotes?.trim()
              || 'Hinweise zur CV-Anpassung können hier später ergänzt oder per KI im Chat erarbeitet werden.'}
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Interview-Vorbereitung</h2>
          <button
            type="button"
            onClick={goInterview}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Interview-Training starten
          </button>
          {app.interviewSessionId && (
            <p className="mt-2 text-xs text-slate-500">Verknüpfte Session-ID: {app.interviewSessionId}</p>
          )}
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Notizen</label>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              value={interviewNotes}
              onChange={e => setInterviewNotes(e.target.value.slice(0, 3000))}
            />
            <button
              type="button"
              onClick={() => void saveInterview()}
              disabled={savingInterview}
              className="mt-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {savingInterview ? 'Speichert…' : 'Interview-Notizen speichern'}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Timeline</h2>
          <ul className="space-y-3">
            {timelineSorted.map((ev, i) => (
              <li key={`${ev.date}-${i}`} className="border-l-2 border-primary pl-3 text-sm">
                <span className="text-xs text-slate-500">
                  {new Date(ev.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <p className="font-medium text-slate-900">{ev.description}</p>
                {ev.note && <p className="text-slate-600">{ev.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
