import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { CareerProfile } from '../../api/profileClient'
import type { ProfileContextToggles } from '../../types'
import TogglePill from './TogglePill'

const LS_CONTEXT_BAR_EXPANDED = 'privateprep_chat_context_bar_expanded'

function readStoredExpanded(): boolean {
  try {
    return localStorage.getItem(LS_CONTEXT_BAR_EXPANDED) === '1'
  } catch {
    return false
  }
}

function writeStoredExpanded(expanded: boolean) {
  try {
    localStorage.setItem(LS_CONTEXT_BAR_EXPANDED, expanded ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export interface KontextPillLabels {
  basic: string
  skills: string
  exp: string
  cv: string
}

interface Props {
  careerProfile: CareerProfile | null
  profileCompletenessPct: number
  profileGapHint: string | null
  profileToggles: ProfileContextToggles
  updateToggles: (patch: Partial<ProfileContextToggles>) => void
  kontextPillLabels: KontextPillLabels
  kontextHintOpen: boolean
  dismissKontextHint: () => void
}

export default function ChatContextBar({
  careerProfile,
  profileCompletenessPct,
  profileGapHint,
  profileToggles,
  updateToggles,
  kontextPillLabels,
  kontextHintOpen,
  dismissKontextHint,
}: Props) {
  const [expanded, setExpanded] = useState(readStoredExpanded)

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => {
      const next = !prev
      writeStoredExpanded(next)
      return next
    })
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-stone-600/35 pb-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 text-[11px] leading-snug text-stone-400">
            <span className="font-medium text-stone-200">Kontext</span>
            {' — '}
            Teile ein- oder ausblenden; Profil bearbeiten unter{' '}
            <Link to="/career-profile" className="font-medium text-primary hover:underline">
              Karriereprofil
            </Link>
            {careerProfile && profileCompletenessPct < 100 ? (
              <span className="text-stone-500">
                {' '}
                ({profileCompletenessPct}% vollständig)
              </span>
            ) : null}
            .
          </p>
        </div>
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg border border-stone-600/45 bg-app-raised/90 px-2.5 py-1 text-[11px] font-medium text-stone-200 transition-colors hover:bg-white/8"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 text-stone-400" aria-hidden />
              Kontext ausblenden
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" aria-hidden />
              Kontext einblenden
            </>
          )}
        </button>
      </div>

      {expanded ? (
        <div className="space-y-2 pt-2">
          {careerProfile && profileCompletenessPct < 50 && (
            <div className="rounded-lg border border-amber-500/35 bg-amber-950/40 px-2.5 py-1.5 text-[11px] text-amber-100">
              Je vollständiger dein Profil, desto besser die Antworten. Ergänze fehlende Bereiche unter{' '}
              <Link to="/career-profile" className="font-medium text-primary hover:underline">
                Karriereprofil
              </Link>
              .
            </div>
          )}
          {profileGapHint ? (
            <p className="text-[11px] text-stone-400">
              <span className="font-medium text-stone-200">Hinweis:</span> {profileGapHint}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 max-[768px]:flex-nowrap max-[768px]:overflow-x-auto max-[768px]:pb-0.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Kontext</span>
            <TogglePill
              active={profileToggles.includeBasicProfile}
              label={kontextPillLabels.basic}
              onClick={() => updateToggles({ includeBasicProfile: !profileToggles.includeBasicProfile })}
            />
            <TogglePill
              active={profileToggles.includeSkills}
              label={kontextPillLabels.skills}
              onClick={() => updateToggles({ includeSkills: !profileToggles.includeSkills })}
            />
            <TogglePill
              active={profileToggles.includeExperience}
              label={kontextPillLabels.exp}
              onClick={() => updateToggles({ includeExperience: !profileToggles.includeExperience })}
            />
            <TogglePill
              active={profileToggles.includeCv}
              label={kontextPillLabels.cv}
              onClick={() => updateToggles({ includeCv: !profileToggles.includeCv })}
            />
            {(careerProfile?.targetJobs ?? []).map(job => (
              <TogglePill
                key={job.id}
                active={profileToggles.activeTargetJobId === job.id}
                label={`Zielstelle: ${job.title ?? 'Stelle'}${job.company ? ` @ ${job.company}` : ''}`}
                title={`Zielstelle: ${job.title ?? ''}${job.company ? ` @ ${job.company}` : ''}`}
                onClick={() =>
                  updateToggles({
                    activeTargetJobId: profileToggles.activeTargetJobId === job.id ? null : job.id,
                  })}
              />
            ))}
          </div>
          {kontextHintOpen ? (
            <div className="flex items-start gap-1 rounded-lg bg-stone-900/50 py-0.5 pl-0 pr-0.5">
              <p className="min-w-0 flex-1 text-[11px] leading-snug text-stone-400">
                <strong className="font-medium text-stone-200">Farbig = aktiv:</strong> diese Profilteile steckt der
                Server im <strong className="font-medium text-stone-200">System-Prompt</strong> (nicht doppelt im
                Nachrichtentext). Stellenanalyse/Interview: in der Nachricht nur ggf. Text aus dem{' '}
                <strong className="font-medium text-stone-200">Setup-Modal</strong>. Bearbeiten unter{' '}
                <Link to="/career-profile" className="font-medium text-primary hover:underline">
                  Karriereprofil
                </Link>
                . HTTPS, nur angemeldet; nach Profil-Änderungen Seite neu laden.
              </p>
              <button
                type="button"
                onClick={dismissKontextHint}
                className="mt-0.5 flex-shrink-0 rounded-md p-1 text-stone-500 transition-colors hover:bg-white/10 hover:text-stone-200"
                aria-label="Hinweis schließen"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
