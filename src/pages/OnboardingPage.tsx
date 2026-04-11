import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { completeOnboarding, uploadCv } from '../api/profileClient'
import { useCareerProfile } from '../hooks/useCareerProfile'
import LoadingScreen from '../components/LoadingScreen'

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

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { skipOnboarding, loading: profileLoading, needsOnboarding, reload, error: profileError } = useCareerProfile()

  const [step, setStep] = useState(1)
  const [field, setField] = useState('')
  const [level, setLevel] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [cvText, setCvText] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || profileLoading) return
    if (!isSignedIn) {
      navigate('/', { replace: true })
      return
    }
    if (!needsOnboarding && !profileError) {
      navigate('/chat', { replace: true })
    }
  }, [isLoaded, profileLoading, isSignedIn, needsOnboarding, profileError, navigate])

  if (!isLoaded || profileLoading) return <LoadingScreen />
  if (!isSignedIn) return <LoadingScreen />

  const fieldLabel = FIELDS.find(f => f.value === field)?.label ?? ''
  const levelLabel = LEVELS.find(l => l.value === level)?.label ?? ''

  const handleSkipAll = async () => {
    setFormError(null)
    setBusy(true)
    try {
      await skipOnboarding()
      await reload()
      navigate('/chat', { replace: true })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Überspringen fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const toggleGoal = (id: string) => {
    setGoals(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]))
  }

  const goNextFromStep1 = () => {
    setFormError(null)
    if (!field || !level) {
      setFormError('Bitte Berufsfeld und Level wählen.')
      return
    }
    setStep(2)
  }

  const goNextFromStep2 = () => {
    setFormError(null)
    if (goals.length === 0) {
      setFormError('Bitte mindestens ein Ziel wählen.')
      return
    }
    setStep(3)
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
      navigate('/chat', { replace: true })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const t = typeof reader.result === 'string' ? reader.result : ''
      setCvText(t.slice(0, 120_000))
    }
    reader.readAsText(file)
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
        <p className="mb-4 text-center text-sm text-slate-700">{profileError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Erneut versuchen
        </button>
        <button
          type="button"
          onClick={() => navigate('/chat', { replace: true })}
          className="mt-3 text-sm text-slate-500 hover:text-slate-700"
        >
          Zum Chat ohne Profil
        </button>
      </div>
    )
  }

  if (!needsOnboarding) return <LoadingScreen />

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-center text-sm font-medium text-slate-500">Schritt {step} von 3</p>
        <div className="mx-auto mt-2 h-1.5 max-w-md overflow-hidden rounded-full bg-slate-100">
          <div
            className={[
              'h-full rounded-full bg-primary transition-all duration-300',
              step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full',
            ].join(' ')}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-8">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Willkommen bei PrivatePrep</h1>
        <p className="mb-6 text-sm text-slate-600">
          Kurz einrichten — du kannst jederzeit überspringen oder Details später im Karriereprofil ergänzen.
        </p>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Berufsfeld</span>
              <select
                value={field}
                onChange={e => setField(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Bitte wählen…</option>
                {FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Erfahrungslevel</span>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Bitte wählen…</option>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Aktuelle Rolle (optional)</span>
              <input
                type="text"
                value={currentRole}
                onChange={e => setCurrentRole(e.target.value)}
                placeholder="z. B. Junior Frontend Developer"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              />
            </label>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              <button
                type="button"
                onClick={goNextFromStep1}
                disabled={busy}
                className="rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Weiter
              </button>
              <button
                type="button"
                onClick={handleSkipAll}
                disabled={busy}
                className="py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Überspringen
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-sm text-slate-600">Was möchtest du erreichen?</p>
            <div className="flex flex-col gap-2">
              {GOALS.map(g => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={goals.includes(g.id)}
                    onChange={() => toggleGoal(g.id)}
                    className="rounded border-slate-300 text-primary"
                  />
                  {g.label}
                </label>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              <button
                type="button"
                onClick={goNextFromStep2}
                disabled={busy}
                className="rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Weiter
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Zurück
              </button>
              <button
                type="button"
                onClick={handleSkipAll}
                disabled={busy}
                className="py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Überspringen
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-sm text-slate-600">
              Lebenslauf als Text einfügen oder .txt-Datei wählen (optional).
            </p>
            <textarea
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              rows={10}
              placeholder="CV-Text hier einfügen…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Datei (.txt)</span>
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={e => handleFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600"
              />
            </label>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              <button
                type="button"
                onClick={() => void finishOnboarding(true)}
                disabled={busy}
                className="rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Fertig
              </button>
              <button
                type="button"
                onClick={() => void finishOnboarding(false)}
                disabled={busy}
                className="py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Kein CV — zum Chat
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={busy}
                className="py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Zurück
              </button>
              <button
                type="button"
                onClick={handleSkipAll}
                disabled={busy}
                className="py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Alles überspringen
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
