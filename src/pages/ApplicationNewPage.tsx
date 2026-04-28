import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'
import { createJobApplication } from '../api/client'

export default function ApplicationNewPage() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!jobTitle.trim() || !company.trim()) {
      setError('Titel und Firma sind Pflichtfelder.')
      return
    }
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return
      }
      const app = await createJobApplication(token, {
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobUrl: jobUrl.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      })
      navigate(`/applications/${app.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link
          to="/applications"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Zurück zur Übersicht
        </Link>
        <div className="mb-6 flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Neue Bewerbung</h1>
          <InfoExplainerButton
            variant="onLight"
            modalTitle="Neue Bewerbung anlegen"
            ariaLabel="Hinweise zu den Feldern beim Anlegen"
            className="text-slate-500 hover:bg-slate-200/80 hover:text-slate-900"
          >
            <p>
              <span className="font-semibold text-slate-900">Titel und Firma</span>
              {' '}
              sind Pflicht - sie erscheinen in der Pipeline und in den Details.
            </p>
            <p className="mt-3">
              <span className="font-semibold text-slate-900">Link und Stellentext</span>
              {' '}
              sind optional; der Stellentext (bis 3000 Zeichen) hilft später bei Analyse und Interview direkt in der
              Bewerbung.
            </p>
          </InfoExplainerButton>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Stellentitel</label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-primary focus:ring-2"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="z. B. Senior React Developer"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Firma</label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-primary focus:ring-2"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="z. B. SAP"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Link zur Anzeige (optional)</label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-primary focus:ring-2"
              value={jobUrl}
              onChange={e => setJobUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Stellentext (optional, max. 3000 Zeichen)</label>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-primary focus:ring-2"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value.slice(0, 3000))}
              placeholder="Relevante Ausschnitte aus der Stellenanzeige…"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : null}
            Anlegen
          </button>
        </form>
      </div>
    </div>
  )
}
