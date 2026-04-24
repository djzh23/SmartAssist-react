import { useState } from 'react'
import { Briefcase, ChevronDown, ChevronRight, Link2, Plus, Unlink } from 'lucide-react'
import type { CvStudioResumeSummary } from '../../../types'
import type { CvResumeGroup } from '../../lib/cvStudioGroups'
import CvResumeCard from './CvResumeCard'

interface CvApplicationGroupProps {
  group: CvResumeGroup
  defaultOpen?: boolean
  onCreateResume: (group: CvResumeGroup) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}

export default function CvApplicationGroup({
  group,
  defaultOpen = false,
  onCreateResume,
  onDeleteResume,
}: CvApplicationGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  const Icon = group.isUnlinked ? Unlink : group.applicationId ? Link2 : Briefcase

  const badgeBg = group.isUnlinked
    ? 'bg-stone-700/60 text-stone-400'
    : group.applicationId
      ? 'bg-primary/20 text-primary-light'
      : 'bg-amber-900/40 text-amber-300'

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${badgeBg}`}>
          <Icon size={15} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{group.label}</p>
          {group.applicationId && !group.isUnlinked && (
            <p className="text-xs text-stone-500">Verknüpfte Bewerbung</p>
          )}
          {!group.applicationId && group.company && (
            <p className="text-xs text-stone-500">Kein Bewerbungsbezug</p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-400">
            {group.resumes.length}
          </span>
          {open ? (
            <ChevronDown size={16} className="text-stone-500" aria-hidden />
          ) : (
            <ChevronRight size={16} className="text-stone-500" aria-hidden />
          )}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-white/10 px-4 py-3">
          <ul className="space-y-2">
            {group.resumes.map(r => (
              <li key={r.id}>
                <CvResumeCard resume={r} onDelete={() => void onDeleteResume(r)} />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => onCreateResume(group)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 py-2 text-xs text-stone-500 transition-colors hover:border-primary/40 hover:text-primary-light"
          >
            <Plus size={14} aria-hidden />
            Weiteren CV für diese Gruppe anlegen
          </button>
        </div>
      )}
    </div>
  )
}
