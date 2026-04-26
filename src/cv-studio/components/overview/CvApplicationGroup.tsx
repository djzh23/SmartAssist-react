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

function shellClass(variant: CvGroupVisualVariant): string {
  switch (variant) {
    case 'linked':
      return 'rounded-xl border border-teal-500/35 bg-gradient-to-br from-teal-950/45 via-[#1a1510]/90 to-black/40 shadow-[inset_0_1px_0_0_rgba(45,212,191,0.12)]'
    case 'context':
      return 'rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/35 via-[#1a1510]/90 to-black/40'
    case 'general':
      return 'rounded-xl border border-primary/40 bg-gradient-to-br from-primary/15 via-[#1a1510]/95 to-black/50'
    default:
      return 'rounded-xl border border-white/10 bg-white/[0.03]'
  }
}

function headerHoverClass(variant: CvGroupVisualVariant): string {
  switch (variant) {
    case 'linked':
      return 'hover:bg-teal-950/25'
    case 'context':
      return 'hover:bg-amber-950/20'
    case 'general':
      return 'hover:bg-primary/10'
    default:
      return 'hover:bg-white/[0.04]'
  }
}

function iconShellClass(variant: CvGroupVisualVariant): string {
  switch (variant) {
    case 'linked':
      return 'bg-teal-500/20 text-teal-200 ring-1 ring-teal-400/25'
    case 'context':
      return 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/20'
    case 'general':
      return 'bg-primary/25 text-primary-light ring-1 ring-primary/30'
    default:
      return 'bg-stone-700/60 text-stone-400'
  }
}

function bodyBorderClass(variant: CvGroupVisualVariant): string {
  switch (variant) {
    case 'linked':
      return 'border-teal-500/20 bg-black/35'
    case 'context':
      return 'border-amber-500/15 bg-black/30'
    case 'general':
      return 'border-primary/20 bg-black/40'
    default:
      return 'border-white/10 bg-black/25'
  }
}

function countBadgeClass(variant: CvGroupVisualVariant): string {
  switch (variant) {
    case 'linked':
      return 'bg-teal-950/80 text-teal-100 ring-1 ring-teal-500/30'
    case 'context':
      return 'bg-amber-950/70 text-amber-100 ring-1 ring-amber-500/25'
    case 'general':
      return 'bg-primary/20 text-primary-light ring-1 ring-primary/35'
    default:
      return 'bg-white/10 text-stone-400'
  }
}

function addButtonClass(variant: CvGroupVisualVariant): string {
  const base =
    'mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-xs font-medium transition-colors'
  switch (variant) {
    case 'linked':
      return `${base} border-teal-500/30 text-teal-200/90 hover:border-teal-400/55 hover:bg-teal-950/30 hover:text-teal-50`
    case 'context':
      return `${base} border-amber-500/25 text-amber-100/90 hover:border-amber-400/45 hover:bg-amber-950/25 hover:text-amber-50`
    case 'general':
      return `${base} border-primary/35 text-primary-light/95 hover:border-primary/55 hover:bg-primary/15 hover:text-white`
    default:
      return `${base} border-white/15 text-stone-500 hover:border-primary/40 hover:text-primary-light`
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

  const subtitle =
    variant === 'linked'
      ? null
      : variant === 'context'
        ? 'Nur Firmen-/Rollenname — nicht mit einer Pipeline-Bewerbung verknüpft'
        : 'Freie Vorlagen und Varianten ohne Stellenbezug'

  const linkedChip =
    variant === 'linked' ? (
      <span className="mt-1 inline-flex w-fit items-center rounded-full bg-teal-950/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-200/95 ring-1 ring-teal-500/35">
        Pipeline
      </span>
    ) : null

  return (
    <div className={`overflow-hidden ${shellClass(variant)}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${headerHoverClass(variant)}`}
        aria-expanded={open}
      >
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconShellClass(variant)}`}
        >
          <Icon size={variant === 'general' ? 16 : 15} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold tracking-tight text-white">{group.label}</p>
          </div>
          {linkedChip}
          {subtitle ? <p className="mt-1 text-[11px] leading-snug text-stone-500">{subtitle}</p> : null}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${countBadgeClass(variant)}`}
          >
            {group.resumes.length}
          </span>
          {open ? (
            <ChevronDown size={17} className="text-stone-400" aria-hidden />
          ) : (
            <ChevronRight size={17} className="text-stone-400" aria-hidden />
          )}
        </div>
      </button>

      {open && (
        <div className={`border-t px-3 py-3 sm:px-4 ${bodyBorderClass(variant)}`}>
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
            {variant === 'linked'
              ? 'CV-Versionen für diese Bewerbung'
              : variant === 'context'
                ? 'CVs mit gleichem Kontext'
                : 'Deine Dokumente'}
          </p>
          <ul className="space-y-2">
            {group.resumes.map(r => (
              <li key={r.id}>
                <CvResumeCard
                  resume={r}
                  nestStyle={variant}
                  onDelete={() => void onDeleteResume(r)}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => onCreateResume(group)}
            className={addButtonClass(variant)}
          >
            <Plus size={14} aria-hidden />
            Weiteren CV für diese Gruppe anlegen
          </button>
        </div>
      )}
    </div>
  )
}
