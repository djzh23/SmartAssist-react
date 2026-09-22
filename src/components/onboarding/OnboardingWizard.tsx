import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { CheckCircle2, FileText, Pencil, SkipForward } from 'lucide-react'
import AppCtaButton from '../ui/AppCtaButton'
import CvUploader from '../profile/CvUploader'
import CvPrivacyNotice from '../profile/CvPrivacyNotice'
import {
  completeOnboarding,
  fetchOnboardingDraft,
  fetchProfile,
  putOnboardingDraft,
  updateFullProfile,
  uploadCv,
  type ParsedCvData,
} from '../../api/profileClient'
import { CAREER_FIELDS, CAREER_LEVELS } from '../../config/careerOptions'
import { storeCachedCv } from '../../utils/cvSessionCache'
import '../../styles/landing.css'

const ANALYZE_PATH = '/analyze'

type WizardStep = 'step1' | 'step2' | 'step3' | 'success'

const selectCls =
  'w-full rounded-lg border border-app-border bg-app-surface/60 px-3 py-2.5 text-sm text-stone-100 focus:border-[#d97757] focus:outline-none focus:ring-1 focus:ring-[#d97757]/30'

const inputCls =
  'w-full rounded-lg border border-app-border bg-app-surface/60 px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:border-[#d97757] focus:outline-none focus:ring-1 focus:ring-[#d97757]/30'

interface Props {
  getToken: () => Promise<string | null>
  reload: () => Promise<void>
  skipOnboarding: () => Promise<void>
}

export default function OnboardingWizard({ getToken, reload, skipOnboarding }: Props) {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<WizardStep>('step1')
  const [field, setField] = useState('')
  const [level, setLevel] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [story, setStory] = useState('')
  const [cvText, setCvText] = useState('')
  const [cvStepChoice, setCvStepChoice] = useState<'pick' | 'pdf' | 'paste'>('pick')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const draftLoadedRef = useRef(false)

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
      } catch {
        // best-effort
      } finally {
        draftLoadedRef.current = true
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveDraft = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      await putOnboardingDraft(token, {
        field: field || undefined,
        level: level || undefined,
        currentRole: currentRole.trim() || undefined,
      })
    } catch {
      // best-effort
    }
  }, [getToken, field, level, currentRole])

  useEffect(() => {
    if (!draftLoadedRef.current) return
    const t = window.setTimeout(() => { void saveDraft() }, 600)
    return () => window.clearTimeout(t)
  }, [saveDraft])

  const fieldLabel = CAREER_FIELDS.find(f => f.value === field)?.label ?? ''
  const levelLabel = CAREER_LEVELS.find(l => l.value === level)?.label ?? ''

  const handleSkipAll = async () => {
    setFormError(null)
    setBusy(true)
    try {
      await skipOnboarding()
      await reload()
      navigate(ANALYZE_PATH, { replace: true })
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

  const persistStory = async (token: string) => {
    const trimmed = story.trim()
    if (!trimmed) return
    await updateFullProfile(token, { story: trimmed })
  }

  /**
   * Merges whatever the AI extracted from the CV into the career profile, additively (never wipes
   * a field the user already filled in step 1 unless the CV actually found something for it). This
   * is what makes "onboarding fills the career profile" true regardless of PDF upload vs. pasted text.
   */
  const mergeParsedCvIntoProfile = async (token: string, parsed: ParsedCvData) => {
    const experience = parsed.experience.filter(e => (e.title ?? '').trim() || (e.company ?? '').trim())
    const education = parsed.education.filter(e => (e.degree ?? '').trim() || (e.institution ?? '').trim())
    const languages = parsed.languages.filter(l => (l.name ?? '').trim())
    if (parsed.skills.length === 0 && experience.length === 0 && education.length === 0 && languages.length === 0) {
      return
    }

    const fresh = await fetchProfile(token)
    await updateFullProfile(token, {
      ...fresh,
      skills: parsed.skills.length > 0 ? parsed.skills : fresh.skills,
      experience: experience.length > 0 ? experience : fresh.experience,
      educationEntries: education.length > 0 ? education : fresh.educationEntries,
      languages: languages.length > 0 ? languages : fresh.languages,
    })
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
        goals: ['new_job'],
      })
      await persistStory(token)
      if (includeCv && cvText.trim()) {
        const registered = await uploadCv(token, cvText.trim())
        if (userId) {
          storeCachedCv(userId, {
            text: registered.extractedText,
            hash: registered.contentHash,
            length: registered.contentLength,
          })
        }
        await mergeParsedCvIntoProfile(token, registered.parsed)
      }
      await reload()
      setStep('success')
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
      const effFieldLabel = CAREER_FIELDS.find(f => f.value === effField)?.label ?? fieldLabel
      const effLevelLabel = CAREER_LEVELS.find(l => l.value === effLevel)?.label ?? levelLabel
      const effRole = (parsed.currentRole?.trim() || currentRole.trim()) || undefined

      await completeOnboarding(token, {
        field: effField,
        fieldLabel: effFieldLabel,
        level: effLevel,
        levelLabel: effLevelLabel,
        currentRole: effRole,
        goals: ['new_job'],
      })
      await persistStory(token)
      await mergeParsedCvIntoProfile(token, parsed)

      await reload()
      setStep('success')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const handleManualAdjustFromCv = (parsed: ParsedCvData) => {
    try {
      sessionStorage.setItem('privateprep_pending_cv_parsed', JSON.stringify(parsed))
    } catch { /* ignore */ }
    navigate('/career-profile', { replace: false })
  }

  const stepNumber = step === 'step1' ? 1 : step === 'step2' ? 2 : step === 'step3' ? 3 : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-app-canvas text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_520px_at_58%_-12%,rgba(217,119,6,0.18),transparent_60%),radial-gradient(900px_420px_at_24%_18%,rgba(56,189,248,0.08),transparent_58%),linear-gradient(135deg,#120c08_0%,#1a100a_45%,#17110d_100%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 landing-dot-grid opacity-[0.42]" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col">
        {stepNumber !== null && (
          <header className="border-b border-app-border bg-app-canvas/80 px-6 py-4 backdrop-blur-sm">
            <p className="text-center text-xs font-medium text-stone-500">
              Schritt {stepNumber} von 3
            </p>
            <div className="mx-auto mt-2 h-0.5 max-w-md overflow-hidden rounded-full bg-stone-800">
              <div
                className={[
                  'h-full rounded-full bg-[#d97757] transition-all duration-500',
                  stepNumber === 1 ? 'w-1/3' : stepNumber === 2 ? 'w-2/3' : 'w-full',
                ].join(' ')}
              />
            </div>
          </header>
        )}

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-8">
          {formError && stepNumber !== null && (
            <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {formError}
            </div>
          )}

          {step === 'step1' && (
            <div className="flex flex-1 flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-stone-100">Dein Profil</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Berufsfeld und Level. Grundlage für die Stellenanalyse.
                </p>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-300">Berufsfeld</span>
                <select value={field} onChange={e => setField(e.target.value)} className={selectCls}>
                  <option value="">Bitte wählen…</option>
                  {CAREER_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-300">Erfahrungslevel</span>
                <select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>
                  <option value="">Bitte wählen…</option>
                  {CAREER_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-300">
                  Aktuelle Rolle <span className="font-normal text-stone-500">(optional)</span>
                </span>
                <input
                  type="text"
                  value={currentRole}
                  onChange={e => setCurrentRole(e.target.value)}
                  placeholder="z. B. Teamassistenz, Pflegefachkraft, Vertriebsmitarbeiterin"
                  className={inputCls}
                />
              </label>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <AppCtaButton onClick={goNextFromStep1} disabled={busy}>Weiter</AppCtaButton>
                <button type="button" onClick={handleSkipAll} disabled={busy} className="py-2 text-sm text-stone-500 hover:text-stone-300">
                  Überspringen
                </button>
              </div>
            </div>
          )}

          {step === 'step2' && (
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-100">Deine Story</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Kurz, in eigenen Worten: Was du kannst, was du suchst. Optional, hilft der Analyse.
                </p>
              </div>
              <textarea
                value={story}
                onChange={e => setStory(e.target.value)}
                rows={10}
                placeholder="z. B. Fünf Jahre Kundenberatung im Einzelhandel, suche eine Stelle mit mehr Verantwortung im Innendienst."
                className={inputCls}
              />
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <AppCtaButton onClick={() => setStep('step3')} disabled={busy}>Weiter</AppCtaButton>
                <button type="button" onClick={() => setStep('step1')} disabled={busy} className="py-2 text-sm text-stone-500 hover:text-stone-300">
                  Zurück
                </button>
              </div>
            </div>
          )}

          {step === 'step3' && (
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-100">Lebenslauf</h2>
                <p className="mt-1 text-sm text-stone-400">
                  PDF hochladen oder Text einfügen. Für die Analyse später nötig.
                </p>
              </div>

              {cvStepChoice === 'pick' && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button type="button" onClick={() => setCvStepChoice('pdf')} disabled={busy}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-app-border bg-app-surface/50 px-4 py-6 text-sm font-medium text-stone-300 transition hover:border-[#d97757]/40 hover:bg-[rgba(217,119,87,0.10)] hover:text-stone-100">
                      <FileText size={22} className="text-stone-400" />
                      PDF hochladen
                    </button>
                    <button type="button" onClick={() => setCvStepChoice('paste')} disabled={busy}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-app-border bg-app-surface/50 px-4 py-6 text-sm font-medium text-stone-300 transition hover:border-[#d97757]/40 hover:bg-[rgba(217,119,87,0.10)] hover:text-stone-100">
                      <Pencil size={22} className="text-stone-400" />
                      Manuell eingeben
                    </button>
                    <button type="button" onClick={() => void finishOnboarding(false)} disabled={busy}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-stone-700 bg-stone-900/30 px-4 py-6 text-sm font-medium text-stone-500 transition hover:border-stone-600">
                      <SkipForward size={22} className="text-stone-600" />
                      Später
                    </button>
                  </div>
                  <button type="button" onClick={() => setStep('step2')} disabled={busy} className="mt-auto py-2 text-sm text-stone-500 hover:text-stone-300">
                    Zurück
                  </button>
                </>
              )}

              {cvStepChoice === 'pdf' && (
                <>
                  <button type="button" onClick={() => setCvStepChoice('pick')} className="self-start text-xs text-stone-500 hover:text-stone-300">
                    ← Zurück zur Auswahl
                  </button>
                  <CvUploader
                    getToken={getToken}
                    fieldOptions={CAREER_FIELDS}
                    levelOptions={CAREER_LEVELS}
                    cvPasteText={cvText}
                    onCvPasteTextChange={setCvText}
                    onApplyParsed={applyParsedCvAndFinish}
                    onManualAdjust={handleManualAdjustFromCv}
                  />
                </>
              )}

              {cvStepChoice === 'paste' && (
                <>
                  <button type="button" onClick={() => setCvStepChoice('pick')} className="self-start text-xs text-stone-500 hover:text-stone-300">
                    ← Zurück zur Auswahl
                  </button>
                  <textarea
                    value={cvText}
                    onChange={e => setCvText(e.target.value)}
                    rows={10}
                    placeholder="CV-Text hier einfügen…"
                    className={inputCls}
                  />
                  <CvPrivacyNotice />
                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    <AppCtaButton onClick={() => void finishOnboarding(true)} disabled={busy}>Fertig</AppCtaButton>
                    <button type="button" onClick={() => void finishOnboarding(false)} disabled={busy} className="py-2 text-sm text-stone-500 hover:text-stone-300">
                      Kein CV - weiter
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(217,119,87,0.10)] ring-1 ring-[#d97757]/30">
                <CheckCircle2 className="text-[#d97757]" size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-stone-100">Profil gespeichert</h2>
                <p className="text-sm text-stone-400">Als Nächstes: Stellenanzeige einfügen und analysieren.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <AppCtaButton size="lg" onClick={() => navigate(ANALYZE_PATH, { replace: true })}>
                  Zur Analyse
                </AppCtaButton>
                <button
                  type="button"
                  onClick={() => navigate('/career-profile', { replace: true })}
                  className="py-1 text-sm text-stone-500 hover:text-stone-300"
                >
                  Karriereprofil ansehen und ergänzen
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
