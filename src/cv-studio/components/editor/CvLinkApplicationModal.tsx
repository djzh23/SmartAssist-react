import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { JobApplicationApi } from '../../../api/client'

interface CvLinkApplicationModalProps {
  currentAppId: string | null
  currentCompany: string | null
  currentRole: string | null
  jobApplications: JobApplicationApi[]
  loadingApps: boolean
  busy: boolean
  onLink: (appId: string | null, company: string | null, role: string | null) => Promise<void>
  onClose: () => void
}

export default function CvLinkApplicationModal({
  currentAppId,
  currentCompany,
  currentRole,
  jobApplications,
  loadingApps,
  busy,
  onLink,
  onClose,
}: CvLinkApplicationModalProps) {
  const [mode, setMode] = useState<'app' | 'manual'>(currentAppId ? 'app' : 'manual')
  const [selectedAppId, setSelectedAppId] = useState(currentAppId ?? '')
  const [manualCompany, setManualCompany] = useState(currentCompany ?? '')
  const [manualRole, setManualRole] = useState(currentRole ?? '')

  useEffect(() => {
    if (jobApplications.length > 0 && !currentAppId) setMode('app')
  }, [jobApplications.length, currentAppId])

  async function handleConfirm() {
    if (mode === 'app') {
      const app = jobApplications.find(a => a.id === selectedAppId)
      await onLink(
        selectedAppId || null,
        app?.company ?? null,
        app?.jobTitle ?? null,
      )
    } else {
      await onLink(null, manualCompany || null, manualRole || null)
    }
  }

  async function handleUnlink() {
    await onLink(null, null, null)
  }

  const hasLink = !!(currentAppId || currentCompany || currentRole)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bewerbung verknüpfen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#1a1510] shadow-2xl">
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
            Kontext
          </p>
          <h2 className="mb-4 text-lg font-semibold text-white">Bewerbung verknüpfen</h2>

          {/* Mode selector */}
          <div className="mb-4 flex rounded-lg border border-white/10 bg-black/20 p-0.5">
            {jobApplications.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('app')}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${mode === 'app' ? 'bg-primary/20 text-white' : 'text-stone-400 hover:text-stone-200'}`}
              >
                Aus Bewerbungen
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${mode === 'manual' ? 'bg-primary/20 text-white' : 'text-stone-400 hover:text-stone-200'}`}
            >
              Manuell
            </button>
          </div>

          {loadingApps ? (
            <div className="flex items-center gap-2 py-4 text-xs text-stone-400">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Bewerbungen laden…
            </div>
          ) : mode === 'app' && jobApplications.length > 0 ? (
            <div>
              <label className="block text-xs font-medium text-stone-400">
                Bewerbung
                <select
                  value={selectedAppId}
                  onChange={e => setSelectedAppId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary/60 focus:outline-none"
                >
                  <option value="">— Keine Verknüpfung —</option>
                  {jobApplications.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.company} — {a.jobTitle}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-stone-400">
                Unternehmen
                <input
                  type="text"
                  value={manualCompany}
                  onChange={e => setManualCompany(e.target.value)}
                  placeholder="z. B. Acme GmbH"
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-stone-400">
                Stelle / Rolle
                <input
                  type="text"
                  value={manualRole}
                  onChange={e => setManualRole(e.target.value)}
                  placeholder="z. B. Software Engineer"
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                />
              </label>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            {hasLink && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleUnlink()}
                className="text-xs text-rose-300 hover:text-rose-200 disabled:opacity-40"
              >
                Verknüpfung aufheben
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleConfirm()}
              className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
            >
              {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
