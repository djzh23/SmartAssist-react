import { useState } from 'react'
import { ChevronDown, ChevronRight, Link2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'
import type { CvResumeGroup } from '../../lib/cvStudioGroups'
import CvMiniDocPreview from './CvMiniDocPreview'

interface Props {
  groups: CvResumeGroup[]
  defaultOpenCount: number
  onCreateResume: (group: CvResumeGroup) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}

export default function CvLinkedApplicationsBoard({
  groups,
  defaultOpenCount,
  onCreateResume,
  onDeleteResume,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-stone-500">
        Jede Karte = eine Zeile aus{' '}
        <Link to="/applications" className="font-semibold text-primary-light hover:underline">
          Meine Bewerbungen
        </Link>
        . Darin liegen die CV-Versionen für genau diese Stelle — horizontal durchstöbern.
      </p>
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-stretch">
        {groups.map((group, idx) => (
          <LinkedApplicationCard
            key={group.key}
            group={group}
            defaultOpen={idx < defaultOpenCount}
            onCreateResume={onCreateResume}
            onDeleteResume={onDeleteResume}
          />
        ))}
      </div>
    </div>
  )
}

function LinkedApplicationCard({
  group,
  defaultOpen,
  onCreateResume,
  onDeleteResume,
}: {
  group: CvResumeGroup
  defaultOpen: boolean
  onCreateResume: (group: CvResumeGroup) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="flex min-h-[140px] min-w-0 flex-1 flex-col rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-950/25 via-white/[0.03] to-black/40 p-3 shadow-sm lg:min-w-[280px] lg:max-w-[380px]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-start gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-white/[0.04]"
        aria-expanded={open}
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200">
          <Link2 size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-200/80">Aus Meine Bewerbungen</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-white">{group.label}</p>
          <p className="mt-1 text-[11px] text-stone-500">
            {group.resumes.length} CV-Version{group.resumes.length === 1 ? '' : 'en'}
          </p>
        </div>
        <span className="shrink-0 text-stone-500">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <CvMiniDocPreview />
        {open ? (
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {group.resumes.map(r => (
                <div
                  key={r.id}
                  className="flex w-[min(100%,200px)] shrink-0 flex-col rounded-lg border border-white/[0.08] bg-black/25"
                >
                  <Link
                    to={`/cv-studio/edit/${r.id}`}
                    className="block px-2.5 py-2 text-xs font-medium text-stone-100 hover:text-primary-light"
                  >
                    <span className="line-clamp-2">{r.title}</span>
                    <span className="mt-1 block text-[10px] text-stone-500">
                      {new Date(r.updatedAtUtc).toLocaleDateString('de-DE')}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void onDeleteResume(r)}
                    className="border-t border-white/[0.06] px-2 py-1 text-[10px] text-rose-300/90 hover:bg-rose-950/30"
                  >
                    Löschen
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onCreateResume(group)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-sky-500/30 py-2 text-[11px] font-medium text-sky-100/90 hover:border-sky-400/50 hover:bg-sky-950/20"
            >
              <Plus size={13} aria-hidden />
              Weitere Version
            </button>
          </div>
        ) : (
          <p className="self-center text-[11px] text-stone-500 sm:self-end">Aufklappen für Versionen</p>
        )}
      </div>
    </div>
  )
}
