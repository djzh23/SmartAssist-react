import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Eye,
  HelpCircle,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import {
  fetchJobApplications,
  fetchLearningInsights,
  patchLearningInsight,
  resolveLearningInsight,
  type JobApplicationApi,
} from '../api/client'
import type { LearningInsight as LearningInsightRow } from '../types'
import type {
  CareerProfile,
  Education,
  ParsedCvData,
  ProfileLanguage,
  TargetJob,
  WorkExperience,
} from '../api/profileClient'
import {
  addTargetJob,
  completeOnboarding,
  deleteCareerProfile,
  fetchAnonymousCvSummary,
  fetchProfile,
  removeTargetJob,
  updateFullProfile,
  updateSkills,
  type AnonymousSummaryLanguage,
} from '../api/profileClient'
import CvUploader from '../components/profile/CvUploader'

// ─── helpers ────────────────────────────────────────────────────────────────

function canMarkProfileSetupComplete(p: CareerProfile): boolean {
  return Boolean(p.field?.trim() && p.level?.trim() && p.goals.length > 0)
}

function hasEnoughForAnonymousCvSummary(p: CareerProfile): boolean {
  if ((p.skills?.length ?? 0) > 0) return true
  if ((p.experience?.length ?? 0) > 0) return true
  return (p.cvRawText?.trim().length ?? 0) >= 50
}

const FIELDS: { value: string; label: string }[] = [
  { value: 'it', label: 'IT / Softwareentwicklung' },
  { value: 'marketing', label: 'Marketing / Kommunikation' },
  { value: 'finance', label: 'Finanzen / Buchhaltung' },
  { value: 'healthcare', label: 'Gesundheit / Pflege' },
  { value: 'engineering', label: 'Ingenieurwesen / Technik' },
  { value: 'education', label: 'Bildung / Wissenschaft' },
  { value: 'sales', label: 'Vertrieb / Sales' },
  { value: 'hr', label: 'Personal / HR' },
  { value: 'legal', label: 'Recht / Jura' },
  { value: 'trades', label: 'Handwerk / Produktion' },
  { value: 'design', label: 'Design / Kreativ' },
  { value: 'other', label: 'Sonstiges' },
]

const LEVELS: { value: string; label: string }[] = [
  { value: 'entry', label: 'Berufseinsteiger (0–1 Jahre)' },
  { value: 'junior', label: 'Junior (1–3 Jahre)' },
  { value: 'mid', label: 'Mid-Level (3–5 Jahre)' },
  { value: 'senior', label: 'Senior (5–10 Jahre)' },
  { value: 'lead', label: 'Lead / Führungskraft (10+ Jahre)' },
  { value: 'career_change', label: 'Karrierewechsler' },
]

const GOALS: { id: string; label: string }[] = [
  { id: 'new_job', label: 'Neuen Job finden' },
  { id: 'career_switch', label: 'Karrierewechsel' },
  { id: 'interview_prep', label: 'Interview vorbereiten' },
  { id: 'cv_improvement', label: 'Lebenslauf verbessern' },
  { id: 'salary_negotiation', label: 'Gehaltsverhandlung' },
  { id: 'language', label: 'Sprachen / Kommunikation' },
]

function emptyExp(): WorkExperience {
  return { title: '', company: '', duration: '', summary: '' }
}

function emptyEdu(): Education {
  return { degree: '', institution: '', year: '' }
}

function emptyLang(): ProfileLanguage {
  return { name: '', level: '' }
}

const PENDING_CV_KEY = 'privateprep_pending_cv_parsed'

function mergeParsedDraftIntoProfile(
  profile: CareerProfile,
  draft: ParsedCvData,
): CareerProfile {
  const effField = (draft.field?.trim() || profile.field)?.trim() || profile.field
  const effLevel = (draft.level?.trim() || profile.level)?.trim() || profile.level
  const exFiltered =
    draft.experience?.filter(e => (e.title ?? '').trim() || (e.company ?? '').trim()) ?? []
  const eduFiltered =
    draft.education?.filter(e => (e.degree ?? '').trim() || (e.institution ?? '').trim()) ?? []
  const langFiltered = draft.languages?.filter(l => (l.name ?? '').trim()) ?? []

  return {
    ...profile,
    field: effField ?? null,
    fieldLabel: FIELDS.find(f => f.value === effField)?.label ?? profile.fieldLabel,
    level: effLevel ?? null,
    levelLabel: LEVELS.find(l => l.value === effLevel)?.label ?? profile.levelLabel,
    currentRole: draft.currentRole?.trim() || profile.currentRole,
    skills: draft.skills?.length ? draft.skills : profile.skills,
    experience: exFiltered.length > 0 ? exFiltered : profile.experience,
    educationEntries: eduFiltered.length > 0 ? eduFiltered : profile.educationEntries,
    languages: langFiltered.length > 0 ? langFiltered : profile.languages,
  }
}

// ─── markdown renderer ───────────────────────────────────────────────────────

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

function renderSummaryMarkdown(text: string): ReactNode {
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-sm text-stone-800">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={i} className="mt-3 mb-1 text-xs font-bold uppercase tracking-wide text-violet-700">
              {line.slice(4)}
            </h4>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="mt-4 mb-1 text-sm font-bold text-violet-900">
              {line.slice(3)}
            </h3>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="mt-4 mb-2 text-base font-bold text-violet-950">
              {line.slice(2)}
            </h2>
          )
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
              <span>{renderInline(line.slice(2))}</span>
            </div>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-1.5" />
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

// ─── HelpModal ───────────────────────────────────────────────────────────────

const HELP_TABS = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'summary', label: 'Zusammenfassung' },
  { id: 'jobs', label: 'Wunschstellen' },
  { id: 'privacy', label: 'Datenschutz' },
] as const

type HelpTab = (typeof HELP_TABS)[number]['id']

function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<HelpTab>('overview')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-300/40 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">Karriereprofil — Hilfe</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-1 border-b border-stone-200 px-4 pt-3">
          {HELP_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
                tab === t.id
                  ? 'border-b-2 border-violet-600 text-violet-700'
                  : 'text-stone-500 hover:text-stone-900',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-5 text-sm text-stone-700 leading-relaxed">
          {tab === 'overview' && (
            <div className="space-y-3">
              <p>
                Das <strong className="text-stone-900">Karriereprofil</strong> ist das Herzstück deiner
                Personalisierung. Je vollständiger es ist, desto gezielter kann der Assistent dir bei
                Bewerbungen, Interviews und Jobsuche helfen.
              </p>
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-2">
                <p className="font-semibold text-violet-900">Was wird verwendet?</p>
                <ul className="space-y-1">
                  {[
                    'Berufsfeld & Level → Grundlage aller Analysen',
                    'Skills → Stärken-/Lückenanalyse im Chat',
                    'Berufserfahrung → Kontext für Interviewvorbereitung',
                    'Zusammenfassung → kompakter Kontext für den Assistenten',
                    'Wunschstellen → präzisere Stellenanalysen',
                  ].map(item => (
                    <li key={item} className="flex gap-2 items-start">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-stone-500">
                Im Chat aktivierst du den Kontext über die Schalter über dem Eingabefeld.{' '}
                <strong>Farbig = aktiv</strong>.
              </p>
            </div>
          )}
          {tab === 'summary' && (
            <div className="space-y-3">
              <p>
                Die <strong className="text-stone-900">KI-Zusammenfassung</strong> fasst dein Profil
                anonymisiert und strukturiert zusammen — kein Name, keine persönlichen Daten, nur
                berufliche Stärken und Erfahrung.
              </p>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <p className="font-semibold text-emerald-900">Ablauf</p>
                <ul className="space-y-1.5 text-sm">
                  {[
                    'Sprache wählen (DE oder EN)',
                    'Auf „Zusammenfassung erstellen" klicken',
                    'KI verarbeitet Profil + hochgeladenen CV im Hintergrund',
                    'Ergebnis als Modal öffnen, lesen, ggf. anpassen, speichern',
                  ].map((step, i) => (
                    <li key={step} className="flex gap-2 items-start">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p>
                DE und EN sind <strong className="text-stone-900">unabhängig</strong> — die Erstellung
                einer Sprache löst die andere nicht automatisch aus. Du entscheidest, welche Sprache du
                brauchst.
              </p>
              <p className="text-xs text-stone-500">
                Tipp: Erstelle DE für deutschsprachige und EN für internationale Bewerbungen.
              </p>
            </div>
          )}
          {tab === 'jobs' && (
            <div className="space-y-3">
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="font-semibold text-amber-900">Wunschstellen sind entscheidend</p>
                  <p className="mt-1 text-sm">
                    Die Stellenanalyse im Chat vergleicht eine Jobanzeige direkt mit deinen
                    Wunschstellen — so bekommst du eine präzise Passgenauigkeit statt einer
                    generischen Einschätzung.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  'Bis zu 3 Wunschstellen speichern',
                  'Stellentitel ist Pflicht — Unternehmen und Beschreibung optional',
                  'Die Beschreibung fließt direkt in die Jobanalyse ein',
                  'Du kannst im Chat eine Wunschstelle als aktive Referenz wählen',
                ].map(item => (
                  <li key={item} className="flex gap-2 items-start">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'privacy' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
                <p className="font-semibold text-stone-900">Was wird anonymisiert?</p>
                <p>
                  Die KI-Zusammenfassung wird ohne deinen Namen, deine Adresse oder andere direkt
                  identifizierende Angaben erstellt. Der Assistent erhält nur berufliche Fakten.
                </p>
              </div>
              <p>
                Dein hochgeladener <strong className="text-stone-900">CV-Rohtext</strong> wird sicher
                auf dem Server gespeichert und nur für die Zusammenfassungs-Generierung und die
                PDF-Erkennung verwendet — er erscheint nicht direkt im Chat.
              </p>
              <p>
                Du kannst jederzeit alle Karriereprofil-Daten über den Button{' '}
                <strong className="text-stone-900">„Alle Daten löschen"</strong> oben auf der Seite
                vollständig entfernen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SummaryModal ─────────────────────────────────────────────────────────────

function SummaryModal({
  lang,
  initialText,
  onSave,
  onClose,
  saving,
}: {
  lang: 'de' | 'en'
  initialText: string
  onSave: (text: string) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [text, setText] = useState(initialText)

  const langLabel = lang === 'de' ? 'Deutsch' : 'English'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-stone-300/40 bg-white shadow-2xl max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              KI-Zusammenfassung{' '}
              <span className="ml-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">
                {langLabel}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">Anonym — kein Name, nur berufliche Stärken</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1 border-b border-stone-200 px-4 pt-2">
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={[
              'flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
              mode === 'preview'
                ? 'border-b-2 border-violet-600 text-violet-700'
                : 'text-stone-500 hover:text-stone-900',
            ].join(' ')}
          >
            <Eye size={13} />
            Vorschau
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={[
              'flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
              mode === 'edit'
                ? 'border-b-2 border-violet-600 text-violet-700'
                : 'text-stone-500 hover:text-stone-900',
            ].join(' ')}
          >
            <Edit3 size={13} />
            Bearbeiten
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {mode === 'preview' ? (
            text.trim() ? (
              renderSummaryMarkdown(text)
            ) : (
              <p className="text-sm text-stone-400 italic">Kein Inhalt vorhanden.</p>
            )
          ) : (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(text)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DeleteConfirmModal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  onConfirm,
  onClose,
  busy,
}: {
  onConfirm: () => Promise<void>
  onClose: () => void
  busy: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-red-200 bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Karriereprofil löschen?</h2>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Alle gespeicherten Daten werden unwiderruflich gelöscht: Basis-Infos, Skills,
                Berufserfahrung, Ausbildung, Sprachen, CV und Zusammenfassungen.
              </p>
              <p className="mt-2 text-sm font-medium text-red-700">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onConfirm()}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Ja, alles löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── LearningInsightsPanel ───────────────────────────────────────────────────

function LearningInsightsPanel() {
  const { getToken, isSignedIn } = useAuth()
  const [rows, setRows] = useState<LearningInsightRow[]>([])
  const [applications, setApplications] = useState<JobApplicationApi[]>([])
  const [filterAppId, setFilterAppId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setRows([])
      setApplications([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const token = await getToken()
      if (!token) {
        setRows([])
        setApplications([])
        return
      }
      const [data, apps] = await Promise.all([
        fetchLearningInsights(token, {
          applicationId: filterAppId.trim() || undefined,
        }),
        fetchJobApplications(token),
      ])
      setApplications(apps)
      setRows(data.filter(r => !r.resolved))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erkenntnisse konnten nicht geladen werden')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [getToken, isSignedIn, filterAppId])

  useEffect(() => {
    void load()
  }, [load])

  const onResolve = async (id: string) => {
    const token = await getToken()
    if (!token) return
    setBusyId(id)
    try {
      await resolveLearningInsight(token, id)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Konnte nicht speichern')
    } finally {
      setBusyId(null)
    }
  }

  const onPatchBlur = async (id: string, patch: { title?: string; content?: string }) => {
    const token = await getToken()
    if (!token) return
    try {
      await patchLearningInsight(token, id, patch)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    }
  }

  if (!isSignedIn) return null

  const grouped = new Map<string, LearningInsightRow[]>()
  for (const r of rows) {
    const key = r.jobApplicationId?.trim() || '_general'
    const list = grouped.get(key) ?? []
    list.push(r)
    grouped.set(key, list)
  }

  const appLabel = (id: string) => {
    if (id === '_general') return 'Allgemein (nicht an eine Bewerbung gebunden)'
    const a = applications.find(x => x.id === id)
    return a ? `${a.jobTitle} · ${a.company}` : `Bewerbung ${id}`
  }

  return (
    <section className="mb-8 rounded-xl border border-amber-500/35 bg-app-parchment p-5 shadow-landing text-stone-900">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-700" aria-hidden />
        <h2 className="text-sm font-semibold text-stone-900">To-dos aus Chats</h2>
      </div>
      <p className="mb-4 text-sm text-stone-700">
        Einträge aus Stellenanalyse und Interview-Coach — gebündelt pro Bewerbung.
        Bearbeite Titel oder Text; „Erledigt" entfernt den Eintrag aus dem KI-Kontext.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-stone-700">
          <span className="font-medium text-stone-800">Filter</span>
          <select
            value={filterAppId}
            onChange={e => setFilterAppId(e.target.value)}
            className="rounded-md border border-stone-400/50 bg-white px-2 py-1 text-xs text-stone-900"
          >
            <option value="">Alle offenen</option>
            {applications.map(a => (
              <option key={a.id} value={a.id}>
                {a.jobTitle} · {a.company}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Loader2 className="animate-spin" size={18} />
          Lade…
        </div>
      )}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!loading && !err && rows.length === 0 && (
        <p className="text-sm text-stone-600">Noch keine offenen To-dos für diesen Filter.</p>
      )}
      {!loading && rows.length > 0 && (
        <div className="flex flex-col gap-5">
          {[...grouped.entries()].map(([gid, list]) => (
            <div key={gid}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-900/90">
                {appLabel(gid)}
              </p>
              <ul className="flex flex-col gap-2">
                {list.map(r => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-stone-400/35 bg-white/90 px-3 py-2.5 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-amber-700">{r.category}</span>
                    </div>
                    <input
                      type="text"
                      defaultValue={r.title ?? ''}
                      placeholder="Kurztitel (optional)"
                      onBlur={e => {
                        const v = e.target.value.trim()
                        if (v !== (r.title ?? '').trim())
                          void onPatchBlur(r.id, { title: v || undefined })
                      }}
                      className="mb-2 w-full rounded border border-stone-300 px-2 py-1 text-xs text-stone-900"
                    />
                    <textarea
                      defaultValue={r.content}
                      rows={3}
                      onBlur={e => {
                        const v = e.target.value.trim()
                        if (v && v !== r.content.trim())
                          void onPatchBlur(r.id, { content: v })
                      }}
                      className="mb-2 w-full resize-y rounded border border-stone-300 px-2 py-1 text-sm text-stone-900"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void onResolve(r.id)}
                        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
                      >
                        {busyId === r.id ? '…' : 'Erledigt'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── CareerProfilePage ───────────────────────────────────────────────────────

export default function CareerProfilePage() {
  const { getToken, isLoaded } = useAuth()
  const mergedPendingCv = useRef(false)

  const [profile, setProfile] = useState<CareerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skillDraft, setSkillDraft] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [markSetupBusy, setMarkSetupBusy] = useState(false)
  const [dataEntryTab, setDataEntryTab] = useState<'pdf' | 'manual'>('manual')
  const [cvPasteForUploader, setCvPasteForUploader] = useState('')
  const [cvSummaryLoading, setCvSummaryLoading] = useState(false)
  const [summaryStale, setSummaryStale] = useState(false)
  const [pendingMergedDraftHint, setPendingMergedDraftHint] = useState(false)
  /** Which language the user wants to generate next */
  const [selectedGenLang, setSelectedGenLang] = useState<AnonymousSummaryLanguage>('de')
  /** Which language summary is open in the modal (null = closed) */
  const [summaryModalLang, setSummaryModalLang] = useState<'de' | 'en' | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [profileDeleted, setProfileDeleted] = useState(false)

  const load = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet')
      const p = await fetchProfile(token)
      setProfile(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }, [getToken, isLoaded])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!profile || mergedPendingCv.current) return
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem(PENDING_CV_KEY)
    } catch {
      return
    }
    if (!raw) return
    mergedPendingCv.current = true
    try {
      sessionStorage.removeItem(PENDING_CV_KEY)
      const draft = JSON.parse(raw) as ParsedCvData
      setProfile(mergeParsedDraftIntoProfile(profile, draft))
      setDataEntryTab('manual')
    } catch {
      /* ignore corrupt payload */
    }
  }, [profile])

  const saveProfilePatch = async (
    patch: Partial<CareerProfile>,
    opts?: { markSummaryStale?: boolean },
  ) => {
    const token = await getToken()
    if (!token || !profile) return
    setSaving(true)
    setError(null)
    try {
      await updateFullProfile(token, { ...profile, ...patch })
      await load()
      if (opts?.markSummaryStale !== false) setSummaryStale(true)
      setPendingMergedDraftHint(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const toggleGoal = (id: string) => {
    if (!profile) return
    const goals = profile.goals.includes(id)
      ? profile.goals.filter(g => g !== id)
      : [...profile.goals, id]
    void saveProfilePatch({ goals })
  }

  const handleMarkSetupComplete = async () => {
    if (!profile || !canMarkProfileSetupComplete(profile)) return
    const token = await getToken()
    if (!token) return
    setMarkSetupBusy(true)
    setError(null)
    try {
      const field = profile.field!.trim()
      const level = profile.level!.trim()
      await completeOnboarding(token, {
        field,
        fieldLabel:
          profile.fieldLabel?.trim() || FIELDS.find(f => f.value === field)?.label || field,
        level,
        levelLabel:
          profile.levelLabel?.trim() || LEVELS.find(l => l.value === level)?.label || level,
        currentRole: profile.currentRole?.trim() || undefined,
        goals: profile.goals,
      })
      await load()
      setSummaryStale(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Markieren fehlgeschlagen')
    } finally {
      setMarkSetupBusy(false)
    }
  }

  const addSkill = async () => {
    const t = skillDraft.trim()
    if (!t || !profile) return
    const next = [...profile.skills, t].slice(0, 30)
    setSkillDraft('')
    const token = await getToken()
    if (!token) return
    setSaving(true)
    try {
      await updateSkills(token, next)
      await load()
      setSummaryStale(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Skill speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const removeSkill = async (s: string) => {
    if (!profile) return
    const token = await getToken()
    if (!token) return
    setSaving(true)
    try {
      await updateSkills(token, profile.skills.filter(x => x !== s))
      await load()
      setSummaryStale(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Skill entfernen fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const saveParsedDraftToProfile = async (draft: ParsedCvData) => {
    if (!profile) return
    const token = await getToken()
    if (!token) throw new Error('Nicht angemeldet')
    setSaving(true)
    setError(null)
    try {
      const merged = mergeParsedDraftIntoProfile(profile, draft)
      await updateFullProfile(token, merged)
      await load()
      setDataEntryTab('manual')
      setSummaryStale(true)
      setPendingMergedDraftHint(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Speichern fehlgeschlagen'
      setError(msg)
      throw e
    } finally {
      setSaving(false)
    }
  }

  const applyManualDraftLocally = (draft: ParsedCvData) => {
    setProfile(prev => (prev ? mergeParsedDraftIntoProfile(prev, draft) : null))
    setDataEntryTab('manual')
    setPendingMergedDraftHint(true)
  }

  const persistFullProfileFromState = async () => {
    const token = await getToken()
    if (!token || !profile) return
    setSaving(true)
    setError(null)
    try {
      await updateFullProfile(token, profile)
      await load()
      setSummaryStale(true)
      setPendingMergedDraftHint(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  /** Generates summary for ONE language only — does not touch the other. */
  const generateSummaryForLang = async (lang: AnonymousSummaryLanguage) => {
    if (!profile || !hasEnoughForAnonymousCvSummary(profile)) return
    const token = await getToken()
    if (!token) return
    setCvSummaryLoading(true)
    setError(null)
    try {
      const text = await fetchAnonymousCvSummary(token, { language: lang })
      const patch =
        lang === 'de'
          ? { cvSummary: text, cvSummaryEn: profile.cvSummaryEn ?? null }
          : { cvSummary: profile.cvSummary ?? null, cvSummaryEn: text }
      await updateFullProfile(token, { ...profile, ...patch })
      await load()
      setSummaryStale(false)
      setSummaryModalLang(lang)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Zusammenfassung fehlgeschlagen')
    } finally {
      setCvSummaryLoading(false)
    }
  }

  const saveSummaryEdit = async (lang: 'de' | 'en', text: string) => {
    if (!profile) return
    setSaving(true)
    try {
      const patch =
        lang === 'de'
          ? { cvSummary: text || null, cvSummaryEn: profile.cvSummaryEn ?? null }
          : { cvSummary: profile.cvSummary ?? null, cvSummaryEn: text || null }
      await updateFullProfile(await getToken().then(t => t!), { ...profile, ...patch })
      await load()
      setSummaryModalLang(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const removeExperienceRow = (index: number) => {
    if (!profile) return
    const experience = (profile.experience ?? []).filter((_, j) => j !== index)
    void saveProfilePatch({ experience })
  }

  const removeEducationRow = (index: number) => {
    if (!profile) return
    const educationEntries = (profile.educationEntries ?? []).filter((_, j) => j !== index)
    void saveProfilePatch({ educationEntries })
  }

  const removeLanguageRow = (index: number) => {
    if (!profile) return
    const languages = (profile.languages ?? []).filter((_, j) => j !== index)
    void saveProfilePatch({ languages })
  }

  const addJob = async () => {
    const token = await getToken()
    if (!token || !jobTitle.trim()) return
    setSaving(true)
    try {
      await addTargetJob(token, {
        title: jobTitle.trim(),
        company: jobCompany.trim() || undefined,
        description: jobDesc.trim() || undefined,
      })
      setJobTitle('')
      setJobCompany('')
      setJobDesc('')
      await load()
      setSummaryStale(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stelle hinzufügen fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const delJob = async (id: string) => {
    const token = await getToken()
    if (!token) return
    setSaving(true)
    try {
      await removeTargetJob(token, id)
      await load()
      setSummaryStale(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stelle entfernen fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProfile = async () => {
    const token = await getToken()
    if (!token) return
    setDeleting(true)
    setError(null)
    try {
      await deleteCareerProfile(token)
      setProfileDeleted(true)
      setDeleteConfirmOpen(false)
      setProfile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen')
      setDeleteConfirmOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  // ─── render states ─────────────────────────────────────────────────────────

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-stone-400">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  if (profileDeleted) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <Trash2 className="h-8 w-8 text-stone-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-stone-900">Karriereprofil gelöscht</p>
          <p className="mt-1 text-sm text-stone-600">
            Alle Karrieredaten wurden entfernt. Du kannst jederzeit neu beginnen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setProfileDeleted(false)
            void load()
          }}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Neues Profil anlegen
        </button>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover"
        >
          Erneut laden
        </button>
      </div>
    )
  }

  if (!profile) return null

  const field = profile.field ?? ''
  const level = profile.level ?? ''
  const hasDeSummary = Boolean(profile.cvSummary?.trim())
  const hasEnSummary = Boolean(profile.cvSummaryEn?.trim())
  const canGenerate = hasEnoughForAnonymousCvSummary(profile)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
      {helpOpen && <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />}
      {deleteConfirmOpen && (
        <DeleteConfirmModal
          onConfirm={handleDeleteProfile}
          onClose={() => setDeleteConfirmOpen(false)}
          busy={deleting}
        />
      )}
      {summaryModalLang && (
        <SummaryModal
          lang={summaryModalLang}
          initialText={
            summaryModalLang === 'de' ? (profile.cvSummary ?? '') : (profile.cvSummaryEn ?? '')
          }
          onSave={text => saveSummaryEdit(summaryModalLang, text)}
          onClose={() => setSummaryModalLang(null)}
          saving={saving}
        />
      )}

      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex items-start gap-2">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-stone-50">Karriereprofil</h1>
              <p className="text-sm text-stone-400">
                Personalisiere den Assistenten — je vollständiger, desto präziser die Antworten.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="mt-1 shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-stone-700 hover:text-stone-100 transition-colors"
              aria-label="Hilfe & Hinweise"
            >
              <HelpCircle size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-500/40 px-3 py-2 text-xs font-medium text-red-400 hover:border-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
          >
            <Trash2 size={14} aria-hidden />
            Alle Daten löschen
          </button>
        </div>

        <LearningInsightsPanel />

        {/* ── CV-Import ──────────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-violet-500/35 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-1 text-sm font-semibold text-stone-900">Profil befüllen</h2>
          <p className="mb-4 text-sm text-stone-700">
            PDF hochladen → KI erkennt Felder automatisch und befüllt das Formular.
            Oder manuell direkt in den Abschnitten unten ausfüllen.
          </p>
          <div className="mb-4 flex rounded-lg border border-stone-400/40 bg-app-parchmentDeep p-0.5 text-xs font-semibold sm:text-sm">
            <button
              type="button"
              onClick={() => setDataEntryTab('pdf')}
              className={[
                'flex-1 rounded-md py-2.5 transition-colors',
                dataEntryTab === 'pdf'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900',
              ].join(' ')}
            >
              PDF hochladen &amp; erkennen
            </button>
            <button
              type="button"
              onClick={() => setDataEntryTab('manual')}
              className={[
                'flex-1 rounded-md py-2.5 transition-colors',
                dataEntryTab === 'manual'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900',
              ].join(' ')}
            >
              Manuell ausfüllen
            </button>
          </div>
          {dataEntryTab === 'pdf' && (
            <CvUploader
              getToken={getToken}
              fieldOptions={FIELDS}
              levelOptions={LEVELS}
              cvPasteText={cvPasteForUploader}
              onCvPasteTextChange={setCvPasteForUploader}
              onApplyParsed={saveParsedDraftToProfile}
              onManualAdjust={applyManualDraftLocally}
            />
          )}
          {dataEntryTab === 'manual' && (
            <p className="rounded-lg border border-stone-400/30 bg-app-parchmentDeep px-3 py-2.5 text-sm text-stone-700">
              Fülle die Abschnitte unten aus. Zum KI-gestützten Vorbelegen jederzeit auf{' '}
              <strong className="font-medium text-stone-900">PDF hochladen</strong> wechseln.
            </p>
          )}
        </section>

        {/* ── Onboarding status ──────────────────────────────────────── */}
        {profile.onboardingCompleted ? (
          <div className="mb-6 flex gap-3 rounded-xl border border-emerald-600/35 bg-app-parchment px-4 py-3 text-sm text-stone-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="font-semibold text-emerald-900">Profil eingerichtet</p>
              <p className="mt-1 leading-relaxed text-stone-800">
                Im Chat aktivierst du den Kontext über die Schalter über dem Eingabefeld —{' '}
                <strong className="font-medium">farbig = aktiv</strong>.
              </p>
            </div>
          </div>
        ) : canMarkProfileSetupComplete(profile) ? (
          <div className="mb-6 rounded-xl border border-amber-600/35 bg-app-parchment px-4 py-3 text-sm text-stone-900">
            <p className="font-semibold text-amber-950">Daten gespeichert — Setup noch offen</p>
            <p className="mt-2 leading-relaxed text-stone-800">
              Klicke unten, um das Profil als eingerichtet zu markieren — danach entfällt der
              Chat-Hinweis.
            </p>
            <button
              type="button"
              disabled={markSetupBusy || saving}
              onClick={() => void handleMarkSetupComplete()}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {markSetupBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Profil als eingerichtet markieren
            </button>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-amber-600/35 bg-app-parchment px-4 py-3 text-sm text-stone-900">
            <strong className="font-medium">Noch nicht eingerichtet:</strong> Wähle mindestens{' '}
            <strong className="font-medium">Berufsfeld</strong>,{' '}
            <strong className="font-medium">Level</strong> und ein{' '}
            <strong className="font-medium">Ziel</strong>, dann kannst du das Setup abschließen oder
            den{' '}
            <Link to="/onboarding" className="font-medium text-primary underline-offset-2 hover:underline">
              geführten Ablauf
            </Link>{' '}
            nutzen.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Pending merge hint ─────────────────────────────────────── */}
        {pendingMergedDraftHint && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-violet-500/35 bg-app-parchment px-4 py-3 text-sm text-stone-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              PDF-Daten wurden ins Formular übernommen — noch nicht gespeichert. Jetzt alle
              sichtbaren Felder auf dem Server speichern?
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void persistFullProfileFromState()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Jetzt speichern
            </button>
          </div>
        )}

        {/* ── Basis ──────────────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Basis</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-stone-700">Berufsfeld</span>
              <select
                value={field}
                onChange={e => {
                  const v = e.target.value
                  const label = FIELDS.find(f => f.value === v)?.label ?? ''
                  void saveProfilePatch({ field: v || null, fieldLabel: label || null })
                }}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              >
                <option value="">—</option>
                {FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-stone-700">Level</span>
              <select
                value={level}
                onChange={e => {
                  const v = e.target.value
                  const label = LEVELS.find(l => l.value === v)?.label ?? ''
                  void saveProfilePatch({ level: v || null, levelLabel: label || null })
                }}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              >
                <option value="">—</option>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </label>
            <label className="col-span-full block text-sm">
              <span className="text-stone-700">Aktuelle Rolle</span>
              <input
                type="text"
                value={profile.currentRole ?? ''}
                onChange={e => setProfile({ ...profile, currentRole: e.target.value })}
                onBlur={() => void saveProfilePatch({ currentRole: profile.currentRole?.trim() || null })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              />
            </label>
          </div>
          <p className="mt-4 text-xs font-medium text-stone-600">Ziele</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGoal(g.id)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  profile.goals.includes(g.id)
                    ? 'bg-primary text-white'
                    : 'border border-stone-400/40 bg-stone-200/70 text-stone-800 hover:bg-stone-300/60',
                ].join(' ')}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveProfilePatch({
                  field: field || null,
                  fieldLabel: FIELDS.find(f => f.value === field)?.label ?? profile.fieldLabel ?? null,
                  level: level || null,
                  levelLabel: LEVELS.find(l => l.value === level)?.label ?? profile.levelLabel ?? null,
                  currentRole: profile.currentRole?.trim() || null,
                })}
              className="inline-flex items-center justify-center rounded-xl border border-stone-400/50 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 shadow-sm hover:bg-stone-100 disabled:opacity-50"
            >
              Änderungen speichern
            </button>
          </div>
        </section>

        {/* ── Skills ─────────────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Skills (max. 30)</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {profile.skills.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full border border-stone-400/35 bg-stone-100/90 px-3 py-1 text-xs text-stone-800"
              >
                {s}
                <button type="button" onClick={() => void removeSkill(s)} className="text-stone-500 hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={skillDraft}
              onChange={e => setSkillDraft(e.target.value)}
              placeholder="Skill hinzufügen…"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), void addSkill())}
            />
            <button
              type="button"
              onClick={() => void addSkill()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus size={18} aria-hidden />
              Hinzufügen
            </button>
          </div>
        </section>

        {/* ── Berufserfahrung ─────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Berufserfahrung</h2>
          {(profile.experience ?? []).map((exp, i) => (
            <div key={i} className="mb-3 grid gap-2 rounded-lg border border-stone-300/40 p-3 md:grid-cols-2">
              <input
                placeholder="Titel"
                value={exp.title ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], title: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <input
                placeholder="Firma"
                value={exp.company ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], company: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <input
                placeholder="Dauer"
                value={exp.duration ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], duration: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <input
                placeholder="Kurzbeschreibung"
                value={exp.summary ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], summary: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="col-span-full rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <div className="col-span-full flex justify-end">
                <button
                  type="button"
                  onClick={() => removeExperienceRow(i)}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={14} aria-hidden />
                  Entfernen
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setProfile({ ...profile, experience: [...(profile.experience ?? []), emptyExp()] })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary-light/40"
            >
              <Plus size={18} aria-hidden />
              Eintrag hinzufügen
            </button>
            <button
              type="button"
              onClick={() => void saveProfilePatch({ experience: profile.experience ?? [] })}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Änderungen speichern
            </button>
          </div>
        </section>

        {/* ── Ausbildung ──────────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Ausbildung</h2>
          {(profile.educationEntries ?? []).map((ed, i) => (
            <div key={i} className="mb-3 grid gap-2 md:grid-cols-3">
              <input
                placeholder="Abschluss"
                value={ed.degree ?? ''}
                onChange={e => {
                  const next = [...(profile.educationEntries ?? [])]
                  next[i] = { ...next[i], degree: e.target.value }
                  setProfile({ ...profile, educationEntries: next })
                }}
                className="rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <input
                placeholder="Institution"
                value={ed.institution ?? ''}
                onChange={e => {
                  const next = [...(profile.educationEntries ?? [])]
                  next[i] = { ...next[i], institution: e.target.value }
                  setProfile({ ...profile, educationEntries: next })
                }}
                className="rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <input
                placeholder="Jahr"
                value={ed.year ?? ''}
                onChange={e => {
                  const next = [...(profile.educationEntries ?? [])]
                  next[i] = { ...next[i], year: e.target.value }
                  setProfile({ ...profile, educationEntries: next })
                }}
                className="rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <div className="flex items-center justify-end md:col-span-3">
                <button
                  type="button"
                  onClick={() => removeEducationRow(i)}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={14} aria-hidden />
                  Entfernen
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setProfile({
                  ...profile,
                  educationEntries: [...(profile.educationEntries ?? []), emptyEdu()],
                })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary-light/40"
            >
              <Plus size={18} aria-hidden />
              Eintrag hinzufügen
            </button>
            <button
              type="button"
              onClick={() => void saveProfilePatch({ educationEntries: profile.educationEntries ?? [] })}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Änderungen speichern
            </button>
          </div>
        </section>

        {/* ── Sprachen ────────────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Sprachen</h2>
          {(profile.languages ?? []).map((lang, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                placeholder="Sprache"
                value={lang.name ?? ''}
                onChange={e => {
                  const next = [...(profile.languages ?? [])]
                  next[i] = { ...next[i], name: e.target.value }
                  setProfile({ ...profile, languages: next })
                }}
                className="flex-1 rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <input
                placeholder="Level"
                value={lang.level ?? ''}
                onChange={e => {
                  const next = [...(profile.languages ?? [])]
                  next[i] = { ...next[i], level: e.target.value }
                  setProfile({ ...profile, languages: next })
                }}
                className="w-28 rounded border border-stone-300 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeLanguageRow(i)}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-stone-300 p-2 text-stone-600 hover:bg-red-50 hover:text-red-700"
                aria-label="Sprache entfernen"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setProfile({ ...profile, languages: [...(profile.languages ?? []), emptyLang()] })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary-light/40"
            >
              <Plus size={18} aria-hidden />
              Sprache hinzufügen
            </button>
            <button
              type="button"
              onClick={() => void saveProfilePatch({ languages: profile.languages ?? [] })}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Änderungen speichern
            </button>
          </div>
        </section>

        {/* ── KI-Zusammenfassung ─────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-violet-500/35 bg-app-parchment p-5 shadow-landing text-stone-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">KI-Zusammenfassung</h2>
              <p className="mt-1 text-xs text-stone-600">
                Anonymisierter Profil-Kontext für den Assistenten — kein Name, nur berufliche Stärken.
                Wird aus allen Profildaten + CV generiert.
              </p>
            </div>
            {summaryStale && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                <AlertTriangle size={11} />
                Veraltet
              </span>
            )}
          </div>

          {!canGenerate && (
            <div className="mb-4 rounded-lg border border-stone-300/40 bg-stone-100/60 px-3 py-2.5 text-xs text-stone-600">
              Mindestens Skills, eine Berufserfahrung oder hochgeladener CV erforderlich.
            </div>
          )}

          {/* Language selector + generate */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg border border-stone-400/45 bg-app-parchmentDeep p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedGenLang('de')}
                className={[
                  'rounded-md px-4 py-2 transition-colors',
                  selectedGenLang === 'de' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                ].join(' ')}
              >
                Deutsch (DE)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGenLang('en')}
                className={[
                  'rounded-md px-4 py-2 transition-colors',
                  selectedGenLang === 'en' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                ].join(' ')}
              >
                English (EN)
              </button>
            </div>
            <button
              type="button"
              onClick={() => void generateSummaryForLang(selectedGenLang)}
              disabled={saving || cvSummaryLoading || !canGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cvSummaryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {cvSummaryLoading ? 'Erstelle…' : 'Zusammenfassung erstellen'}
            </button>
          </div>

          {/* Status cards for DE / EN */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { lang: 'de' as const, label: 'Deutsch', exists: hasDeSummary },
                { lang: 'en' as const, label: 'English', exists: hasEnSummary },
              ] as const
            ).map(({ lang: l, label, exists }) => (
              <div
                key={l}
                className={[
                  'rounded-xl border p-4',
                  exists
                    ? 'border-emerald-300/60 bg-emerald-50/60'
                    : 'border-stone-300/40 bg-stone-100/40',
                ].join(' ')}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-stone-600">
                    {label}
                  </span>
                  {exists ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={13} />
                      Vorhanden
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">Noch nicht erstellt</span>
                  )}
                </div>
                {exists ? (
                  <button
                    type="button"
                    onClick={() => setSummaryModalLang(l)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/60 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                  >
                    <Eye size={13} />
                    Anzeigen &amp; bearbeiten
                  </button>
                ) : (
                  <p className="text-xs text-stone-500">
                    Sprache wählen &amp; „Zusammenfassung erstellen" klicken.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Wunschstellen ───────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-amber-500/35 bg-app-parchment p-5 shadow-landing text-stone-900">
          <div className="mb-4 flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Wunschstellen (max. 3)</h2>
              <p className="mt-1 text-xs text-amber-800 font-medium">
                Wichtig für die Stellenanalyse — je mehr Details, desto präziser der Match mit
                Jobanzeigen im Chat.
              </p>
            </div>
          </div>
          <div className="mb-4 space-y-3">
            {(profile.targetJobs ?? []).map((j: TargetJob) => (
              <div
                key={j.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-stone-300/40 bg-app-parchmentDeep p-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{j.title}</p>
                  {j.company && <p className="text-sm text-stone-700">{j.company}</p>}
                  {j.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-stone-600">{j.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void delJob(j.id)}
                  className="text-stone-500 hover:text-red-600"
                  aria-label="Entfernen"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          {(profile.targetJobs?.length ?? 0) < 3 && (
            <div className="grid gap-2 md:grid-cols-2">
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Stellentitel *"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <input
                value={jobCompany}
                onChange={e => setJobCompany(e.target.value)}
                placeholder="Unternehmen (optional)"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                placeholder="Stellenbeschreibung — fließt direkt in die Jobanalyse ein (optional)"
                rows={3}
                className="col-span-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void addJob()}
                disabled={saving || !jobTitle.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Hinzufügen
              </button>
            </div>
          )}
        </section>

        {saving && (
          <p className="flex items-center gap-2 pb-4 text-sm text-stone-600">
            <Loader2 className="animate-spin" size={16} />
            Speichern…
          </p>
        )}
      </div>
    </div>
  )
}
