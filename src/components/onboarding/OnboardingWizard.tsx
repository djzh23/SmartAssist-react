import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, Pencil, SkipForward } from 'lucide-react'
import AppCtaButton from '../ui/AppCtaButton'
import CvUploader from '../profile/CvUploader'
import {
  completeOnboarding,
  fetchOnboardingDraft,
  fetchProfile,
  postCoachTourDone,
  putOnboardingDraft,
  updateFullProfile,
  uploadCv,
  type CareerProfile,
  type ParsedCvData,
} from '../../api/profileClient'
import OnboardingFeatureTour from './OnboardingFeatureTour'
import OnboardingCoachTour from './OnboardingCoachTour'
import '../../styles/landing.css'

// ─── Data constants ───────────────────────────────────────────────────────────

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

function postOnboardingPath(profile: CareerProfile): string {
  const hasTarget = profile.targetJobs.length > 0
  const cvOk = (profile.cvRawText ?? '').trim().length >= 80
  if (!hasTarget || !cvOk) return '/career-profile'
  if (profile.goals.some(g => g === 'new_job' || g === 'career_switch')) return '/applications'
  return '/chat'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 'welcome' | 'features' | 'step1' | 'step2' | 'step3' | 'success'

// ─── Shared select/input classes ──────────────────────────────────────────────

const selectCls =
  'w-full rounded-lg border border-app-border bg-app-surface/60 px-3 py-2.5 text-sm text-stone-100 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30'

const inputCls =
  'w-full rounded-lg border border-app-border bg-app-surface/60 px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  getToken: () => Promise<string | null>
  reload: () => Promise<void>
  skipOnboarding: () => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingWizard({ getToken, reload, skipOnboarding }: Props) {
  const navigate = useNavigate()

  // Wizard step state
  const [step, setStep] = useState<WizardStep>('welcome')
  const [showCoachTour, setShowCoachTour] = useState(false)

  // Form state
  const [field, setField] = useState('')
  const [level, setLevel] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [cvText, setCvText] = useState('')
  const [cvStepChoice, setCvStepChoice] = useState<'pick' | 'pdf' | 'paste'>('pick')

  // UI state
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successDest, setSuccessDest] = useState('/chat')

  // Draft loading guard — only enable debounced save after draft is fetched
  const draftLoadedRef = useRef(false)

  // ── Load draft on mount ──────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const token = await getToken()
      if (!token) {
        draftLoadedRef.current = true
        return
      }
      try {
        const draft = await fetchOnboardingDraft(token)
        if (draft.field) setField(draft.field)
        if (draft.level) setLevel(draft.level)
        if (draft.currentRole) setCurrentRole(draft.currentRole)
        if (draft.goals?.length) setGoals(draft.goals)
      } catch {
        // best-effort: proceed without draft
      } finally {
        draftLoadedRef.current = true
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Debounced draft save ─────────────────────────────────────────────────

  const saveDraft = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      await putOnboardingDraft(token, {
        field: field || undefined,
        level: level || undefined,
        currentRole: currentRole.trim() || undefined,
        goals: goals.length ? goals : undefined,
      })
    } catch {
      // best-effort
    }
  }, [getToken, field, level, currentRole, goals])

  useEffect(() => {
    if (!draftLoadedRef.current) return
    const hasData = field || level || currentRole || goals.length > 0
    if (!hasData) return
    const timer = setTimeout(() => { void saveDraft() }, 700)
    return () => clearTimeout(timer)
  }, [field, level, currentRole, goals, saveDraft])

  // ── Helpers ─────────────────────────────────────────────────────────────

  const fieldLabel = FIELDS.find(f => f.value === field)?.label ?? ''
  const levelLabel = LEVELS.find(l => l.value === level)?.label ?? ''

  const toggleGoal = (id: string) => {
    setGoals(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]))
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleSkipAll = async () => {
    setFormError(null)
    setBusy(true)
    try {
      await skipOnboarding()
      await reload()
      const t = await getToken()
      const p = t ? await fetchProfile(t) : null
      navigate(p ? postOnboardingPath(p) : '/career-profile', { replace: true })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Überspringen fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const goNextFromStep1 = () => {
    setFormError(null)
    if (!field || !level) {
      setFormError('Bitte Berufsfeld und Level wählen.')
      return
    }
    void saveDraft()
    setStep('step2')
  }

  const goNextFromStep2 = () => {
    setFormError(null)
    if (goals.length === 0) {
      setFormError('Bitte mindestens ein Ziel wählen.')
      return
    }
    void saveDraft()
    setStep('step3')
  }

  const finishOnboarding = async (includeCv: boolean) => {
    setFormError(null)
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Kein Anmelde-Token')

      await completeOnboarding(token, {
        field,
        fieldLabel,
        level,
        levelLabel,
        currentRole: currentRole.trim() || undefined,
        goals,
      })

      if (includeCv && cvText.trim()) {
        await uploadCv(token, cvText.trim())
      }

      await reload()
      const fresh = await fetchProfile(token)
      const dest = postOnboardingPath(fresh)
      setSuccessDest(dest)
      setStep('success')
      if (!fresh.onboardingCoachTourCompleted) setShowCoachTour(true)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const applyParsedCvAndFinish = async (parsed: ParsedCvData) => {
    setFormError(null)
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Kein Anmelde-Token')

      const effField = (parsed.field?.trim() || field).trim()
      const effLevel = (parsed.level?.trim() || level).trim()
      const effFieldLabel = FIELDS.find(f => f.value === effField)?.label ?? fieldLabel
      const effLevelLabel = LEVELS.find(l => l.value === effLevel)?.label ?? levelLabel
      const effRole = (parsed.currentRole?.trim() || currentRole.trim()) || undefined

      await completeOnboarding(token, {
        field: effField,
        fieldLabel: effFieldLabel,
        level: effLevel,
        levelLabel: effLevelLabel,
        currentRole: effRole,
        goals,
      })

      const fresh = await fetchProfile(token)
      await updateFullProfile(token, {
        ...fresh,
        field: effField,
        fieldLabel: effFieldLabel,
        level: effLevel,
        levelLabel: effLevelLabel,
        currentRole: effRole ?? fresh.currentRole,
        skills: parsed.skills.length > 0 ? parsed.skills : fresh.skills,
        experience:
          parsed.experience.filter(e => (e.title ?? '').trim() || (e.company ?? '').trim())
            .length > 0
            ? parsed.experience.filter(e => (e.title ?? '').trim() || (e.company ?? '').trim())
            : fresh.experience,
        educationEntries:
          parsed.education.filter(e => (e.degree ?? '').trim() || (e.institution ?? '').trim())
            .length > 0
            ? parsed.education.filter(e => (e.degree ?? '').trim() || (e.institution ?? '').trim())
            : fresh.educationEntries,
        languages:
          parsed.languages.filter(l => (l.name ?? '').trim()).length > 0
            ? parsed.languages.filter(l => (l.name ?? '').trim())
            : fresh.languages,
      })

      await reload()
      const freshAfter = await fetchProfile(token)
      const dest = postOnboardingPath(freshAfter)
      setSuccessDest(dest)
      setStep('success')
      if (!freshAfter.onboardingCoachTourCompleted) setShowCoachTour(true)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const handleManualAdjustFromCv = (parsed: ParsedCvData) => {
    try {
      sessionStorage.setItem('privateprep_pending_cv_parsed', JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
    navigate('/career-profile', { replace: false })
  }

  const handleCoachTourDone = () => {
    void (async () => {
      try {
        const token = await getToken()
        if (token) await postCoachTourDone(token)
      } catch {
        // best-effort: flag may not be set, but don't block navigation
      }
      setShowCoachTour(false)
    })()
  }

  // ── Derived ─────────────────────────────────────────────────────────────

  const stepNumber = step === 'step1' ? 1 : step === 'step2' ? 2 : step === 'step3' ? 3 : null
  const showProgress = stepNumber !== null

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-hidden bg-app-canvas text-stone-100">
      {/* Background — matches MainLayout shell */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_520px_at_58%_-12%,rgba(217,119,6,0.18),transparent_60%),radial-gradient(900px_420px_at_24%_18%,rgba(56,189,248,0.08),transparent_58%),linear-gradient(135deg,#120c08_0%,#1a100a_45%,#17110d_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 landing-dot-grid opacity-[0.42]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Progress header — steps 1-3 only */}
        {showProgress && (
          <header className="border-b border-app-border bg-app-canvas/80 px-6 py-4 backdrop-blur-sm">
            <p className="text-center text-xs font-medium text-stone-500">
              Schritt {stepNumber} von 3
            </p>
            <div className="mx-auto mt-2 h-0.5 max-w-md overflow-hidden rounded-full bg-stone-800">
              <div
                className={[
                  'h-full rounded-full bg-amber-500 transition-all duration-500',
                  stepNumber === 1 ? 'w-1/3' : stepNumber === 2 ? 'w-2/3' : 'w-full',
                ].join(' ')}
              />
            </div>
          </header>
        )}

        <main
          className={[
            'mx-auto flex w-full flex-1 flex-col px-6 py-8',
            step === 'welcome' || step === 'features' || step === 'success'
              ? 'max-w-xl'
              : 'max-w-lg',
          ].join(' ')}
        >
          {/* Form error banner (steps 1-3) */}
          {formError && showProgress && (
            <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {formError}
            </div>
          )}

          {/* ── Welcome ─────────────────────────────────────────────────── */}
          {step === 'welcome' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                  PrivatePrep
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-stone-100 sm:text-4xl">
                  Willkommen bei PrivatePrep
                </h1>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-stone-400">
                  Dein KI-Karrierecoach. Richten wir deinen Account ein — dauert etwa 2 Minuten.
                </p>
              </div>
              <div className="flex w-full max-w-xs flex-col gap-3">
                <AppCtaButton size="lg" onClick={() => setStep('features')}>
                  Los geht's
                </AppCtaButton>
                <button
                  type="button"
                  onClick={handleSkipAll}
                  disabled={busy}
                  className="py-2 text-sm text-stone-500 hover:text-stone-300 disabled:opacity-50"
                >
                  Überspringen – direkt zur App
                </button>
              </div>
            </div>
          )}

          {/* ── Feature tour ────────────────────────────────────────────── */}
          {step === 'features' && (
            <OnboardingFeatureTour
              onNext={() => setStep('step1')}
              onBack={() => setStep('welcome')}
            />
          )}

          {/* ── Step 1: Profil ──────────────────────────────────────────── */}
          {step === 'step1' && (
            <div className="flex flex-1 flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-stone-100">Dein Profil</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Berufsfeld und Level — Grundlage für präzise KI-Antworten.
                </p>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-300">Berufsfeld</span>
                <select value={field} onChange={e => setField(e.target.value)} className={selectCls}>
                  <option value="">Bitte wählen…</option>
                  {FIELDS.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-300">
                  Erfahrungslevel
                </span>
                <select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>
                  <option value="">Bitte wählen…</option>
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-300">
                  Aktuelle Rolle{' '}
                  <span className="font-normal text-stone-500">(optional)</span>
                </span>
                <input
                  type="text"
                  value={currentRole}
                  onChange={e => setCurrentRole(e.target.value)}
                  placeholder="z. B. Junior Frontend Developer"
                  className={inputCls}
                />
              </label>

              <div className="mt-auto flex flex-col gap-2 pt-6">
                <AppCtaButton onClick={goNextFromStep1} disabled={busy}>
                  Weiter
                </AppCtaButton>
                <button
                  type="button"
                  onClick={() => setStep('features')}
                  disabled={busy}
                  className="py-2 text-sm text-stone-500 hover:text-stone-300"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={handleSkipAll}
                  disabled={busy}
                  className="py-2 text-sm text-stone-500 hover:text-stone-300"
                >
                  Überspringen
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Ziele ───────────────────────────────────────────── */}
          {step === 'step2' && (
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-100">Deine Ziele</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Was möchtest du mit PrivatePrep erreichen?
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {GOALS.map(g => (
                  <label
                    key={g.id}
                    className={[
                      'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition',
                      goals.includes(g.id)
                        ? 'border-amber-500/40 bg-amber-500/10 text-stone-100'
                        : 'border-app-border bg-app-surface/40 text-stone-300 hover:border-amber-500/20 hover:bg-app-surface/60',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={goals.includes(g.id)}
                      onChange={() => toggleGoal(g.id)}
                      className="rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500/30"
                    />
                    {g.label}
                  </label>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-6">
                <AppCtaButton onClick={goNextFromStep2} disabled={busy}>
                  Weiter
                </AppCtaButton>
                <button
                  type="button"
                  onClick={() => setStep('step1')}
                  disabled={busy}
                  className="py-2 text-sm text-stone-500 hover:text-stone-300"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={handleSkipAll}
                  disabled={busy}
                  className="py-2 text-sm text-stone-500 hover:text-stone-300"
                >
                  Überspringen
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: CV ──────────────────────────────────────────────── */}
          {step === 'step3' && (
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-100">Lebenslauf</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Optional — PDF hochladen, Text einfügen oder überspringen.
                </p>
              </div>

              {cvStepChoice === 'pick' && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setCvStepChoice('pdf')}
                      disabled={busy}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-app-border bg-app-surface/50 px-4 py-6 text-sm font-medium text-stone-300 transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-stone-100 disabled:opacity-50"
                    >
                      <FileText size={22} className="text-stone-400" />
                      PDF hochladen
                    </button>
                    <button
                      type="button"
                      onClick={() => setCvStepChoice('paste')}
                      disabled={busy}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-app-border bg-app-surface/50 px-4 py-6 text-sm font-medium text-stone-300 transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-stone-100 disabled:opacity-50"
                    >
                      <Pencil size={22} className="text-stone-400" />
                      Manuell eingeben
                    </button>
                    <button
                      type="button"
                      onClick={() => void finishOnboarding(false)}
                      disabled={busy}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-stone-700 bg-stone-900/30 px-4 py-6 text-sm font-medium text-stone-500 transition hover:border-stone-600 hover:bg-stone-800/30 disabled:opacity-50"
                    >
                      <SkipForward size={22} className="text-stone-600" />
                      Überspringen
                    </button>
                  </div>
                  <div className="mt-auto flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('step2')}
                      disabled={busy}
                      className="py-2 text-sm text-stone-500 hover:text-stone-300"
                    >
                      Zurück
                    </button>
                  </div>
                </>
              )}

              {cvStepChoice === 'pdf' && (
                <>
                  <button
                    type="button"
                    onClick={() => setCvStepChoice('pick')}
                    className="self-start text-xs text-stone-500 hover:text-stone-300"
                  >
                    ← Zurück zur Auswahl
                  </button>
                  <CvUploader
                    getToken={getToken}
                    fieldOptions={FIELDS}
                    levelOptions={LEVELS}
                    cvPasteText={cvText}
                    onCvPasteTextChange={setCvText}
                    onApplyParsed={applyParsedCvAndFinish}
                    onManualAdjust={handleManualAdjustFromCv}
                  />
                </>
              )}

              {cvStepChoice === 'paste' && (
                <>
                  <button
                    type="button"
                    onClick={() => setCvStepChoice('pick')}
                    className="self-start text-xs text-stone-500 hover:text-stone-300"
                  >
                    ← Zurück zur Auswahl
                  </button>
                  <p className="text-sm text-stone-400">Lebenslauf als Text einfügen (optional).</p>
                  <textarea
                    value={cvText}
                    onChange={e => setCvText(e.target.value)}
                    rows={10}
                    placeholder="CV-Text hier einfügen…"
                    className={inputCls}
                  />
                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    <AppCtaButton onClick={() => void finishOnboarding(true)} disabled={busy}>
                      Fertig
                    </AppCtaButton>
                    <button
                      type="button"
                      onClick={() => void finishOnboarding(false)}
                      disabled={busy}
                      className="py-2 text-sm text-stone-500 hover:text-stone-300"
                    >
                      Kein CV – weiter
                    </button>
                    <button
                      type="button"
                      onClick={() => setCvStepChoice('pick')}
                      disabled={busy}
                      className="py-2 text-sm text-stone-500 hover:text-stone-300"
                    >
                      Zurück
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Success ─────────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
                <CheckCircle2 className="text-amber-400" size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-stone-100">Profil gespeichert!</h2>
                <p className="text-sm text-stone-400">
                  {showCoachTour
                    ? 'Einen Moment – zeigen wir dir kurz, was PrivatePrep für dich bereithält.'
                    : 'Alles eingerichtet — du kannst loslegen.'}
                </p>
              </div>
              {!showCoachTour && (
                <AppCtaButton size="lg" onClick={() => navigate(successDest, { replace: true })}>
                  App starten
                </AppCtaButton>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Coach tour overlay */}
      {showCoachTour && (
        <OnboardingCoachTour
          destination={successDest}
          onDone={handleCoachTourDone}
        />
      )}
    </div>
  )
}
