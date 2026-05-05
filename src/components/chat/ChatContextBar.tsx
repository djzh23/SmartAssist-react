import { useCallback, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CareerProfile } from '../../api/profileClient'
import type { ProfileContextToggles } from '../../types'
import TogglePill from './TogglePill'

const LS_CONTEXT_BAR_EXPANDED = 'privateprep_chat_context_bar_expanded'

function readStoredExpanded(): boolean {
  try {
    const stored = localStorage.getItem(LS_CONTEXT_BAR_EXPANDED)
    // Default to visible so badges are discoverable on mobile.
    if (stored == null) return true
    return stored === '1'
  } catch {
    return true
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
  compact?: boolean
}

export default function ChatContextBar({
  careerProfile,
  profileCompletenessPct: _profileCompletenessPct,
  profileGapHint: _profileGapHint,
  profileToggles,
  updateToggles,
  kontextPillLabels,
  kontextHintOpen: _kontextHintOpen,
  dismissKontextHint: _dismissKontextHint,
  compact = false,
}: Props) {
  const [expanded, setExpanded] = useState(readStoredExpanded)
  const showPills = compact ? true : expanded

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => {
      const next = !prev
      writeStoredExpanded(next)
      return next
    })
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      {!compact && (
        <div className="flex items-center justify-between gap-2 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Profil-Kontext</span>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            className="inline-flex h-7 flex-shrink-0 items-center gap-1 rounded-full border border-stone-600/40 bg-app-raised/85 px-2.5 text-[10px] font-medium text-stone-300 transition-colors hover:bg-white/8"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-stone-500" aria-hidden />
                Aus
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-stone-500" aria-hidden />
                Kontext anzeigen
              </>
            )}
          </button>
        </div>
      )}

      {showPills ? (
        <div className="max-[768px]:overflow-x-auto max-[768px]:pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-1.5">
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
        </div>
      ) : null}
    </div>
  )
}
