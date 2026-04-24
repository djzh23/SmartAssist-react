import { ChevronLeft, ChevronRight, Download, History, Loader2, RotateCcw, Save, Star } from 'lucide-react'
import type { ResumeVersionDto } from '../../cvTypes'
import { formatVariantenName, versionBadgeClass } from '../../lib/formatting'

interface CvVersionsSidebarProps {
  open: boolean
  onToggle: () => void
  versions: ResumeVersionDto[]
  activeVariant: ResumeVersionDto | null
  busy: boolean
  onRestore: (versionId: string) => void | Promise<void>
  onLoadForEdit: (versionId: string) => void | Promise<void>
  onExportPdf: (versionId: string) => void | Promise<void>
  onExportDocx: (versionId: string) => void | Promise<void>
  onNewVersion: () => void
}

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
  onNewVersion,
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
          <History size={18} aria-hidden />
          <ChevronLeft size={16} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <aside className="flex w-full max-w-full shrink-0 flex-col border-t border-white/10 bg-black/25 xl:w-72 xl:border-l xl:border-t-0">
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
      <div className="max-h-[min(70vh,32rem)] flex-1 overflow-y-auto p-2">
        <button
          type="button"
          disabled={busy}
          onClick={onNewVersion}
          className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          <Save size={13} aria-hidden />
          Neue Version
        </button>
        {sorted.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-stone-500">Noch keine Snapshots.</p>
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
                        <span className="truncate text-xs font-medium text-stone-100">{formatVariantenName(v)}</span>
                        {isActive ? (
                          <Star size={11} className="shrink-0 text-amber-300" fill="currentColor" aria-label="Aktiv" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        {new Date(v.createdAtUtc).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onRestore(v.id)}
                      className="inline-flex items-center gap-0.5 rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-1 text-[10px] font-medium text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
                      title="Arbeitsversion auf Server auf diesen Stand setzen"
                    >
                      <RotateCcw size={10} aria-hidden />
                      Wiederherstellen
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onLoadForEdit(v.id)}
                      className="rounded border border-white/15 px-1.5 py-1 text-[10px] text-stone-300 hover:bg-white/5 disabled:opacity-50"
                      title="Inhalt übernehmen und als Änderung speichern"
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onExportPdf(v.id)}
                      className="rounded bg-primary/90 px-1.5 py-1 text-[10px] text-white disabled:opacity-50"
                    >
                      <Download size={10} className="inline" aria-hidden /> PDF
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onExportDocx(v.id)}
                      className="rounded border border-white/20 px-1.5 py-1 text-[10px] text-stone-200 disabled:opacity-50"
                    >
                      DOCX
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {busy ? (
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-stone-500">
            <Loader2 size={12} className="animate-spin" aria-hidden />
            …
          </div>
        ) : null}
      </div>
    </aside>
  )
}
