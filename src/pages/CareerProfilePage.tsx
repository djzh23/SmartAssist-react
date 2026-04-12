import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
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
  fetchProfile,
  removeTargetJob,
  updateFullProfile,
  updateSkills,
  uploadCv,
} from '../api/profileClient'

function canMarkProfileSetupComplete(p: CareerProfile): boolean {
  return Boolean(p.field?.trim() && p.level?.trim() && p.goals.length > 0)
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
      const effField = (draft.field?.trim() || profile.field)?.trim() || profile.field
      const effLevel = (draft.level?.trim() || profile.level)?.trim() || profile.level
      const exFiltered =
        draft.experience?.filter(e => (e.title ?? '').trim() || (e.company ?? '').trim()) ?? []
      const eduFiltered =
        draft.education?.filter(e => (e.degree ?? '').trim() || (e.institution ?? '').trim()) ?? []
      const langFiltered = draft.languages?.filter(l => (l.name ?? '').trim()) ?? []
      setProfile({
        ...profile,
        field: effField ?? profile.field,
        fieldLabel: FIELDS.find(f => f.value === effField)?.label ?? profile.fieldLabel,
        level: effLevel ?? profile.level,
        levelLabel: LEVELS.find(l => l.value === effLevel)?.label ?? profile.levelLabel,
        currentRole: draft.currentRole?.trim() || profile.currentRole,
        skills: draft.skills?.length ? draft.skills : profile.skills,
        experience: exFiltered.length > 0 ? exFiltered : profile.experience,
        educationEntries: eduFiltered.length > 0 ? eduFiltered : profile.educationEntries,
        languages: langFiltered.length > 0 ? langFiltered : profile.languages,
      })
    } catch {
      /* ignore corrupt payload */
    }
  }, [profile])

  const saveProfilePatch = async (patch: Partial<CareerProfile>) => {
    const token = await getToken()
    if (!token || !profile) return
    setSaving(true)
    setError(null)
    try {
      await updateFullProfile(token, { ...profile, ...patch })
      await load()
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CV speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stelle entfernen fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-slate-500">
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
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Karriereprofil</h1>
        <p className="mb-6 text-sm text-slate-600">
          Diese Daten kannst du in den Chat-Kontext einbinden (Schalter über dem Eingabefeld). Du bearbeitest hier
          dieselben Infos wie in der{' '}
          <Link to="/onboarding" className="font-medium text-primary hover:underline">
            geführten Einrichtung (3 Schritte)
          </Link>
          — nichts doppelt pflegen nötig.
        </p>

        {profile.onboardingCompleted ? (
          <div className="mb-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="font-semibold text-emerald-950">Profil eingerichtet</p>
              <p className="mt-1.5 leading-relaxed text-emerald-900/95">
                Das Setup ist abgehakt: der Chat zeigt keinen Einrichtungs-Hinweis mehr. Ob deine Daten beim Senden
                wirklich mit an den Assistenten gehen, siehst du im Chat an den <strong className="font-medium">Kontext</strong>
                -Schaltern — <strong className="font-medium">farbig = aktiv</strong> (z.&nbsp;B. Profil, Skills).
              </p>
            </div>
          </div>
        ) : canMarkProfileSetupComplete(profile) ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Daten gespeichert — Setup noch nicht abgeschlossen</p>
            <p className="mt-2 leading-relaxed text-amber-900/95">
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
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Basis</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600">Berufsfeld</span>
              <select
                value={field}
                onChange={e => {
                  const v = e.target.value
                  const label = FIELDS.find(f => f.value === v)?.label ?? ''
                  void saveProfilePatch({ field: v || null, fieldLabel: label || null })
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
              >
                <option value="">—</option>
                {FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Level</span>
              <select
                value={level}
                onChange={e => {
                  const v = e.target.value
                  const label = LEVELS.find(l => l.value === v)?.label ?? ''
                  void saveProfilePatch({ level: v || null, levelLabel: label || null })
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
              >
                <option value="">—</option>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </label>
            <label className="col-span-full block text-sm">
              <span className="text-slate-600">Aktuelle Rolle</span>
              <input
                type="text"
                value={profile.currentRole ?? ''}
                onChange={e => setProfile({ ...profile, currentRole: e.target.value })}
                onBlur={() => void saveProfilePatch({ currentRole: profile.currentRole?.trim() || null })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
              />
            </label>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">Ziele</p>
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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Skills (max. 30)</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {profile.skills.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                {s}
                <button type="button" onClick={() => void removeSkill(s)} className="text-slate-400 hover:text-red-600">
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
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), void addSkill())}
            />
            <button
              type="button"
              onClick={() => void addSkill()}
              className="rounded-lg bg-primary px-3 py-2 text-sm text-white hover:bg-primary-hover"
            >
              <Plus size={18} />
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Berufserfahrung</h2>
          {(profile.experience ?? []).map((exp, i) => (
            <div key={i} className="mb-3 grid gap-2 rounded-lg border border-slate-100 p-3 md:grid-cols-2">
              <input
                placeholder="Titel"
                value={exp.title ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], title: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                placeholder="Firma"
                value={exp.company ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], company: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                placeholder="Dauer"
                value={exp.duration ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], duration: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                placeholder="Kurzbeschreibung"
                value={exp.summary ?? ''}
                onChange={e => {
                  const next = [...(profile.experience ?? [])]
                  next[i] = { ...next[i], summary: e.target.value }
                  setProfile({ ...profile, experience: next })
                }}
                className="col-span-full rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setProfile({ ...profile, experience: [...(profile.experience ?? []), emptyExp()] })}
              className="text-sm text-primary hover:underline"
            >
              + Eintrag
            </button>
            <button
              type="button"
              onClick={() => void saveProfilePatch({ experience: profile.experience ?? [] })}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              Speichern
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Ausbildung</h2>
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
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                placeholder="Institution"
                value={ed.institution ?? ''}
                onChange={e => {
                  const next = [...(profile.educationEntries ?? [])]
                  next[i] = { ...next[i], institution: e.target.value }
                  setProfile({ ...profile, educationEntries: next })
                }}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                placeholder="Jahr"
                value={ed.year ?? ''}
                onChange={e => {
                  const next = [...(profile.educationEntries ?? [])]
                  next[i] = { ...next[i], year: e.target.value }
                  setProfile({ ...profile, educationEntries: next })
                }}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setProfile({
                  ...profile,
                  educationEntries: [...(profile.educationEntries ?? []), emptyEdu()],
                })}
              className="text-sm text-primary hover:underline"
            >
              + Eintrag
            </button>
            <button
              type="button"
              onClick={() => void saveProfilePatch({ educationEntries: profile.educationEntries ?? [] })}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              Speichern
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Sprachen</h2>
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
                className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                placeholder="Level"
                value={lang.level ?? ''}
                onChange={e => {
                  const next = [...(profile.languages ?? [])]
                  next[i] = { ...next[i], level: e.target.value }
                  setProfile({ ...profile, languages: next })
                }}
                className="w-28 rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setProfile({ ...profile, languages: [...(profile.languages ?? []), emptyLang()] })}
              className="text-sm text-primary hover:underline"
            >
              + Sprache
            </button>
            <button
              type="button"
              onClick={() => void saveProfilePatch({ languages: profile.languages ?? [] })}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              Speichern
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Lebenslauf (Text)</h2>
          <textarea
            value={profile.cvRawText ?? ''}
            onChange={e => setProfile({ ...profile, cvRawText: e.target.value })}
            rows={8}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void saveCv()}
            disabled={saving}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            CV speichern
          </button>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Wunschstellen (max. 3)</h2>
          <div className="mb-4 space-y-3">
            {(profile.targetJobs ?? []).map((j: TargetJob) => (
              <div
                key={j.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div>
                  <p className="font-medium text-slate-800">{j.title}</p>
                  {j.company && <p className="text-sm text-slate-600">{j.company}</p>}
                  {j.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{j.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void delJob(j.id)}
                  className="text-slate-400 hover:text-red-600"
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={jobCompany}
                onChange={e => setJobCompany(e.target.value)}
                placeholder="Unternehmen"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                placeholder="Stellenbeschreibung (optional)"
                rows={3}
                className="col-span-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={16} />
            Speichern…
          </p>
        )}
      </div>
    </div>
  )
}
