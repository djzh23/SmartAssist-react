import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, ChevronDown, Copy, FileText, Loader2, Trash2 } from 'lucide-react'
import {
  type ApplicationStatusApi,
  type JobApplicationApi,
  deleteJobApplication,
  fetchJobApplication,
  saveJobApplicationCoverLetter,
  saveJobApplicationInterviewNotes,
  updateJobApplicationStatus,
} from '../api/client'
import { useAppUi } from '../context/AppUiContext'
import { useCareerProfile } from '../hooks/useCareerProfile'
import { getProfileCompleteness, getProfileCompletenessGapHint } from '../utils/profileCompleteness'

const STATUS_OPTIONS: { value: ApplicationStatusApi; label: string }[] = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'applied', label: 'Beworben' },
  { value: 'phoneScreen', label: 'Erstgespräch' },
  { value: 'interview', label: 'Interview' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'offer', label: 'Angebot' },
  { value: 'accepted', label: 'Angenommen' },
  { value: 'rejected', label: 'Abgesagt' },
  { value: 'withdrawn', label: 'Zurückgezogen' },
]

function statusLabelFor(status: ApplicationStatusApi): string {
  return STATUS_OPTIONS.find(o => o.value === status)?.label ?? status
}

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
  const { requestConfirm } = useAppUi()
  const { profile: careerProfile, loading: careerProfileLoading } = useCareerProfile()
  const navigate = useNavigate()
  const [app, setApp] = useState<JobApplicationApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [savingCover, setSavingCover] = useState(false)
  const [interviewNotes, setInterviewNotes] = useState('')
  const [savingInterview, setSavingInterview] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!statusMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const el = statusMenuRef.current
      if (el && !el.contains(e.target as Node))
        setStatusMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [statusMenuOpen])

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

  const pickStatus = async (next: ApplicationStatusApi) => {
    if (!app || !id || next === app.status) {
      setStatusMenuOpen(false)
      return
    }
    setStatusSaving(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return
      }
      await updateJobApplicationStatus(token, id, { status: next })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status speichern fehlgeschlagen')
    } finally {
      setStatusSaving(false)
      setStatusMenuOpen(false)
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
    const ok = await requestConfirm({
      title: 'Bewerbung löschen?',
      message: 'Diese Bewerbung wird dauerhaft entfernt.',
      confirmLabel: 'Löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!ok) return
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
        {!careerProfileLoading && careerProfile && getProfileCompleteness(careerProfile) < 90 && (
          <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-900">
            <span className="font-semibold">Profil {getProfileCompleteness(careerProfile)}%</span>
            {getProfileCompletenessGapHint(careerProfile)
              ? <> — {getProfileCompletenessGapHint(careerProfile)}</>
              : null}
            {' '}
            <Link to="/career-profile" className="font-medium text-primary hover:underline">
              Profil stärken
            </Link>
          </div>
        )}
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
            <span className="sr-only" id="app-status-label">Status</span>
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                id="app-status"
                aria-labelledby="app-status-label"
                aria-haspopup="listbox"
                aria-expanded={statusMenuOpen}
                disabled={statusSaving}
                onClick={() => setStatusMenuOpen(v => !v)}
                className="inline-flex min-w-[12rem] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm outline-none ring-primary transition hover:border-slate-300 focus-visible:ring-2 disabled:opacity-60"
              >
                <span className="truncate">{statusLabelFor(app.status)}</span>
                {statusSaving
                  ? <Loader2 className="shrink-0 animate-spin text-slate-500" size={18} aria-hidden />
                  : <ChevronDown className={`shrink-0 text-slate-500 transition ${statusMenuOpen ? 'rotate-180' : ''}`} size={18} aria-hidden />}
              </button>
              {statusMenuOpen && (
                <ul
                  role="listbox"
                  aria-labelledby="app-status-label"
                  className="absolute right-0 z-[120] mt-1 max-h-72 min-w-[12rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {STATUS_OPTIONS.map(o => (
                    <li key={o.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={o.value === app.status}
                        className={[
                          'w-full px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-100',
                          o.value === app.status ? 'bg-amber-50 font-semibold text-amber-900' : '',
                        ].join(' ')}
                        onClick={() => void pickStatus(o.value)}
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link
              to={`/cv-studio/basis/${encodeURIComponent(app.id)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FileText size={16} aria-hidden />
              CV anzeigen
            </Link>
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
