import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileType,
  History,
  Layers,
  Loader2,
  PencilLine,
  RotateCcw,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'
import type { ResumeVersionSummaryDto } from '../../cvTypes'
import { formatVariantenName, versionBadgeClass } from '../../lib/formatting'

interface CvVersionsSidebarProps {
  open: boolean
  onToggle: () => void
  versions: ResumeVersionSummaryDto[]
  activeVariant: ResumeVersionSummaryDto | null
  busy: boolean
  onRestore: (versionId: string) => void | Promise<void>
  onLoadForEdit: (versionId: string) => void | Promise<void>
  onExportPdf: (versionId: string) => void | Promise<void>
  onExportDocx: (versionId: string) => void | Promise<void>
  onDelete: (versionId: string) => void | Promise<void>
  onRenameLabel?: (versionId: string) => void | Promise<void>
  onDeleteAllSnapshots: () => void | Promise<void>
  onFreshStart: () => void | Promise<void>
}

const iconBtn =
  'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-stone-300 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40'

export default function CvVersionsSidebar({
  open,
  onToggle,
  versions,
  activeVariant,
  busy,
  onRestore,
  onLoadForEdit,
  onExportPdf,
  onExportDocx,
  onDelete,
  onRenameLabel,
  onDeleteAllSnapshots,
  onFreshStart,
}: CvVersionsSidebarProps) {
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)

  if (!open) {
    return (
      <div className="hidden shrink-0 xl:flex">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-10 flex-col items-center gap-2 border-l border-white/10 bg-black/20 py-4 text-stone-400 transition-colors hover:bg-white/5 hover:text-primary-light"
          title="Versionen einblenden"
        >
          <Layers size={18} aria-hidden />
          <ChevronLeft size={16} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <aside className="flex w-full max-w-full shrink-0 flex-col border-t border-white/10 bg-black/25 xl:w-72 xl:border-l xl:border-t-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          <History size={14} aria-hidden />
          Versionen
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded p-1 text-stone-500 hover:bg-white/10 hover:text-stone-200"
          title="Versionen ausblenden"
          aria-label="Versionen ausblenden"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      {/* Explanation */}
      <div className="max-h-[min(70vh,32rem)] flex-1 overflow-y-auto p-2">
        <p className="mb-2 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-[10px] leading-relaxed text-stone-500">
          <span className="font-medium text-stone-400">Versionen</span> sind manuelle Sicherungspunkte -
          dein Lebenslauf wird ohnehin automatisch gespeichert. Eine Version festigt einen Stand, z. B.
          vor größeren Änderungen oder zum Exportieren.{' '}
          Neue Version anlegen: oben auf{' '}
          <span className="font-medium text-stone-400">„Version speichern"</span>.
        </p>

        {sorted.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-stone-500">Noch keine Versionen.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map(v => {
              const isActive = activeVariant?.id === v.id
              return (
                <li
                  key={v.id}
                  className={[
                    'rounded-lg border px-2.5 py-2 transition-colors',
                    isActive ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-black/20 hover:border-white/20',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-flex shrink-0 rounded px-1 py-0.5 text-[10px] font-bold ${versionBadgeClass(v.versionNumber)}`}
                    >
                      v{v.versionNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs font-medium text-stone-100">
                          {formatVariantenName(v)}
                        </span>
                        {isActive && (
                          <Star size={11} className="shrink-0 text-amber-300" fill="currentColor" aria-label="Aktiv" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        {new Date(v.createdAtUtc).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-2 flex flex-wrap items-center justify-end gap-1 border-t border-white/5 pt-2"
                    role="toolbar"
                    aria-label={`Aktionen für Version ${v.versionNumber}`}
                  >
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onRestore(v.id)}
                      className={iconBtn}
                      title="Als Arbeitsversion wiederherstellen"
                    >
                      <RotateCcw size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={busy || !onRenameLabel}
                      onClick={() => void onRenameLabel?.(v.id)}
                      className={iconBtn}
                      title="Notiz dieser Version bearbeiten"
                    >
                      <Tag size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onLoadForEdit(v.id)}
                      className={iconBtn}
                      title="Inhalt in Arbeitsversion übernehmen"
                    >
                      <PencilLine size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onExportPdf(v.id)}
                      className={`${iconBtn} border-primary/35 bg-primary/15 text-primary-light hover:bg-primary/25`}
                      title="PDF exportieren"
                    >
                      <FileDown size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onExportDocx(v.id)}
                      className={iconBtn}
                      title="DOCX exportieren"
                    >
                      <FileType size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDelete(v.id)}
                      className={`${iconBtn} border-rose-500/30 text-rose-200 hover:border-rose-500/50 hover:bg-rose-950/40`}
                      title="Version löschen"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {busy && (
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-stone-500">
            <Loader2 size={12} className="animate-spin" aria-hidden />
            …
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-auto border-t border-white/10 p-2">
        {versions.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDeleteAllSnapshots()}
            className="mb-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/35 py-2 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-950/35 disabled:opacity-40"
          >
            <Trash2 size={12} aria-hidden />
            Alle Versionen löschen
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onFreshStart()}
          className="flex w-full justify-center py-1.5 text-[10px] text-rose-300/90 underline-offset-2 hover:text-rose-200 hover:underline disabled:opacity-40"
        >
          Alles zurücksetzen (Fresh Start)
        </button>
      </div>
    </aside>
  )
}
