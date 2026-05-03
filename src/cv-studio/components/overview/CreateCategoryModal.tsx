import { useRef, useState } from 'react'
import { FolderPlus, Loader2, X } from 'lucide-react'
import AppCtaButton from '../../../components/ui/AppCtaButton'

interface Props {
  onConfirm: (name: string) => Promise<void>
  onClose: () => void
}

export default function CreateCategoryModal({ onConfirm, onClose }: Props) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Bitte einen Namen eingeben.')
      inputRef.current?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(trimmed)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen.')
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-cat-title"
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
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-light">
              <FolderPlus size={20} aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-light">
                Neue Kategorie
              </p>
              <h2 id="create-cat-title" className="text-base font-semibold text-white">
                Kategorie anlegen
              </h2>
            </div>
          </div>

          <p className="mb-5 text-xs leading-relaxed text-stone-400">
            Kategorien sind Ordner für deine Bewerbungen - z. B. nach Branche, Rolle oder Zielunternehmen. Innerhalb
            jeder Kategorie erstellst du passende Lebensläufe.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <label htmlFor="cat-name-input" className="mb-1.5 block text-xs font-semibold text-stone-300">
            Kategorienname <span className="text-rose-400" aria-hidden>*</span>
          </label>
          <input
            ref={inputRef}
            id="cat-name-input"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleSubmit() }}
            placeholder="z. B. Frontend, SAP, Google, Logistik …"
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
          />

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-stone-400 transition-colors hover:bg-white/5 hover:text-stone-200"
            >
              Abbrechen
            </button>
            <AppCtaButton
              type="button"
              disabled={busy || !name.trim()}
              onClick={() => void handleSubmit()}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              {busy
                ? <Loader2 size={14} className="animate-spin" aria-hidden />
                : <FolderPlus size={14} aria-hidden />}
              Anlegen
            </AppCtaButton>
          </div>
        </div>
      </div>
    </div>
  )
}
