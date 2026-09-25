import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  AlertCircle,
  AlertTriangle,
  BookText,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Edit3,
  Eye,
  HelpCircle,
  Languages,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react'
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
  clearCvDerivedData,
  completeOnboarding,
  fetchAnonymousCvSummary,
  fetchProfile,
  removeTargetJob,
  updateFullProfile,
  updateSkills,
  type AnonymousSummaryLanguage,
} from '../api/profileClient'
import CvUploader from '../components/profile/CvUploader'
import CvMergeOrReplaceModal from '../components/career-profile/CvMergeOrReplaceModal'
import PageHeader from '../components/layout/PageHeader'
import AppCtaButton from '../components/ui/AppCtaButton'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import {
  MobileCareerProfileOverview,
  ProfileAreaCard,
  ProfileCompletenessRing,
  ProfileEmptyState,
  ProfileInsightModal,
  ProfileRecommendationCard,
  ProfileSectionNav,
  ProfileStatusCard,
  ProfileSummaryCard,
  formatDateTime,
} from '../components/career-profile/ProfileIntelligenceComponents'
import {
  calculateProfileCompleteness,
  getMissingProfileItems,
  getNextProfileAction,
  getProfileStatusLabel,
  getSectionCompletion,
  type CareerSectionKey,
} from '../utils/careerProfileIntelligence'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { CAREER_FIELDS, CAREER_GOALS, CAREER_LEVELS } from '../config/careerOptions'
import { isCachedCvReady, readCachedCv } from '../utils/cvSessionCache'
import { clearLocalCvDerivedState, PENDING_CV_PARSED_KEY } from '../utils/clearCvDerivedState'
import { useAppUi } from '../context/AppUiContext'

// ─── helpers ────────────────────────────────────────────────────────────────

function canMarkProfileSetupComplete(p: CareerProfile): boolean {
  return Boolean(p.field?.trim() && p.level?.trim() && p.goals.length > 0)
}

function hasEnoughForAnonymousCvSummary(p: CareerProfile, localCvText?: string | null): boolean {
  if ((p.skills?.length ?? 0) > 0) return true
  if ((p.experience?.length ?? 0) > 0) return true
  return (localCvText?.trim().length ?? 0) >= 50
}

function emptyExp(): WorkExperience {
  return { title: '', company: '', duration: '', summary: '' }
}

function emptyEdu(): Education {
  return { degree: '', institution: '', year: '' }
}

function emptyLang(): ProfileLanguage {
  return { name: '', level: '' }
}

const PENDING_CV_KEY = PENDING_CV_PARSED_KEY

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

/** Adds new skills to the existing list instead of replacing it; case-insensitive dedup. */
function mergeSkills(existing: string[], incoming: string[]): { merged: string[]; added: number } {
  const seen = new Set(existing.map(norm))
  const added: string[] = []
  for (const skill of incoming) {
    const key = norm(skill)
    if (!key || seen.has(key)) continue
    seen.add(key)
    added.push(skill)
  }
  return { merged: [...existing, ...added], added: added.length }
}

/** Adds new rows to the existing list instead of replacing it; dedups by the given key fields. */
function mergeRows<T>(existing: T[], incoming: T[], keyOf: (row: T) => string): { merged: T[]; added: number } {
  const seen = new Set(existing.map(keyOf))
  const added: T[] = []
  for (const row of incoming) {
    const key = keyOf(row)
    if (!key || seen.has(key)) continue
    seen.add(key)
    added.push(row)
  }
  return { merged: [...existing, ...added], added: added.length }
}

interface MergeResult {
  profile: CareerProfile
  addedSkills: number
  addedExperience: number
  addedEducation: number
  addedLanguages: number
}

/**
 * Adds newly parsed CV data (skills, experience, education, languages) to the existing profile
 * instead of replacing it, so a re-upload with an incomplete parse can never drop previously
 * saved entries. Field/level/currentRole (single values, not lists) still take the new value
 * when present, since those describe "now", not an accumulating history.
 */
function mergeParsedDraftIntoProfile(profile: CareerProfile, draft: ParsedCvData): MergeResult {
  const effField = (draft.field?.trim() || profile.field)?.trim() || profile.field
  const effLevel = (draft.level?.trim() || profile.level)?.trim() || profile.level
  const exIncoming =
    draft.experience?.filter(e => (e.title ?? '').trim() || (e.company ?? '').trim()) ?? []
  const eduIncoming =
    draft.education?.filter(e => (e.degree ?? '').trim() || (e.institution ?? '').trim()) ?? []
  const langIncoming = draft.languages?.filter(l => (l.name ?? '').trim()) ?? []

  const skills = mergeSkills(profile.skills ?? [], draft.skills ?? [])
  const experience = mergeRows(
    profile.experience ?? [],
    exIncoming,
    e => `${norm(e.title)}|${norm(e.company)}`,
  )
  const educationEntries = mergeRows(
    profile.educationEntries ?? [],
    eduIncoming,
    e => `${norm(e.degree)}|${norm(e.institution)}`,
  )
  const languages = mergeRows(
    profile.languages ?? [],
    langIncoming,
    l => norm(l.name),
  )

  return {
    profile: {
      ...profile,
      field: effField ?? null,
      fieldLabel: CAREER_FIELDS.find(f => f.value === effField)?.label ?? profile.fieldLabel,
      level: effLevel ?? null,
      levelLabel: CAREER_LEVELS.find(l => l.value === effLevel)?.label ?? profile.levelLabel,
      currentRole: draft.currentRole?.trim() || profile.currentRole,
      skills: skills.merged,
      experience: experience.merged,
      educationEntries: educationEntries.merged,
      languages: languages.merged,
    },
    addedSkills: skills.added,
    addedExperience: experience.added,
    addedEducation: educationEntries.added,
    addedLanguages: languages.added,
  }
}

function describeMergeResult(result: MergeResult): string | null {
  const parts: string[] = []
  if (result.addedExperience > 0) parts.push(`${result.addedExperience} Erfahrung${result.addedExperience === 1 ? '' : 'en'}`)
  if (result.addedEducation > 0) parts.push(`${result.addedEducation} Ausbildungseintrag${result.addedEducation === 1 ? '' : 'e'}`)
  if (result.addedSkills > 0) parts.push(`${result.addedSkills} Skill${result.addedSkills === 1 ? '' : 's'}`)
  if (result.addedLanguages > 0) parts.push(`${result.addedLanguages} Sprache${result.addedLanguages === 1 ? '' : 'n'}`)

  if (parts.length === 0) return 'Übernommen. Alle Einträge aus dem neuen CV waren bereits in deinem Profil vorhanden.'
  return `Übernommen: ${parts.join(', ')} neu hinzugefügt. Bestehende Einträge bleiben erhalten.`
}

/** True once the profile has CV-derived data that a new upload could accidentally mix with. */
function hasExistingCvData(profile: CareerProfile): boolean {
  return (
    (profile.skills?.length ?? 0) > 0 ||
    (profile.experience?.length ?? 0) > 0 ||
    (profile.educationEntries?.length ?? 0) > 0 ||
    (profile.languages?.length ?? 0) > 0
  )
}

/**
 * Replaces skills, experience, education and languages with the new CV's data instead of adding
 * to the old ones — for a deliberate career pivot (e.g. software development -> nursing), where
 * merging the two would produce an incoherent profile the analysis would then read from.
 */
function replaceParsedDraftIntoProfile(profile: CareerProfile, draft: ParsedCvData): CareerProfile {
  const effField = (draft.field?.trim() || profile.field)?.trim() || profile.field
  const effLevel = (draft.level?.trim() || profile.level)?.trim() || profile.level

  return {
    ...profile,
    field: effField ?? null,
    fieldLabel: CAREER_FIELDS.find(f => f.value === effField)?.label ?? profile.fieldLabel,
    level: effLevel ?? null,
    levelLabel: CAREER_LEVELS.find(l => l.value === effLevel)?.label ?? profile.levelLabel,
    currentRole: draft.currentRole?.trim() || profile.currentRole,
    skills: draft.skills ?? [],
    experience: draft.experience?.filter(e => (e.title ?? '').trim() || (e.company ?? '').trim()) ?? [],
    educationEntries: draft.education?.filter(e => (e.degree ?? '').trim() || (e.institution ?? '').trim()) ?? [],
    languages: draft.languages?.filter(l => (l.name ?? '').trim()) ?? [],
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
            <h4 key={i} className="mt-3 mb-1 text-xs font-bold uppercase tracking-wide text-[#b45539]">
              {line.slice(4)}
            </h4>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="mt-4 mb-1 text-sm font-bold text-stone-900">
              {line.slice(3)}
            </h3>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="mt-4 mb-2 text-base font-bold text-stone-950">
              {line.slice(2)}
            </h2>
          )
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#faf7f0]0" aria-hidden />
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
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-400/40 bg-app-parchment shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-400/25 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">Karriereprofil - Hilfe</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-app-parchmentDeep hover:text-stone-900"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-1 border-b border-stone-400/25 px-4 pt-3">
          {HELP_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
                tab === t.id
                  ? 'border-b-2 border-[#d97757] text-[#b45539]'
                  : 'text-stone-600 hover:text-stone-900',
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
                Das <strong className="text-stone-900">Karriereprofil</strong> ist die Grundlage jeder
                Analyse. Je vollständiger es ist, desto genauer vergleicht die Stellenanalyse deinen
                Lebenslauf mit einer Stellenausschreibung.
              </p>
              <div className="rounded-xl border border-[rgba(217,119,87,0.25)] bg-[rgba(217,119,87,0.10)] p-4 space-y-2">
                <p className="font-semibold text-[#1a1613]">Was wird verwendet?</p>
                <ul className="space-y-1">
                  {[
                    'Berufsfeld & Level → Grundlage aller Analysen',
                    'Skills → Skill-Lückenanalyse in der Stellenanalyse',
                    'Berufserfahrung → Formulierungsvorschläge für den Report',
                    'Zusammenfassung → kompakter Kontext für die KI',
                    'Wunschstellen → präzisere Stellenanalysen',
                  ].map(item => (
                    <li key={item} className="flex gap-2 items-start">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#faf7f0]0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-stone-600">
                Die Stellenanalyse findest du unter{' '}
                <strong>Analysieren</strong> in der Navigation.
              </p>
            </div>
          )}
          {tab === 'summary' && (
            <div className="space-y-3">
              <p>
                Die <strong className="text-stone-900">KI-Zusammenfassung</strong> soll berufliche
                Fakten als Fließtext fassen. Die Anweisung an das Modell lautet: keine Namen,
                Adressen oder Kontaktdaten ausgeben. Das ist eine Prompt-Regel, kein Beweis dass
                nichts Persönliches ankommt.
              </p>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <p className="font-semibold text-emerald-900">Ablauf</p>
                <ul className="space-y-1.5 text-sm">
                  {[
                    'Sprache wählen (DE oder EN)',
                    'Auf „Zusammenfassung erstellen" klicken',
                    'KI verarbeitet Profil plus Lebenslauf-Text (einmalig an Groq)',
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
                DE und EN sind <strong className="text-stone-900">unabhängig</strong> - die Erstellung
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
              <div className="flex gap-3 rounded-xl border border-[rgba(217,119,87,0.28)] bg-[#faf7f0] p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#b45539]" />
                <div>
                  <p className="font-semibold text-[#1a1613]">Wunschstellen halten fest, wonach du suchst</p>
                  <p className="mt-1 text-sm">
                    Speichere Positionen, auf die du dich bewerben möchtest, als Übersicht in deinem
                    Profil.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  'Bis zu 3 Wunschstellen speichern',
                  'Stellentitel ist Pflicht - Unternehmen und Beschreibung optional',
                  'Für die Stellenanalyse selbst fügst du den Anzeigentext direkt bei „Analysieren" ein',
                ].map(item => (
                  <li key={item} className="flex gap-2 items-start">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#faf7f0]0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'privacy' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-stone-400/25 bg-app-parchmentDeep p-4 space-y-2">
                <p className="font-semibold text-stone-900">Was die KI zu sehen bekommt</p>
                <p>
                  Für die Stellenanalyse und die optionale Profil-Zusammenfassung geht der Lebenslauf-Text
                  einmalig an Groq in den USA. Auf unseren Servern bleibt der Text nicht. Name und
                  Kontaktdaten solltest du vorher selbst entfernen. Ein Filter streicht zusätzlich erkannte
                  E-Mails, Telefonnummern und Links. Das ersetzt keine eigene Prüfung.
                </p>
              </div>
              <p>
                Der Lebenslauf-Text bleibt in diesem Browser. Auf dem Server speichern wir nur einen
                Prüfwert (Hash) und die Textlänge. Der Analysebericht liegt ebenfalls nur in diesem Browser.
              </p>
              <p>
                Profilfelder kannst du selbst ändern oder leeren. Eine vollständige Kontolöschung läuft über
                die Konto-Seite bei Clerk bzw. auf Anfrage, sobald die Kontaktadresse im Impressum steht.
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
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-stone-400/40 bg-app-parchment shadow-2xl max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-stone-400/25 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              KI-Zusammenfassung{' '}
              <span className="ml-1 rounded-md border border-[rgba(217,119,87,0.30)] bg-[rgba(217,119,87,0.10)] px-2 py-0.5 text-xs font-bold text-[#b45539]">
                {langLabel}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-stone-600">Anonym - kein Name, nur berufliche Stärken</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-app-parchmentDeep hover:text-stone-900"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1 border-b border-stone-400/25 px-4 pt-2">
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={[
              'flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
              mode === 'preview'
                ? 'border-b-2 border-[#d97757] text-[#b45539]'
                : 'text-stone-600 hover:text-stone-900',
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
                ? 'border-b-2 border-[#d97757] text-[#b45539]'
                : 'text-stone-600 hover:text-stone-900',
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
              <p className="text-sm text-stone-500 italic">Kein Inhalt vorhanden.</p>
            )
          ) : (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-stone-400/40 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-[#d97757]/50 focus:outline-none focus:ring-1 focus:ring-[#d97757]/30"
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stone-400/25 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-400/40 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-app-parchmentDeep"
          >
            Abbrechen
          </button>
          <AppCtaButton disabled={saving} loading={saving} onClick={() => void onSave(text)}>
            Speichern
          </AppCtaButton>
        </div>
      </div>
    </div>
  )
}

// ─── CareerProfilePage ───────────────────────────────────────────────────────

export default function CareerProfilePage() {
  const { getToken, isLoaded, userId } = useAuth()
  const { requestConfirm, showToast } = useAppUi()
  const mergedPendingCv = useRef(false)
  const desktopContentRef = useRef<HTMLDivElement | null>(null)

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
  const [mergeSummaryHint, setMergeSummaryHint] = useState<string | null>(null)
  /** A newly parsed CV that conflicts with existing profile data, awaiting the user's merge/replace choice. */
  const [pendingCvChoice, setPendingCvChoice] = useState<{ draft: ParsedCvData; origin: 'apply' | 'manual' } | null>(null)
  const [showStoryReminder, setShowStoryReminder] = useState(false)
  /** Which language the user wants to generate next */
  const [selectedGenLang, setSelectedGenLang] = useState<AnonymousSummaryLanguage>('de')
  /** Which language summary is open in the modal (null = closed) */
  const [summaryModalLang, setSummaryModalLang] = useState<'de' | 'en' | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [insightModalOpen, setInsightModalOpen] = useState(false)
  const [cvClearedNotice, setCvClearedNotice] = useState(false)
  const [activeSection, setActiveSection] = useState<CareerSectionKey>('overview')
  const [mobileSection, setMobileSection] = useState<CareerSectionKey>('overview')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

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
      setProfile(mergeParsedDraftIntoProfile(profile, draft).profile)
      setDataEntryTab('manual')
      setPendingMergedDraftHint(true)
    } catch {
      /* ignore corrupt payload */
    }
  }, [profile])

  useEffect(() => {
    if (!isDesktop || !desktopContentRef.current) return
    desktopContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeSection, isDesktop])

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
          profile.fieldLabel?.trim() || CAREER_FIELDS.find(f => f.value === field)?.label || field,
        level,
        levelLabel:
          profile.levelLabel?.trim() || CAREER_LEVELS.find(l => l.value === level)?.label || level,
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
    if (profile.skills.some(s => norm(s) === norm(t))) { setSkillDraft(''); return }
    const next = [...profile.skills, t]
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

  const applyParsedDraft = async (draft: ParsedCvData, mode: 'merge' | 'replace') => {
    if (!profile) return
    const token = await getToken()
    if (!token) throw new Error('Nicht angemeldet')
    setSaving(true)
    setError(null)
    try {
      if (mode === 'merge') {
        const result = mergeParsedDraftIntoProfile(profile, draft)
        await updateFullProfile(token, result.profile)
        setMergeSummaryHint(describeMergeResult(result))
      } else {
        await updateFullProfile(token, replaceParsedDraftIntoProfile(profile, draft))
        setMergeSummaryHint('Profil ersetzt: Skills, Erfahrung, Ausbildung und Sprachen kommen jetzt aus dem neuen Lebenslauf.')
        setShowStoryReminder(true)
      }
      await load()
      setDataEntryTab('manual')
      setSummaryStale(true)
      setPendingMergedDraftHint(false)
      setCvClearedNotice(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Speichern fehlgeschlagen'
      setError(msg)
      throw e
    } finally {
      setSaving(false)
    }
  }

  const applyManualDraftLocally = (draft: ParsedCvData, mode: 'merge' | 'replace') => {
    setProfile(prev => {
      if (!prev) return null
      return mode === 'merge' ? mergeParsedDraftIntoProfile(prev, draft).profile : replaceParsedDraftIntoProfile(prev, draft)
    })
    setDataEntryTab('manual')
    setPendingMergedDraftHint(true)
    if (mode === 'replace') setShowStoryReminder(true)
  }

  /** Entry point for "Alles übernehmen". Asks first when a new CV could mix with existing profile data. */
  const requestApplyParsed = async (draft: ParsedCvData) => {
    if (profile && hasExistingCvData(profile)) {
      setPendingCvChoice({ draft, origin: 'apply' })
      return
    }
    await applyParsedDraft(draft, 'merge')
  }

  /** Entry point for "Im Formular bearbeiten". Same conflict check as requestApplyParsed. */
  const requestManualAdjust = (draft: ParsedCvData) => {
    if (profile && hasExistingCvData(profile)) {
      setPendingCvChoice({ draft, origin: 'manual' })
      return
    }
    applyManualDraftLocally(draft, 'merge')
  }

  const resolveCvChoice = async (mode: 'merge' | 'replace') => {
    if (!pendingCvChoice) return
    const { draft, origin } = pendingCvChoice
    setPendingCvChoice(null)
    if (origin === 'apply') await applyParsedDraft(draft, mode)
    else applyManualDraftLocally(draft, mode)
  }

  const handleClearCvDerived = async () => {
    const confirmed = await requestConfirm({
      title: 'Lebenslauf-Daten löschen?',
      message:
        'Damit startest du mit einem leeren CV-Stand.\n\n'
        + 'Gelöscht werden:\n'
        + '• der Lebenslauf-Text in diesem Browser\n'
        + '• Skills, Erfahrung, Ausbildung und Sprachen aus dem letzten CV\n'
        + '• die KI-Zusammenfassung\n'
        + '• der Prüfwert auf dem Server\n\n'
        + 'Berufsfeld, Ziele und Wunschstellen bleiben.\n'
        + 'Ohne neuen Lebenslauf startet keine Analyse.',
      confirmLabel: 'Ja, Daten löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!confirmed) return
    const token = await getToken()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      await clearCvDerivedData(token)
      clearLocalCvDerivedState(userId)
      setPendingCvChoice(null)
      setMergeSummaryHint(null)
      setShowStoryReminder(false)
      setPendingMergedDraftHint(false)
      setCvPasteForUploader('')
      setSummaryStale(false)
      await load()
      setCvClearedNotice(true)
      setDataEntryTab('pdf')
      setActiveSection('basis')
      setMobileSection('basis')
      showToast('Lebenslauf-Daten sind gelöscht. Lade jetzt einen neuen Lebenslauf hoch.', 'success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen')
    } finally {
      setSaving(false)
    }
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

  /** Generates summary for ONE language only - does not touch the other. */
  const generateSummaryForLang = async (lang: AnonymousSummaryLanguage) => {
    if (!profile || !hasEnoughForAnonymousCvSummary(profile, readCachedCv(userId)?.text)) return
    const token = await getToken()
    if (!token) return
    setCvSummaryLoading(true)
    setError(null)
    try {
      const text = await fetchAnonymousCvSummary(token, {
        language: lang,
        cvText: readCachedCv(userId)?.text ?? null,
      })
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


  // ─── render states ─────────────────────────────────────────────────────────

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
        <p className="text-sm text-rose-400">{error}</p>
        <AppCtaButton type="button" onClick={() => void load()}>
          Erneut laden
        </AppCtaButton>
      </div>
    )
  }

  if (!profile) return null

  const field = profile.field ?? ''
  const level = profile.level ?? ''
  const hasDeSummary = Boolean(profile.cvSummary?.trim())
  const hasEnSummary = Boolean(profile.cvSummaryEn?.trim())
  const canGenerate = hasEnoughForAnonymousCvSummary(profile, readCachedCv(userId)?.text)
  const completeness = calculateProfileCompleteness(profile)
  const profileStatusLabel = getProfileStatusLabel(completeness)
  const missingItems = getMissingProfileItems(profile)
  const nextAction = getNextProfileAction(profile)
  const goalLabels = profile.goals
    .map(id => CAREER_GOALS.find(g => g.id === id)?.label)
    .filter((l): l is string => Boolean(l))
  const showProfileSetupBadge = profile.onboardingCompleted || canMarkProfileSetupComplete(profile)
  const sectionItems: Array<{ key: CareerSectionKey; label: string; state: 'complete' | 'attention' | 'incomplete' }> = [
    { key: 'overview', label: 'Übersicht', state: getSectionCompletion('overview', profile) },
    { key: 'basis', label: 'Basis', state: getSectionCompletion('basis', profile) },
    { key: 'skills', label: 'Skills', state: getSectionCompletion('skills', profile) },
    { key: 'experience', label: 'Erfahrung', state: getSectionCompletion('experience', profile) },
    { key: 'education', label: 'Ausbildung', state: getSectionCompletion('education', profile) },
    { key: 'languages', label: 'Sprachen', state: getSectionCompletion('languages', profile) },
    { key: 'summary', label: 'KI-Zusammenfassung', state: getSectionCompletion('summary', profile) },
    { key: 'targets', label: 'Wunschstellen', state: getSectionCompletion('targets', profile) },
  ]
  const completedSections = sectionItems.filter(item => item.state === 'complete').length
  const localCv = readCachedCv(userId)
  const cvOnThisBrowser = isCachedCvReady(localCv, profile.cvContentHash)
  const hasCv = Boolean(profile.cvContentHash?.trim()) || cvOnThisBrowser
  const canClearCvData = hasCv || hasExistingCvData(profile)
  const mobileIsDetail = mobileSection !== 'overview'
  const currentSection = isDesktop ? activeSection : mobileSection

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
      {helpOpen && <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />}
      <CvMergeOrReplaceModal
        open={pendingCvChoice !== null}
        draft={pendingCvChoice?.draft ?? null}
        onCancel={() => setPendingCvChoice(null)}
        onMerge={() => void resolveCvChoice('merge')}
        onReplace={() => void resolveCvChoice('replace')}
      />
      <ProfileInsightModal
        open={insightModalOpen}
        onClose={() => setInsightModalOpen(false)}
        missingItems={missingItems}
        goalLabels={goalLabels}
        nextAction={nextAction}
        onGoToSection={key => {
          setMobileSection(key)
          if (isDesktop) setActiveSection(key)
        }}
      />
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

      <StandardPageContainer className="w-full pt-3 pb-6 sm:py-6">
        <PageHeader
          pageKey="careerProfile"
          subtitle="Deine Datenbasis für die Stellenanalyse."
          className="mb-4 sm:mb-6"
          infoSlot={(
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="mt-1 shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-100"
              aria-label="Hilfe & Hinweise"
            >
              <HelpCircle size={18} />
            </button>
          )}
          actions={(
            <>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1.5 sm:items-center">
                <AppCtaButton
                  type="button"
                  size="sm"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5"
                >
                  <FileText size={14} aria-hidden />
                  <span className="hidden sm:inline">Profil als </span>PDF exportieren
                </AppCtaButton>
                <div className="min-w-0 sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Letzte Aktualisierung</p>
                  <p className="text-xs font-medium tabular-nums text-stone-200">{formatDateTime(profile.updatedAt)}</p>
                </div>
              </div>
            </>
          )}
        />

        {cvClearedNotice && !hasCv && !hasExistingCvData(profile) ? (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-600/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100"
          >
            <p className="font-semibold text-emerald-50">Lebenslauf-Daten sind leer</p>
            <p className="mt-1 leading-relaxed text-emerald-100/90">
              In diesem Profil und in diesem Browser liegt kein CV mehr. Skills, Erfahrung, Ausbildung
              und Sprachen aus dem alten Lebenslauf sind entfernt. Lade jetzt einen neuen Lebenslauf
              hoch. Ohne neuen CV startet keine Analyse.
            </p>
            <button
              type="button"
              onClick={() => setCvClearedNotice(false)}
              className="mt-2 text-xs font-semibold text-emerald-200 underline underline-offset-2 hover:text-white"
            >
              Hinweis schließen
            </button>
          </div>
        ) : null}

        <ProfileStatusCard>
          {/* Mobile: kompakter Ring, Kurz-Hinweis, Info-Modal */}
          <div className="lg:hidden">
            <div className="flex gap-3">
              <ProfileCompletenessRing value={completeness} compact />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Profilvollständigkeit</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-stone-100">{profileStatusLabel}</span>
                      {showProfileSetupBadge ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 size={13} className="shrink-0" aria-hidden />
                          Profil eingerichtet
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInsightModalOpen(true)}
                    className="shrink-0 rounded-lg p-1.5 text-[#d97757] transition hover:bg-white/5 hover:text-[#e89372]"
                    aria-label="Ziele und fehlende Angaben im Detail"
                  >
                    <AlertCircle size={22} strokeWidth={2} aria-hidden />
                  </button>
                </div>
                {missingItems.length > 0 ? (
                  <p className="mt-2 text-[11px] leading-snug text-stone-400">
                    <span className="text-stone-500">Fehlt noch: </span>
                    {missingItems.slice(0, 4).map(i => i.label).join(' · ')}
                    {missingItems.length > 4 ? ` … +${missingItems.length - 4}` : ''}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-emerald-400/90">Keine kritischen Lücken</p>
                )}
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)] lg:items-start">
            <div className="flex items-center gap-4">
              <ProfileCompletenessRing value={completeness} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Profilvollständigkeit</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-stone-100">{profileStatusLabel}</p>
                  {showProfileSetupBadge ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <CheckCircle2 size={14} aria-hidden />
                      Profil eingerichtet
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setInsightModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#d97757] hover:text-[#e89372]"
                >
                  <AlertCircle size={16} aria-hidden />
                  Details zu Zielen und Lücken
                </button>
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Fehlende Angaben</p>
              {missingItems.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-stone-200">
                  {missingItems.slice(0, 6).map(item => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e89372]" aria-hidden />
                      {item.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-emerald-300">Profil vollständig</p>
              )}
            </div>
          </div>
        </ProfileStatusCard>

        <MobileCareerProfileOverview>
          {!mobileIsDetail ? (
            <div className="rounded-2xl bg-[#1b120d]/78 p-3.5 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)]">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">Bereiche</p>
              <ProfileSectionNav
                items={sectionItems}
                activeSection={mobileSection}
                onSelect={setMobileSection}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMobileSection('overview')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#e89372] hover:text-[#f0ebe0]"
            >
              <ChevronRight className="rotate-180" size={14} />
              Zur Übersicht
            </button>
          )}
        </MobileCareerProfileOverview>

        {(!isDesktop || activeSection === 'overview') && (
        <div className="hidden gap-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="sticky top-[68px] space-y-3 rounded-2xl border border-[#3a332d] bg-[#232019] p-3.5">
            <ProfileSectionNav items={sectionItems} activeSection={activeSection} onSelect={setActiveSection} />
            <div className="rounded-xl border border-[#3a332d] bg-[#1a1613] p-3 text-xs text-[#cfc6b8]">
              <p className="font-semibold text-[#f0ebe0]">Warum ist das wichtig?</p>
              <p className="mt-1">
                Ein vollständiges Profil verbessert die Qualität der KI-Antworten und Empfehlungen.
              </p>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="mt-2 inline-flex items-center gap-1 font-semibold text-[#e89372] hover:text-[#f0ebe0]"
              >
                Mehr erfahren
                <ChevronRight size={12} />
              </button>
            </div>
          </aside>

          {activeSection === 'overview' ? (
            <section
              ref={desktopContentRef}
              className="min-h-[560px] space-y-4 rounded-2xl bg-[#1b120d]/78 p-4 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)] transition-[opacity,transform] duration-200 ease-out"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-stone-50">Übersicht</h2>
                  <p className="text-sm text-stone-400">Dein Profil auf einen Blick</p>
                </div>
                <AppCtaButton
                  type="button"
                  size="sm"
                  onClick={() => setActiveSection(nextAction.section)}
                  className="inline-flex items-center gap-1"
                >
                  Profil verbessern
                  <ChevronRight size={12} />
                </AppCtaButton>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {hasCv ? (
                  <div className="space-y-2">
                    <ProfileSummaryCard
                      title="Aktiver Lebenslauf"
                      value="Hochgeladen"
                      details={
                        cvOnThisBrowser
                          ? (profile.cvUploadedAt ? `Zuletzt aktualisiert ${formatDateTime(profile.cvUploadedAt)}` : 'Bereit für die Analyse')
                          : 'Auf diesem Geraet fehlt der Text. Einmal hochladen, dann gilt er fuer alle Tabs.'
                      }
                      icon={FileText}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleClearCvDerived()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50"
                    >
                      <Trash2 size={13} aria-hidden />
                      Lebenslauf-Daten löschen
                    </button>
                  </div>
                ) : (
                  <ProfileEmptyState
                    title="Kein aktiver Lebenslauf"
                    actionLabel="CV hochladen"
                    onAction={() => setActiveSection('basis')}
                  />
                )}
                <ProfileSummaryCard
                  title="Beruflicher Status"
                  value={profile.currentRole?.trim() || 'Keine Rolle gesetzt'}
                  details={`${profile.levelLabel ?? 'Kein Level'} · ${profile.fieldLabel ?? 'Kein Feld'}`}
                  icon={BriefcaseBusiness}
                />
                {(profile.targetJobs[0] || profile.goals[0]) ? (
                  <ProfileSummaryCard
                    title="Zielrichtung"
                    value={profile.targetJobs[0]?.title ?? 'Ziele vorhanden'}
                    details={profile.goals.slice(0, 2).join(' · ') || 'Keine Ziele'}
                    icon={Target}
                  />
                ) : (
                  <ProfileEmptyState
                    title="Noch keine Zielrichtung"
                    actionLabel="Ziele hinzufügen"
                    onAction={() => setActiveSection('targets')}
                  />
                )}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <p className="font-semibold text-stone-200">Profilbereiche</p>
                  <p className="text-stone-400">{completedSections} / {sectionItems.length} Bereiche abgeschlossen</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-[#d97757]" style={{ width: `${Math.round((completedSections / sectionItems.length) * 100)}%` }} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <ProfileAreaCard title="Skills" value={`${profile.skills.length} Einträge`} status={profile.skills.length > 0 ? 'gepflegt' : 'ausstehend'} icon={Sparkles} onClick={() => setActiveSection('skills')} />
                <ProfileAreaCard title="Erfahrung" value={`${profile.experience.length} Einträge`} status={profile.experience.length > 0 ? 'vorhanden' : 'fehlt'} icon={BriefcaseBusiness} onClick={() => setActiveSection('experience')} />
                <ProfileAreaCard title="Ausbildung" value={`${profile.educationEntries.length} Einträge`} status={profile.educationEntries.length > 0 ? 'vorhanden' : 'fehlt'} icon={GraduationCap} onClick={() => setActiveSection('education')} />
                <ProfileAreaCard title="Sprachen" value={`${profile.languages.length} Sprachen`} status={profile.languages.length > 0 ? 'vorhanden' : 'fehlt'} icon={Languages} onClick={() => setActiveSection('languages')} />
                <ProfileAreaCard title="KI-Zusammenfassung" value={(hasDeSummary || hasEnSummary) ? 'Vorhanden' : 'Fehlt'} status={(hasDeSummary || hasEnSummary) ? 'bereit' : 'ausstehend'} icon={BookText} onClick={() => setActiveSection('summary')} />
                <ProfileAreaCard title="Wunschstellen" value={`${profile.targetJobs.length} / 3`} status={profile.targetJobs.length > 0 ? 'gesetzt' : 'fehlt'} icon={ClipboardList} onClick={() => setActiveSection('targets')} />
              </div>
              <ProfileRecommendationCard
                title={nextAction.title}
                description={nextAction.description}
                onAction={() => setActiveSection(nextAction.section)}
              />
            </section>
          ) : null}
        </div>
        )}

        {currentSection !== 'overview' && (
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block lg:sticky lg:top-[68px] lg:h-fit lg:space-y-3 lg:rounded-2xl lg:border lg:border-[#3a332d] lg:bg-[#232019] lg:p-3.5">
          <ProfileSectionNav items={sectionItems} activeSection={activeSection} onSelect={setActiveSection} />
          <div className="rounded-xl border border-[#3a332d] bg-[#1a1613] p-3 text-xs text-[#cfc6b8]">
            <p className="font-semibold text-[#f0ebe0]">Warum ist das wichtig?</p>
            <p className="mt-1">
              Ein vollständiges Profil verbessert die Qualität der KI-Antworten und Empfehlungen.
            </p>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="mt-2 inline-flex items-center gap-1 font-semibold text-[#e89372] hover:text-[#f0ebe0]"
            >
              Mehr erfahren
              <ChevronRight size={12} />
            </button>
          </div>
        </aside>
          <div
            ref={isDesktop ? desktopContentRef : undefined}
            className="min-h-[560px] transition-[opacity,transform] duration-200 ease-out"
          >
        {currentSection === 'basis' && (
          <>
        {/* ── CV-Import ──────────────────────────────────────────────── */}
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-1 text-sm font-semibold text-stone-900">Profil befüllen</h2>
          <p className="mb-4 text-sm text-stone-700">
            PDF hochladen → KI erkennt Felder automatisch und befüllt das Formular.
            Oder manuell direkt in den Abschnitten unten ausfüllen.
          </p>
          {canClearCvData ? (
            <div className="mb-4 rounded-lg border border-rose-300/50 bg-rose-50/80 px-3 py-3">
              <p className="text-sm font-semibold text-rose-950">Neuen Lebenslauf vorbereiten</p>
              <p className="mt-1 text-sm leading-relaxed text-rose-900/90">
                Löscht den aktuellen CV-Text, die daraus eingetragenen Felder und den Server-Prüfwert.
                Danach ist eine Analyse erst wieder möglich, wenn du einen neuen Lebenslauf hochlädst.
              </p>
              <AppCtaButton
                type="button"
                variant="danger"
                size="sm"
                disabled={saving}
                loading={saving}
                onClick={() => void handleClearCvDerived()}
                className="mt-3 inline-flex items-center gap-1.5"
              >
                <Trash2 size={14} aria-hidden />
                Lebenslauf-Daten löschen
              </AppCtaButton>
            </div>
          ) : null}
          <div className="mb-4 flex rounded-lg border border-stone-400/40 bg-app-parchmentDeep p-0.5 text-xs font-semibold sm:text-sm">
            <button
              type="button"
              onClick={() => setDataEntryTab('pdf')}
              className={[
                'flex-1 rounded-md py-2.5 transition-colors',
                dataEntryTab === 'pdf'
                  ? 'bg-app-parchment text-stone-900 shadow-sm'
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
                  ? 'bg-app-parchment text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900',
              ].join(' ')}
            >
              Manuell ausfüllen
            </button>
          </div>
          {dataEntryTab === 'pdf' && (
            <CvUploader
              getToken={getToken}
              fieldOptions={CAREER_FIELDS}
              levelOptions={CAREER_LEVELS}
              cvPasteText={cvPasteForUploader}
              onCvPasteTextChange={setCvPasteForUploader}
              onApplyParsed={requestApplyParsed}
              onManualAdjust={requestManualAdjust}
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
                Im Chat aktivierst du den Kontext über die Schalter über dem Eingabefeld -{' '}
                <strong className="font-medium">farbig = aktiv</strong>.
              </p>
            </div>
          </div>
        ) : canMarkProfileSetupComplete(profile) ? (
          <div className="mb-6 rounded-xl border border-[rgba(217,119,87,0.35)] bg-app-parchment px-4 py-3 text-sm text-stone-900">
            <p className="font-semibold text-[#1a1613]">Daten gespeichert - Setup noch offen</p>
            <p className="mt-2 leading-relaxed text-stone-800">
              Klicke unten, um das Profil als eingerichtet zu markieren - danach entfällt der
              Chat-Hinweis.
            </p>
            <AppCtaButton
              type="button"
              disabled={markSetupBusy || saving}
              onClick={() => void handleMarkSetupComplete()}
              className="mt-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {markSetupBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Profil als eingerichtet markieren
            </AppCtaButton>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-[rgba(217,119,87,0.35)] bg-app-parchment px-4 py-3 text-sm text-stone-900">
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
          <div className="mb-4 rounded-lg border border-rose-300/50 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* ── Pending merge hint ─────────────────────────────────────── */}
        {pendingMergedDraftHint && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[rgba(217,119,87,0.35)] bg-app-parchment px-4 py-3 text-sm text-stone-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              PDF-Daten wurden ins Formular übernommen - noch nicht gespeichert. Jetzt alle
              sichtbaren Felder auf dem Server speichern?
            </p>
            <AppCtaButton
              type="button"
              disabled={saving}
              onClick={() => void persistFullProfileFromState()}
              className="inline-flex shrink-0 items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Jetzt speichern
            </AppCtaButton>
          </div>
        )}

        {/* ── Merge summary hint ────────────────────────────────────── */}
        {mergeSummaryHint && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/35 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
            <p>{mergeSummaryHint}</p>
            <button
              type="button"
              onClick={() => setMergeSummaryHint(null)}
              className="shrink-0 text-emerald-700/70 hover:text-emerald-900"
              aria-label="Hinweis schließen"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Story reminder after a profile replace ───────────────────── */}
        {showStoryReminder && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[rgba(217,119,87,0.35)] bg-app-parchment px-4 py-3 text-sm text-stone-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Dein Profil zeigt jetzt einen neuen Werdegang. Passt deine Story noch dazu, oder sollte
              sie angepasst werden?
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <AppCtaButton
                type="button"
                onClick={() => {
                  setActiveSection('basis')
                  setMobileSection('basis')
                  setShowStoryReminder(false)
                }}
              >
                Story ansehen
              </AppCtaButton>
              <button
                type="button"
                onClick={() => setShowStoryReminder(false)}
                className="p-2 text-stone-700/70 hover:text-stone-900"
                aria-label="Hinweis schließen"
              >
                ×
              </button>
            </div>
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
                  const label = CAREER_FIELDS.find(f => f.value === v)?.label ?? ''
                  void saveProfilePatch({ field: v || null, fieldLabel: label || null })
                }}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              >
                <option value="">-</option>
                {CAREER_FIELDS.map(f => (
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
                  const label = CAREER_LEVELS.find(l => l.value === v)?.label ?? ''
                  void saveProfilePatch({ level: v || null, levelLabel: label || null })
                }}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              >
                <option value="">-</option>
                {CAREER_LEVELS.map(l => (
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
                placeholder="z. B. Teamassistenz, Pflegefachkraft, Vertriebsmitarbeiterin"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              />
            </label>
            <label className="col-span-full block text-sm">
              <span className="text-stone-700">Story</span>
              <textarea
                value={profile.story ?? ''}
                onChange={e => setProfile({ ...profile, story: e.target.value })}
                onBlur={() => void saveProfilePatch({ story: profile.story?.trim() || null })}
                rows={5}
                placeholder="Kurz in eigenen Worten: Werdegang, Stärken, was du suchst. Egal ob Pflege, Vertrieb, Büro oder ein anderer Beruf."
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              />
            </label>
          </div>
          <p className="mt-4 text-xs font-medium text-stone-600">Ziele</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CAREER_GOALS.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGoal(g.id)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  profile.goals.includes(g.id)
                    ? 'bg-[#d97757] text-black'
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
                  fieldLabel: CAREER_FIELDS.find(f => f.value === field)?.label ?? profile.fieldLabel ?? null,
                  level: level || null,
                  levelLabel: CAREER_LEVELS.find(l => l.value === level)?.label ?? profile.levelLabel ?? null,
                  currentRole: profile.currentRole?.trim() || null,
                })}
              className="inline-flex items-center justify-center rounded-xl border border-stone-400/50 bg-app-parchment px-4 py-2.5 text-sm font-medium text-stone-900 shadow-sm hover:bg-app-parchmentDeep disabled:opacity-50"
            >
              Änderungen speichern
            </button>
          </div>
        </section>
          </>
        )}

        {/* ── Skills ─────────────────────────────────────────────────── */}
        {currentSection === 'skills' && (
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Skills</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {profile.skills.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full border border-stone-400/35 bg-stone-100/90 px-3 py-1 text-xs text-stone-800"
              >
                {s}
                <button type="button" onClick={() => void removeSkill(s)} className="text-stone-500 hover:text-rose-600">
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={skillDraft}
              onChange={e => setSkillDraft(e.target.value)}
              placeholder="z. B. Kundenberatung, MS Office, Schichtleitung"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), void addSkill())}
            />
            <AppCtaButton
              type="button"
              onClick={() => void addSkill()}
              className="inline-flex items-center gap-1.5"
            >
              <Plus size={18} aria-hidden />
              Hinzufügen
            </AppCtaButton>
          </div>
        </section>
        )}

        {/* ── Berufserfahrung ─────────────────────────────────────────── */}
        {currentSection === 'experience' && (
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Berufserfahrung</h2>
          {(profile.experience ?? []).map((exp, i) => (
            <div key={i} className="mb-3 grid gap-2 rounded-lg border border-stone-300/40 p-3 md:grid-cols-2">
              <input
                placeholder="z. B. Teamassistenz"
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
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-400/40 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-700"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-400/40 bg-app-parchment px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary-light/40"
            >
              <Plus size={18} aria-hidden />
              Eintrag hinzufügen
            </button>
            <AppCtaButton
              type="button"
              onClick={() => void saveProfilePatch({ experience: profile.experience ?? [] })}
            >
              Änderungen speichern
            </AppCtaButton>
          </div>
        </section>
        )}

        {/* ── Ausbildung ──────────────────────────────────────────────── */}
        {currentSection === 'education' && (
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
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-400/40 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-700"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-400/40 bg-app-parchment px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary-light/40"
            >
              <Plus size={18} aria-hidden />
              Eintrag hinzufügen
            </button>
            <AppCtaButton
              type="button"
              onClick={() => void saveProfilePatch({ educationEntries: profile.educationEntries ?? [] })}
            >
              Änderungen speichern
            </AppCtaButton>
          </div>
        </section>
        )}

        {/* ── Sprachen ────────────────────────────────────────────────── */}
        {currentSection === 'languages' && (
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
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-stone-400/40 p-2 text-stone-600 hover:bg-rose-50 hover:text-rose-700"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-400/40 bg-app-parchment px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary-light/40"
            >
              <Plus size={18} aria-hidden />
              Sprache hinzufügen
            </button>
            <AppCtaButton
              type="button"
              onClick={() => void saveProfilePatch({ languages: profile.languages ?? [] })}
            >
              Änderungen speichern
            </AppCtaButton>
          </div>
        </section>
        )}

        {/* ── KI-Zusammenfassung ─────────────────────────────────────── */}
        {currentSection === 'summary' && (
        <>
        <section className="mb-8 rounded-xl border border-stone-400/40 bg-app-parchment p-5 shadow-landing text-stone-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">KI-Zusammenfassung</h2>
              <p className="mt-1 text-xs text-stone-600">
                Anonymisierter Profil-Kontext für den Assistenten - kein Name, nur berufliche Stärken.
                Wird aus allen Profildaten + CV generiert.
              </p>
            </div>
            {summaryStale && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[rgba(217,119,87,0.35)] bg-[#faf7f0] px-2.5 py-1 text-xs font-medium text-[#b45539]">
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
                  selectedGenLang === 'de' ? 'bg-app-parchment text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                ].join(' ')}
              >
                Deutsch (DE)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGenLang('en')}
                className={[
                  'rounded-md px-4 py-2 transition-colors',
                  selectedGenLang === 'en' ? 'bg-app-parchment text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                ].join(' ')}
              >
                English (EN)
              </button>
            </div>
            <AppCtaButton
              onClick={() => void generateSummaryForLang(selectedGenLang)}
              disabled={saving || cvSummaryLoading || !canGenerate}
              loading={cvSummaryLoading}
            >
              {!cvSummaryLoading && <Sparkles className="h-4 w-4 shrink-0" aria-hidden />}
              {cvSummaryLoading ? 'Erstelle…' : 'Zusammenfassung erstellen'}
            </AppCtaButton>
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/60 bg-app-parchment px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
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
        </>
        )}

        {/* ── Wunschstellen ───────────────────────────────────────────── */}
        {currentSection === 'targets' && (
        <section className="mb-8 rounded-xl border border-[rgba(217,119,87,0.35)] bg-app-parchment p-5 shadow-landing text-stone-900">
          <div className="mb-4 flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#b45539]" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Wunschstellen (max. 3)</h2>
              <p className="mt-1 text-xs text-[#b45539] font-medium">
                Wichtig für die Stellenanalyse - je mehr Details, desto präziser der Match mit
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
                  className="text-stone-500 hover:text-rose-600"
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
                placeholder="Stellenbeschreibung einfügen. Der Text fließt in die Analyse ein (optional)."
                rows={3}
                className="col-span-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <AppCtaButton
                type="button"
                onClick={() => void addJob()}
                disabled={saving || !jobTitle.trim()}
              >
                Hinzufügen
              </AppCtaButton>
            </div>
          )}
        </section>
        )}
          </div>
          </div>
        )}

        {saving && (
          <p className="flex items-center gap-2 pb-4 text-sm text-stone-600">
            <Loader2 className="animate-spin" size={16} />
            Speichern…
          </p>
        )}

      </StandardPageContainer>
    </div>
  )
}
