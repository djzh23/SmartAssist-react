import { useState } from 'react'
import { Loader2, X } from 'lucide-react'

interface CvSaveVersionModalProps {
  busy: boolean
  onSave: (label: string) => Promise<void>
  onSaveAndPdf: (label: string) => Promise<void>
  onClose: () => void
}

export default function CvSaveVersionModal({
  busy,
  onSave,
  onSaveAndPdf,
  onClose,
}: CvSaveVersionModalProps) {
  const [label, setLabel] = useState('')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Snapshot speichern"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
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
            Neue Version
          </p>
          <h2 className="mb-4 text-lg font-semibold text-white">Snapshot speichern</h2>

          <label className="block text-xs font-medium text-stone-400">
            Was hast du geändert? (optional)
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="z. B. Docker-Erfahrung ergänzt, Kubernetes weggelassen"
              maxLength={120}
              className="mt-1.5 block w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-primary focus:outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter') void onSave(label)
              }}
            />
          </label>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSaveAndPdf(label)}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
            >
              {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
              Snapshot speichern & PDF
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSave(label)}
              className="rounded-lg border border-white/20 py-2.5 text-sm text-stone-200 hover:bg-white/5 disabled:opacity-40"
            >
              Nur Snapshot speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
