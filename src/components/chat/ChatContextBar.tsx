import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CareerProfile } from '../../api/profileClient'
import type { ProfileContextToggles } from '../../types'
import TogglePill from './TogglePill'

const LS_CONTEXT_BAR_EXPANDED = 'privateprep_chat_context_bar_expanded'

function readStoredExpanded(): boolean {
  try {
    return localStorage.getItem(LS_CONTEXT_BAR_EXPANDED) !== '0'
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
}

export default function ChatContextBar({
  careerProfile,
  profileCompletenessPct,
  profileToggles,
  updateToggles,
  kontextPillLabels,
}: Props) {
  const [expanded, setExpanded] = useState(readStoredExpanded)

  const toggle = useCallback(() => {
    setExpanded(prev => {
      const next = !prev
      writeStoredExpanded(next)
      return next
    })
  }, [])

  const pctColor =
    profileCompletenessPct >= 70
      ? 'text-emerald-400'
      : profileCompletenessPct >= 40
        ? 'text-amber-400'
        : 'text-stone-500'

  return (
    <div className="mx-auto max-w-3xl">
      {expanded ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Compact profile link with % */}
          <Link
            to="/career-profile"
            className={[
              'inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-600/45 px-2 py-0.5 text-[10px] font-semibold transition-colors hover:border-stone-500/60 hover:text-stone-200',
              pctColor,
            ].join(' ')}
            title="Karriereprofil bearbeiten"
          >
            {profileCompletenessPct}%
          </Link>

          {/* Context toggles */}
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
              label={`Stelle: ${job.title ?? 'Stelle'}`}
              title={job.company ? `${job.title} @ ${job.company}` : (job.title ?? '')}
              onClick={() =>
                updateToggles({
                  activeTargetJobId: profileToggles.activeTargetJobId === job.id ? null : job.id,
                })}
            />
          ))}

          {/* Collapse */}
          <button
            type="button"
            onClick={toggle}
            aria-label="Kontext ausblenden"
            className="ml-auto shrink-0 rounded-lg p-1 text-stone-500 transition-colors hover:bg-white/8 hover:text-stone-300"
          >
            <ChevronUp size={13} />
          </button>
        </div>
      ) : (
        /* Collapsed: single compact trigger */
        <button
          type="button"
          onClick={toggle}
          aria-label="Kontext einblenden"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-stone-500 transition-colors hover:bg-white/5 hover:text-stone-300"
        >
          <ChevronDown size={13} />
          <span className="font-medium">Kontext</span>
          {profileCompletenessPct > 0 && (
            <span className={['rounded-full bg-stone-800 px-1.5 py-0.5 text-[10px] font-semibold', pctColor].join(' ')}>
              {profileCompletenessPct}%
            </span>
          )}
        </button>
      )}
    </div>
  )
}
