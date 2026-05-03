import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, CheckCircle2, ChevronDown, Copy, FileText, Loader2, Trash2, XCircle } from 'lucide-react'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'
import AppCtaButton from '../components/ui/AppCtaButton'
import {
  type ApplicationStatusApi,
  type JobApplicationApi,
  deleteJobApplication,
  fetchJobApplication,
  listCvStudioResumes,
  saveJobApplicationCoverLetter,
  saveJobApplicationInterviewNotes,
  updateJobApplicationStatus,
} from '../api/client'
import type { CvStudioResumeSummary } from '../types'
import {
  getLinkedCvForApplication,
  hasCoverLetter,
  hasLeftDraft,
  hasLinkedCv,
  nextApplicationStep,
} from '../utils/applicationReadiness'
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
  const [cvSummaries, setCvSummaries] = useState<CvStudioResumeSummary[]>([])
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
      const [a, cvs] = await Promise.all([
        fetchJobApplication(token, id),
        listCvStudioResumes(token).catch(() => [] as CvStudioResumeSummary[]),
      ])
      setApp(a)
      setCvSummaries(cvs)
      setCoverLetter(a.coverLetterText ?? '')
      setInterviewNotes(a.interviewNotes ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
      setApp(null)
      setCvSummaries([])
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
      <div className="flex min-h-[40vh] flex-1 items-center justify-center gap-2 text-stone-500">
        <Loader2 className="animate-spin" size={22} />
        Lädt…
      </div>
    )
  }

  if (!app) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-stone-400/40 bg-app-parchment/90 px-6 py-12 text-center shadow-landing">
          <p className="text-stone-700">{error ?? 'Bewerbung nicht gefunden.'}</p>
          <Link to="/applications" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Zurück zu allen Bewerbungen
          </Link>
        </div>
      </div>
    )
  }

  const linkedCv = getLinkedCvForApplication(app.id, cvSummaries)
  const cvStudioHref = linkedCv
    ? `/cv-studio/edit/${encodeURIComponent(linkedCv.id)}`
    : `/cv-studio/basis/${encodeURIComponent(app.id)}`
  const cvStudioLabel = linkedCv ? 'CV in CV.Studio öffnen' : 'CV.Studio: Lebenslauf verknüpfen'

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl border border-stone-400/40 bg-app-parchment/90 p-5 shadow-landing backdrop-blur-sm sm:p-6">
        {!careerProfileLoading && careerProfile && getProfileCompleteness(careerProfile) < 90 && (
          <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50/90 px-4 py-3 text-sm text-teal-900">
            <span className="font-semibold">Profil {getProfileCompleteness(careerProfile)}%</span>
            {getProfileCompletenessGapHint(careerProfile)
              ? <> - {getProfileCompletenessGapHint(careerProfile)}</>
              : null}
            {' '}
            <Link to="/career-profile" className="font-semibold text-primary hover:underline">
              Profil stärken
            </Link>
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-stone-400/35 pb-6">
          <div>
            <Link
              to="/applications"
              className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft size={16} />
              Alle Bewerbungen
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Bewerbung</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">{app.jobTitle}</h1>
            <p className="mt-0.5 text-stone-700">{app.company}</p>
            {app.jobUrl && (
              <a href={app.jobUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
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
                className="inline-flex min-w-[12rem] items-center justify-between gap-2 rounded-xl border border-stone-400/45 bg-white/95 px-3 py-2 text-left text-sm font-semibold text-stone-900 shadow-card outline-none ring-primary transition hover:border-stone-400/60 hover:bg-app-parchmentDeep/50 focus-visible:ring-2 disabled:opacity-60"
              >
                <span className="truncate">{statusLabelFor(app.status)}</span>
                {statusSaving
                  ? <Loader2 className="shrink-0 animate-spin text-stone-500" size={18} aria-hidden />
                  : <ChevronDown className={`shrink-0 text-stone-500 transition ${statusMenuOpen ? 'rotate-180' : ''}`} size={18} aria-hidden />}
              </button>
              {statusMenuOpen && (
                <ul
                  role="listbox"
                  aria-labelledby="app-status-label"
                  className="absolute right-0 z-[120] mt-1 max-h-72 min-w-[12rem] overflow-y-auto rounded-xl border border-stone-400/40 bg-app-parchment/98 py-1 shadow-landing [scrollbar-width:thin]"
                >
                  {STATUS_OPTIONS.map(o => (
                    <li key={o.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={o.value === app.status}
                        className={[
                          'w-full px-3 py-2.5 text-left text-sm text-stone-800 transition hover:bg-app-parchmentDeep/90',
                          o.value === app.status ? 'bg-primary/10 font-semibold text-stone-900' : '',
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
              to={cvStudioHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-400/45 bg-white/95 px-3 py-2 text-sm font-semibold text-stone-900 shadow-card transition hover:border-stone-400/60 hover:bg-app-parchmentDeep/50"
            >
              <FileText size={16} aria-hidden />
              {cvStudioLabel}
            </Link>
            <button
              type="button"
              onClick={() => void removeApp()}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-300/60 bg-white/90 px-3 py-2 text-sm font-semibold text-rose-800 shadow-sm transition hover:bg-rose-50"
            >
              <Trash2 size={16} />
              Löschen
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <section className="mb-6 rounded-2xl border border-stone-400/40 bg-gradient-to-b from-app-parchment via-app-parchmentDeep/95 to-app-parchment/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-stone-900">Fortschritt für diese Stelle</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Fortschritt & CV.Studio"
              ariaLabel="Erklärung zum Fortschritt, zur CV-Verknüpfung und zur Pipeline"
              className="mt-0.5"
            >
              <p>
                Hier bearbeitest du eine einzelne Bewerbung. Der Lebenslauf liegt in CV.Studio und wird über dieselbe
                Bewerbungs-ID verknüpft - die Pipeline auf „Meine Bewerbungen“ liest genau diese Verknüpfung aus.
              </p>
              <div className="mt-4 border-t border-stone-200 pt-4">
                <p className="font-semibold text-stone-900">Lebenslauf (CV.Studio)</p>
                <p className="mt-1">
                  {linkedCv
                    ? `Mit „${linkedCv.title}“ verknüpft. Zum Bearbeiten den Button „${cvStudioLabel}“ oben nutzen.`
                    : 'Noch kein CV verknüpft. Über den Button oben in CV.Studio einen Lebenslauf wählen oder anlegen - die Verknüpfung erfolgt automatisch mit dieser Bewerbung.'}
                </p>
              </div>
              <div className="mt-4 border-t border-stone-200 pt-4">
                <p className="font-semibold text-stone-900">Anschreiben</p>
                <p className="mt-1">
                  {hasCoverLetter(app)
                    ? 'Text ist gespeichert - unten bei Bedarf weiter bearbeiten.'
                    : 'Unten im Abschnitt „Anschreiben“ Text einfügen und speichern.'}
                </p>
              </div>
              <div className="mt-4 border-t border-stone-200 pt-4">
                <p className="font-semibold text-stone-900">Pipeline-Status</p>
                <p className="mt-1">
                  Aktuell: <span className="font-medium text-stone-900">{statusLabelFor(app.status)}</span>
                  {!hasLeftDraft(app)
                    ? ' - nach dem Bewerben Status anheben, damit die Kanban-Spalte auf „Meine Bewerbungen“ stimmt.'
                    : ' - passt zur Spalte auf der Übersichtsseite.'}
                </p>
              </div>
            </InfoExplainerButton>
          </div>
          <ul className="mt-4 space-y-2">
            <li className="flex gap-3 rounded-xl border border-stone-400/35 bg-white/95 px-3 py-2.5 shadow-sm">
              {hasLinkedCv(app.id, cvSummaries)
                ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} strokeWidth={2.25} aria-hidden />
                : <XCircle className="mt-0.5 shrink-0 text-rose-600" size={20} strokeWidth={2.25} aria-hidden />}
              <div>
                <p className="text-sm font-semibold text-stone-900">Lebenslauf (CV.Studio)</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {linkedCv ? `Verknüpft: „${linkedCv.title}“` : 'Nicht verknüpft'}
                </p>
              </div>
            </li>
            <li className="flex gap-3 rounded-xl border border-stone-400/35 bg-white/95 px-3 py-2.5 shadow-sm">
              {hasCoverLetter(app)
                ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} strokeWidth={2.25} aria-hidden />
                : <XCircle className="mt-0.5 shrink-0 text-rose-600" size={20} strokeWidth={2.25} aria-hidden />}
              <div>
                <p className="text-sm font-semibold text-stone-900">Anschreiben</p>
                <p className="mt-0.5 text-xs text-stone-600">{hasCoverLetter(app) ? 'Gespeichert' : 'Noch leer'}</p>
              </div>
            </li>
            <li className="flex gap-3 rounded-xl border border-stone-400/35 bg-white/95 px-3 py-2.5 shadow-sm">
              {hasLeftDraft(app)
                ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} strokeWidth={2.25} aria-hidden />
                : <XCircle className="mt-0.5 shrink-0 text-rose-600" size={20} strokeWidth={2.25} aria-hidden />}
              <div>
                <p className="text-sm font-semibold text-stone-900">Pipeline-Status</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  <span className="font-medium text-stone-800">{statusLabelFor(app.status)}</span>
                </p>
              </div>
            </li>
          </ul>
          <p className="mt-4 rounded-xl border border-stone-400/30 bg-app-parchmentDeep/80 px-3 py-2.5 text-sm font-medium text-stone-800">
            {nextApplicationStep(app, cvSummaries)}
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-stone-400/40 bg-white/95 p-5 shadow-card">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Stellenanzeige</h2>
          <p className="whitespace-pre-wrap text-sm text-stone-800">
            {app.jobDescription?.trim() || 'Kein Stellentext hinterlegt.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AppCtaButton type="button" onClick={goAnalyze} className="shadow-md">
              Analyse starten
            </AppCtaButton>
            {app.analysisSessionId && (
              <span className="self-center text-xs text-stone-500">
                Verknüpfte Analyse-Session: {app.analysisSessionId}
              </span>
            )}
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-stone-400/40 bg-white/95 p-5 shadow-card">
          <div className="mb-2 flex items-center gap-1.5">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Anschreiben</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Anschreiben"
              ariaLabel="Hinweise zum Anschreiben und PDF-Export"
              className="translate-y-px"
            >
              <p>
                Du kannst den Text hier bearbeiten oder extern (z. B. mit der KI im Chat) vorbereiten und einfügen -
                anschließend auf dieser Seite speichern.
              </p>
              <p className="mt-3">
                PDF-Export für Anschreiben erfolgt über das Karriereprofil, nicht über dieses Formular.
              </p>
            </InfoExplainerButton>
          </div>
          <textarea
            className="min-h-[140px] w-full rounded-xl border border-stone-400/40 bg-app-parchment/40 px-3 py-2 text-sm text-stone-900 outline-none ring-primary placeholder:text-stone-500 focus:ring-2"
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value.slice(0, 5000))}
            placeholder="Text hier einfügen oder schreiben …"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveCover()}
              disabled={savingCover}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary-hover disabled:opacity-60"
            >
              {savingCover ? 'Speichert…' : 'Speichern'}
            </button>
            <button
              type="button"
              onClick={() => void copyCover()}
              className="inline-flex items-center gap-1 rounded-xl border border-stone-400/45 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-app-parchmentDeep/80"
            >
              <Copy size={16} />
              Kopieren
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-stone-400/40 bg-white/95 p-5 shadow-card">
          <div className="mb-2 flex items-center gap-1.5">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">CV-Anpassungen</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="CV-Anpassungen"
              ariaLabel="Erklärung zu CV-Anpassungen"
              className="translate-y-px"
            >
              <p>
                Hier können später stellenbezogene Hinweise zur CV-Anpassung stehen - oder du erarbeitest sie per KI
                im Chat und überträgst die Kernaussagen.
              </p>
            </InfoExplainerButton>
          </div>
          {app.tailoredCvNotes?.trim()
            ? <p className="text-sm text-stone-700">{app.tailoredCvNotes.trim()}</p>
            : <p className="text-sm text-stone-500">Noch keine Einträge.</p>}
        </section>

        <section className="mb-6 rounded-xl border border-stone-400/40 bg-white/95 p-5 shadow-card">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Interview-Vorbereitung</h2>
          <AppCtaButton type="button" onClick={goInterview} className="shadow-md">
            Interview-Training starten
          </AppCtaButton>
          {app.interviewSessionId && (
            <p className="mt-2 text-xs text-stone-500">Verknüpfte Session-ID: {app.interviewSessionId}</p>
          )}
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Notizen</label>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-stone-400/40 bg-app-parchment/40 px-3 py-2 text-sm text-stone-900 outline-none ring-primary focus:ring-2"
              value={interviewNotes}
              onChange={e => setInterviewNotes(e.target.value.slice(0, 3000))}
            />
            <button
              type="button"
              onClick={() => void saveInterview()}
              disabled={savingInterview}
              className="mt-2 rounded-xl border border-stone-400/45 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-app-parchmentDeep/80 disabled:opacity-60"
            >
              {savingInterview ? 'Speichert…' : 'Interview-Notizen speichern'}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-stone-400/40 bg-white/95 p-5 shadow-card">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Timeline</h2>
          <ul className="space-y-3">
            {timelineSorted.map((ev, i) => (
              <li key={`${ev.date}-${i}`} className="border-l-[3px] border-primary pl-3 text-sm">
                <span className="text-xs text-stone-500">
                  {new Date(ev.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <p className="font-semibold text-stone-900">{ev.description}</p>
                {ev.note && <p className="text-stone-600">{ev.note}</p>}
              </li>
            ))}
          </ul>
        </section>
        </div>
      </div>
    </div>
  )
}
