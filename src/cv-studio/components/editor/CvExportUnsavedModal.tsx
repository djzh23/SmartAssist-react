import { X } from 'lucide-react'
import AppCtaButton from '../../../components/ui/AppCtaButton'

interface CvExportUnsavedModalProps {
  onSaveFirst: () => void
  onExportWithoutSnapshot: () => void
  onDismiss: () => void
}

/** Replaces `window.confirm` before PDF/DOCX export when the working copy has unsaved changes. */
export default function CvExportUnsavedModal({
  onSaveFirst,
  onExportWithoutSnapshot,
  onDismiss,
}: CvExportUnsavedModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vor dem Export"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#1a1510] shadow-2xl">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-stone-500 hover:bg-white/10 hover:text-stone-300"
          aria-label="Schließen"
        >
          <X size={18} aria-hidden />
        </button>
        <div className="px-6 pb-6 pt-5">
          <h2 className="mb-2 pr-8 text-lg font-semibold text-white">Ungespeicherte Änderungen</h2>
          <p className="text-sm leading-relaxed text-stone-400">
            Möchtest du vor dem Export einen Snapshot speichern, oder den aktuellen Arbeitsstand exportieren
            (nach ausstehendem Auto-Save)?
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <AppCtaButton onClick={onSaveFirst}>
              Snapshot speichern …
            </AppCtaButton>
            <AppCtaButton variant="secondary" onClick={onExportWithoutSnapshot}>
              Ohne neuen Snapshot exportieren
            </AppCtaButton>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-1 text-center text-xs text-stone-500 hover:text-stone-400"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
