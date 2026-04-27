import { Link2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'
import type { CvResumeGroup } from '../../lib/cvStudioGroups'
import CvResumeCard from './CvResumeCard'

interface Props {
  groups: CvResumeGroup[]
  onCreateResume: (group: CvResumeGroup) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}

export default function CvLinkedApplicationsBoard({
  groups,
  onCreateResume,
  onDeleteResume,
}: Props) {
  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-stone-500">
        Jede Gruppe = eine Zeile aus{' '}
        <Link to="/applications" className="font-semibold text-primary-light hover:underline">
          Meine Bewerbungen
        </Link>
        . Darin liegen die CV-Versionen für genau diese Stelle.
      </p>

      <div className="space-y-5">
        {groups.map(group => (
          <LinkedApplicationGroup
            key={group.key}
            group={group}
            onCreateResume={onCreateResume}
            onDeleteResume={onDeleteResume}
          />
        ))}
      </div>
    </div>
  )
}

function LinkedApplicationGroup({
  group,
  onCreateResume,
  onDeleteResume,
}: {
  group: CvResumeGroup
  onCreateResume: (group: CvResumeGroup) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}) {
  return (
    <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-white/[0.02] to-black/30 p-4">
      {/* Group header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200">
          <Link2 size={15} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-200/70">
            Aus Meine Bewerbungen
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{group.label}</p>
        </div>
        <span className="shrink-0 rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
          {group.resumes.length} Version{group.resumes.length === 1 ? '' : 'en'}
        </span>
      </div>

      {/* CV cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {group.resumes.map(r => (
          <CvResumeCard
            key={r.id}
            resume={r}
            onDelete={() => onDeleteResume(r)}
          />
        ))}

        {/* Add version tile */}
        <button
          type="button"
          onClick={() => onCreateResume(group)}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-500/30 text-sky-300/70 transition-colors hover:border-sky-400/50 hover:bg-sky-950/20 hover:text-sky-200"
        >
          <Plus size={20} aria-hidden />
          <span className="text-[11px] font-medium">Weitere Version</span>
        </button>
      </div>
    </div>
  )
}
