import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import AppCtaButton from '../../../components/ui/AppCtaButton'

interface CvRenameSnapshotModalProps {
  busy: boolean
  versionNumber: number
  initialLabel: string
  onSave: (label: string) => Promise<void>
  onClose: () => void
}

export default function CvRenameSnapshotModal({
  busy,
  versionNumber,
  initialLabel,
  onSave,
  onClose,
}: CvRenameSnapshotModalProps) {
  const [label, setLabel] = useState(initialLabel)

  useEffect(() => {
    setLabel(initialLabel)
  }, [initialLabel, versionNumber])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Snapshot umbenennen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#1a1510] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-stone-500 hover:bg-white/10 hover:text-stone-300"
          aria-label="Schließen"
        >
          <X size={18} aria-hidden />
        </button>

        <div className="px-6 pb-6 pt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-light">
            Snapshot v{versionNumber}
          </p>
          <h2 className="mb-4 text-lg font-semibold text-white">Bezeichnung ändern</h2>

          <label className="block text-xs font-medium text-stone-400">
            Kurzname / Notiz (optional, max. 120 Zeichen)
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={120}
              className="mt-1.5 block w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-primary focus:outline-none"
              placeholder="z. B. Vor Interview bei Firma X"
              onKeyDown={e => {
                if (e.key === 'Enter') void onSave(label)
              }}
            />
          </label>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AppCtaButton
              variant="ghost"
              disabled={busy}
              onClick={onClose}
            >
              Abbrechen
            </AppCtaButton>
            <AppCtaButton
              loading={busy}
              onClick={() => void onSave(label)}
            >
              Speichern
            </AppCtaButton>
          </div>
        </div>
      </div>
    </div>
  )
}
