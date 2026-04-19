import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { CheckCircle2, Lightbulb, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
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
  fetchAnonymousCvSummary,
  fetchProfile,
  removeTargetJob,
  updateFullProfile,
  updateSkills,
  uploadCv,
  type AnonymousSummaryLanguage,
} from '../api/profileClient'
import CvUploader from '../components/profile/CvUploader'
import { ServerSyncControl } from '../components/ui/ServerSyncControl'

function canMarkProfileSetupComplete(p: CareerProfile): boolean {
  return Boolean(p.field?.trim() && p.level?.trim() && p.goals.length > 0)
}

function hasEnoughForAnonymousCvSummary(p: CareerProfile): boolean {
  if ((p.skills?.length ?? 0) > 0) return true
  if ((p.experience?.length ?? 0) > 0) return true
  return (p.cvRawText?.trim().length ?? 0) >= 50
}

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
        Einträge aus Stellenanalyse und Interview-Coach — gebündelt pro Bewerbung, wenn die Session verknüpft war.
        Bearbeite Titel oder Text; „Erledigt“ entfernt den Eintrag aus dem KI-Kontext.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-stone-700">
          <span className="font-medium text-stone-800">Filter</span>
          <select
            value={filterAppId}
            onChange={e => setFilterAppId(e.target.value)}
            className="rounded-md border border-stone-400/50 bg-white px-2 py-1 text-xs text-stone-900"
          >
            <option value="">Alle offenen + passende allgemeine</option>
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
  { value: 'entry', label: 'Berufseinsteiger (0-1 Jahre)' },
  { value: 'junior', label: 'Junior (1-3 Jahre)' },
  { value: 'mid', label: 'Mid-Level (3-5 Jahre)' },
  { value: 'senior', label: 'Senior (5-10 Jahre)' },
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

export default function CareerProfilePage() {
  const { getToken, isLoaded } = useAuth()
  const mergedPendingCv = useRef(false)
  const [profile, setProfile] = useState<CareerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileLastSyncedAt, setProfileLastSyncedAt] = useState<string | null>(null)
  const [skillDraft, setSkillDraft] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [markSetupBusy, setMarkSetupBusy] = useState(false)
  /** Oben: PDF/KI-Import oder klassisches Formular darunter */
  const [dataEntryTab, setDataEntryTab] = useState<'pdf' | 'manual'>('manual')
  const [cvPasteForUploader, setCvPasteForUploader] = useState('')
  const [cvSummaryLoading, setCvSummaryLoading] = useState(false)
  /** Server-Zusammenfassung passt evtl. nicht mehr zu geänderten Profildaten */
  const [summaryStale, setSummaryStale] = useState(false)
  /** PDF-Erkennung nur lokal ins Formular gemerged, noch kein PUT */
  const [pendingMergedDraftHint, setPendingMergedDraftHint] = useState(false)
  /** Welche Kurzfassung im UI betont wird (beide Felder sichtbar) */
  const [summaryViewLang, setSummaryViewLang] = useState<'de' | 'en'>('de')

  const load = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet')
      const p = await fetchProfile(token)
      setProfile(p)
      setProfileLastSyncedAt(new Date().toISOString())
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

  const saveCv = async () => {
    if (!profile) return
    const token = await getToken()
    if (!token) return
    setSaving(true)
    try {
      await uploadCv(token, profile.cvRawText ?? '')
      await load()
      setSummaryStale(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CV speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  /** Geparste CV-Daten ins Profil schreiben (Rohtext ist nach PDF-Upload schon auf dem Server). */
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

  const generateAnonymousCvSummaryForLang = async (lang: AnonymousSummaryLanguage) => {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Zusammenfassung fehlgeschlagen')
    } finally {
      setCvSummaryLoading(false)
    }
  }

  const saveSummaryTextsToServer = async () => {
    if (!profile) return
    await saveProfilePatch(
      {
        cvSummary: profile.cvSummary ?? null,
        cvSummaryEn: profile.cvSummaryEn ?? null,
      },
      { markSummaryStale: false },
    )
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

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-stone-400">
        <Loader2 className="animate-spin" size={28} />
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

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="mb-1 text-2xl font-semibold text-stone-50">Karriereprofil</h1>
            <p className="text-sm text-stone-400">
              Diese Daten kannst du in den Chat-Kontext einbinden (Schalter über dem Eingabefeld). Du bearbeitest hier
              dieselben Infos wie in der{' '}
              <Link to="/onboarding" className="font-medium text-primary hover:underline">
                geführten Einrichtung (3 Schritte)
              </Link>
              — nichts doppelt pflegen nötig.
            </p>
          </div>
          <ServerSyncControl
            variant="dark"
            className="shrink-0"
            onSync={() => void load()}
            syncing={loading}
            lastSyncedAt={profileLastSyncedAt}
          />
        </div>

        <LearningInsightsPanel />

        <section className="mb-8 rounded-xl border border-violet-500/35 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-1 text-sm font-semibold text-stone-900">Profil ausfüllen</h2>
          <p className="mb-4 text-sm text-stone-700">
            PDF: Wir speichern den extrahierten Rohtext auf dem Server; die erkannten Felder sind Vorschläge — du kannst
            im Formular unten ergänzen oder korrigieren und pro Abschnitt speichern. Manuell: Daten direkt eintragen;
            Auswahl in <strong className="font-medium text-stone-900">Basis</strong> speichert beim Ändern, Rolle beim
            Verlassen des Feldes.
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
              Nutze die Abschnitte <strong className="font-medium text-stone-900">Basis</strong>,{' '}
              <strong className="font-medium text-stone-900">Skills</strong>,{' '}
              <strong className="font-medium text-stone-900">Berufserfahrung</strong> usw. unten auf dieser Seite. Zum
              Vorbelegen per KI kannst du jederzeit auf <strong className="font-medium text-stone-900">PDF hochladen</strong>{' '}
              wechseln.
            </p>
          )}
        </section>

        {profile.onboardingCompleted ? (
          <div className="mb-6 flex gap-3 rounded-xl border border-emerald-600/35 bg-app-parchment px-4 py-3 text-sm text-stone-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="font-semibold text-emerald-900">Profil eingerichtet</p>
              <p className="mt-1.5 leading-relaxed text-stone-800">
                Das Setup ist abgehakt: der Chat zeigt keinen Einrichtungs-Hinweis mehr. Ob deine Daten beim Senden
                wirklich mit an den Assistenten gehen, siehst du im Chat an den <strong className="font-medium">Kontext</strong>
                -Schaltern — <strong className="font-medium">farbig = aktiv</strong> (z.&nbsp;B. Profil, Skills).
              </p>
            </div>
          </div>
        ) : canMarkProfileSetupComplete(profile) ? (
          <div className="mb-6 rounded-xl border border-amber-600/35 bg-app-parchment px-4 py-3 text-sm text-stone-900">
            <p className="font-semibold text-amber-950">Daten gespeichert — Setup noch nicht abgeschlossen</p>
            <p className="mt-2 leading-relaxed text-stone-800">
              Deine Eingaben sind schon auf dem Server. „Eingerichtet“ ist nur die Bestätigung, dass du das Onboarding
              nicht mehr brauchst (wie der letzte Schritt der{' '}
              <Link to="/onboarding" className="font-medium text-primary underline-offset-2 hover:underline">
                geführten Einrichtung
              </Link>
              ). Danach erscheint unten die grüne Box und der Chat-Hinweis entfällt.
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
            <strong className="font-medium">Berufsfeld</strong>, <strong className="font-medium">Level</strong> und ein{' '}
            <strong className="font-medium">Ziel</strong>, dann kannst du das Setup hier oder per{' '}
            <Link to="/onboarding" className="font-medium text-primary underline-offset-2 hover:underline">
              geführtem Ablauf
            </Link>{' '}
            abschließen.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {pendingMergedDraftHint && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-violet-500/35 bg-app-parchment px-4 py-3 text-sm text-stone-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Erkenntnis aus dem PDF wurde ins Formular übernommen — noch nicht auf dem Server. Mit „Jetzt
              synchronisieren“ werden alle sichtbaren Felder gespeichert (inkl. Ergänzungen).
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void persistFullProfileFromState()}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Jetzt synchronisieren
            </button>
          </div>
        )}

        {summaryStale && hasEnoughForAnonymousCvSummary(profile) && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Profil wurde geändert — die gespeicherte Kurz-Zusammenfassung für den Assistenten kann veraltet sein. Bitte
            unten bei „Anonyme Kurz-Zusammenfassung“ neu erzeugen (DE/EN).
          </div>
        )}

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
                  aria-label="Eintrag entfernen"
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
                  aria-label="Eintrag entfernen"
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

        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Lebenslauf &amp; Kurzfassung</h2>
          <p className="mb-4 text-xs text-stone-700">
            <strong className="font-medium text-stone-900">CV-Rohtext</strong> — extrahierter oder eingefügter
            Lebenslauf (wird für die KI-Erkennung genutzt).{' '}
            <strong className="font-medium text-stone-900">Anonyme Kurz-Zusammenfassung</strong> — für den Chat, wenn
            „CV“ im Kontext aktiv ist (ohne Namen); basiert auf allen Profildaten inkl. Rohtext.
          </p>

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600">CV-Rohtext</h3>
          <textarea
            value={profile.cvRawText ?? ''}
            onChange={e => setProfile({ ...profile, cvRawText: e.target.value })}
            rows={6}
            className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void saveCv()}
            disabled={saving || cvSummaryLoading}
            className="mb-8 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            CV-Rohtext speichern
          </button>

          <div className="mb-3 flex flex-col gap-3 border-t border-stone-300/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-600">
              Anonyme Kurz-Zusammenfassung
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-600">Anzeige</span>
              <div className="inline-flex rounded-lg border border-stone-400/45 bg-app-parchmentDeep p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSummaryViewLang('de')}
                  className={[
                    'rounded-md px-3 py-1.5 transition-colors',
                    summaryViewLang === 'de' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                  ].join(' ')}
                >
                  DE
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryViewLang('en')}
                  className={[
                    'rounded-md px-3 py-1.5 transition-colors',
                    summaryViewLang === 'en' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                  ].join(' ')}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
          <p className="mb-3 text-xs text-stone-700">
            {hasEnoughForAnonymousCvSummary(profile)
              ? 'Aus Skills, Berufserfahrung, Ausbildung, Sprachen und CV-Rohtext — jeweils für Deutsch oder Englisch neu erzeugen.'
              : 'Mindestens Skills, eine Berufserfahrung oder CV-Rohtext mit 50+ Zeichen eintragen.'}
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void generateAnonymousCvSummaryForLang('de')}
              disabled={saving || cvSummaryLoading || !hasEnoughForAnonymousCvSummary(profile)}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cvSummaryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              )}
              Zusammenfassung DE
            </button>
            <button
              type="button"
              onClick={() => void generateAnonymousCvSummaryForLang('en')}
              disabled={saving || cvSummaryLoading || !hasEnoughForAnonymousCvSummary(profile)}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cvSummaryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              )}
              Summary EN
            </button>
            <button
              type="button"
              onClick={() => void saveSummaryTextsToServer()}
              disabled={saving || cvSummaryLoading}
              className="inline-flex items-center justify-center rounded-xl border border-stone-400/50 bg-white px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-100 disabled:opacity-50"
            >
              Kurzfassungen speichern
            </button>
          </div>
          <label className="mb-1 block text-xs font-medium text-stone-700">
            {summaryViewLang === 'de' ? 'Deutsch (Chat-Kontext)' : 'English (profile)'}
          </label>
          <textarea
            value={summaryViewLang === 'de' ? (profile.cvSummary ?? '') : (profile.cvSummaryEn ?? '')}
            onChange={e => {
              const v = e.target.value
              if (summaryViewLang === 'de') setProfile({ ...profile, cvSummary: v || null })
              else setProfile({ ...profile, cvSummaryEn: v || null })
            }}
            rows={8}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </section>

        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Wunschstellen (max. 3)</h2>
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
                placeholder="Stellentitel"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <input
                value={jobCompany}
                onChange={e => setJobCompany(e.target.value)}
                placeholder="Unternehmen"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                placeholder="Stellenbeschreibung (optional)"
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
          <p className="flex items-center gap-2 text-sm text-stone-600">
            <Loader2 className="animate-spin" size={16} />
            Speichern…
          </p>
        )}
      </div>
    </div>
  )
}
