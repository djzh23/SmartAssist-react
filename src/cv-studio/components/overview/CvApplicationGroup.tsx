import { useState } from 'react'
import { Briefcase, ChevronDown, ChevronRight, Link2, Plus, Sparkles } from 'lucide-react'
import type { CvStudioResumeSummary } from '../../../types'
import type { CvResumeGroup } from '../../lib/cvStudioGroups'
import CvResumeCard from './CvResumeCard'

export type CvGroupVisualVariant = 'linked' | 'context' | 'general'

interface CvApplicationGroupProps {
  group: CvResumeGroup
  variant: CvGroupVisualVariant
  defaultOpen?: boolean
  onCreateResume: (group: CvResumeGroup) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}

function accentBorder(variant: CvGroupVisualVariant): string {
  switch (variant) {
    case 'linked':
      return 'border-l-stone-400/50'
    case 'context':
      return 'border-l-amber-400/35'
    case 'general':
      return 'border-l-primary/40'
    default:
      return 'border-l-white/15'
  }
}

function iconWrap(variant: CvGroupVisualVariant): string {
  switch (variant) {
    case 'linked':
      return 'bg-white/[0.06] text-stone-200'
    case 'context':
      return 'bg-white/[0.06] text-amber-100/90'
    case 'general':
      return 'bg-white/[0.06] text-primary-light/95'
    default:
      return 'bg-white/[0.06] text-stone-300'
  }
}

export default function CvApplicationGroup({
  group,
  variant,
  defaultOpen = false,
  onCreateResume,
  onDeleteResume,
}: CvApplicationGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  const Icon =
    variant === 'general' ? Sparkles : group.applicationId ? Link2 : Briefcase

  const kindLabel =
    variant === 'linked'
      ? 'Pipeline'
      : variant === 'context'
        ? 'Ohne Bewerbungs-ID'
        : 'Frei / Vorlage'

  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] ${accentBorder(variant)} border-l-[3px]`}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.04] sm:px-4 sm:py-3.5"
        aria-expanded={open}
      >
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconWrap(variant)}`}
        >
          <Icon size={15} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-medium text-white">{group.label}</p>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-stone-500">
              {kindLabel}
            </span>
          </div>
          {variant !== 'linked' ? (
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">
              {variant === 'context'
                ? 'Nur Firmen- oder Rollenname - nicht mit einer Pipeline-Bewerbung verknüpft.'
                : 'Master- oder Übungs-CVs ohne feste Bewerbung.'}
            </p>
          ) : null}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-stone-300">
            {group.resumes.length}
          </span>
          {open ? (
            <ChevronDown size={16} className="text-stone-500" aria-hidden />
          ) : (
            <ChevronRight size={16} className="text-stone-500" aria-hidden />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] bg-black/20 px-3 py-3 sm:px-4">
          <ul className="space-y-1.5">
            {group.resumes.map(r => (
              <li key={r.id}>
                <CvResumeCard
                  resume={r}
                  onDelete={() => void onDeleteResume(r)}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => onCreateResume(group)}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/12 py-2 text-xs font-medium text-stone-400 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-stone-200"
          >
            <Plus size={14} aria-hidden />
            Weiteren CV für diese Gruppe anlegen
          </button>
        </div>
      )}
    </div>
  )
}
