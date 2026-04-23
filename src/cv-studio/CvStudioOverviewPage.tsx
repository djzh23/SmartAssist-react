import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Briefcase,
  Code2,
  FileText,
  Headphones,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  createCvStudioResumeFromTemplate,
  deleteCvStudioPdfExport,
  getCvStudioResumeTemplates,
  listCvStudioPdfExports,
  listCvStudioResumes,
} from '../api/client'
import type { CvStudioPdfExportRow, CvStudioResumeSummary } from '../types'
import type { ResumeTemplateDto } from './cvTypes'

function templateIcon(key: string) {
  if (key === 'software-developer' || key === 'softwareentwickler') return Code2
  if (key === 'it-support') return Headphones
  if (key === 'service-general' || key === 'service-gastro-zustellung') return Briefcase
  return FileText
}

export default function CvStudioOverviewPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [items, setItems] = useState<CvStudioResumeSummary[] | null>(null)
  const [templates, setTemplates] = useState<ResumeTemplateDto[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [pdfRows, setPdfRows] = useState<CvStudioPdfExportRow[]>([])
  const [pdfLimit, setPdfLimit] = useState(0)
  const [pdfUsed, setPdfUsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Kein Sitzungs-Token. Bitte neu anmelden.')
        setItems(null)
        return
      }
      const [rows, tpl, pdf] = await Promise.all([
        listCvStudioResumes(token),
        getCvStudioResumeTemplates(token),
        listCvStudioPdfExports(token).catch(() => ({ rows: [] as CvStudioPdfExportRow[], limit: 0, used: 0 })),
      ])
      setItems(rows)
      setTemplates(tpl)
      setSelectedKey(prev => (prev || tpl[0]?.key || ''))
      setPdfRows(pdf.rows)
      setPdfLimit(pdf.limit)
      setPdfUsed(pdf.used)
    }
    catch (e) {
      setItems(null)
      setError(e instanceof Error ? e.message : 'CV.Studio konnte nicht geladen werden.')
    }
    finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  const createFromTemplate = async () => {
    setBusy(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return
      }
      const key = selectedKey || templates[0]?.key
      if (!key) {
        setError('Keine Vorlage verfügbar.')
        return
      }
      const created = await createCvStudioResumeFromTemplate(token, key)
      navigate(`/cv-studio/edit/${created.id}`)
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Anlegen fehlgeschlagen.')
    }
    finally {
      setBusy(false)
    }
  }

  const deletePdf = async (id: string) => {
    if (!window.confirm('PDF-Eintrag löschen und Kontingent freigeben?')) return
    try {
      const token = await getToken()
      if (!token) return
      await deleteCvStudioPdfExport(token, id)
      await load()
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.')
    }
  }

  return (
    <div className="pb-10">
      <div className="mb-8 flex flex-col gap-2 border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">CV.Studio</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Lebensläufe & PDF-Kontingent
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-400">
          Erstelle eine Arbeitsversion aus einer Vorlage, bearbeite sie im Editor mit Live-Vorschau und exportiere PDFs.
          Gespeicherte PDF-Exports zählen für dein Paket (Free: 3, Premium/Pro: 10) — lösche alte Einträge, um Platz zu schaffen.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <section className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Neue Arbeitsversion</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Loader2 className="animate-spin" size={18} aria-hidden />
            Laden…
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-stone-500">Vorlagen konnten nicht geladen werden.</p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2 sm:grid-cols-3">
              {templates.map(tpl => {
                const Icon = templateIcon(tpl.key)
                const active = selectedKey === tpl.key
                return (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => setSelectedKey(tpl.key)}
                    className={[
                      'flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors',
                      active ? 'border-primary bg-primary/15 text-white' : 'border-white/10 bg-black/20 text-stone-300 hover:border-white/20',
                    ].join(' ')}
                  >
                    <Icon size={20} className="text-primary-light" aria-hidden />
                    <span className="text-sm font-semibold">{tpl.displayName}</span>
                    <span className="text-xs text-stone-500">{tpl.description}</span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createFromTemplate()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {busy ? '…' : 'Arbeitsversion erstellen'}
            </button>
          </div>
        )}
      </section>

      <section className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">PDF-Exports</h2>
          {pdfLimit > 0 ? (
            <span className="text-xs text-stone-400">
              {pdfUsed}/{pdfLimit} genutzt
            </span>
          ) : null}
        </div>
        {pdfRows.length === 0 ? (
          <p className="text-xs text-stone-500">Noch keine PDF-Exports erfasst. Nach jedem PDF-Download erscheint ein Eintrag.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {pdfRows.map(row => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-200">{row.fileLabel}</p>
                  <p className="text-xs text-stone-500">
                    Design {row.design}
                    {row.versionId ? ' · Variante' : ' · Arbeitsversion'}
                    {' · '}
                    {new Date(row.createdAtUtc).toLocaleString('de-DE')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deletePdf(row.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-2 py-1 text-xs text-rose-200 hover:bg-rose-950/40"
                >
                  <Trash2 size={14} aria-hidden />
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Arbeitsversionen</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Loader2 className="animate-spin" size={18} aria-hidden />
            Daten werden geladen…
          </div>
        ) : items && items.length > 0 ? (
          <ul className="space-y-2">
            {items.map(row => (
              <li key={row.id}>
                <Link
                  to={`/cv-studio/edit/${row.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-primary/40 hover:bg-white/[0.06]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary-light">
                      <FileText size={20} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{row.title}</p>
                      <p className="truncate text-xs text-stone-500">
                        {row.templateKey ? `Vorlage: ${row.templateKey}` : 'Ohne Vorlage'}
                        {' · '}
                        {new Date(row.updatedAtUtc).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-primary-light">Bearbeiten →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center">
            <Sparkles className="mx-auto mb-3 text-primary-light/80" size={28} aria-hidden />
            <p className="text-sm font-medium text-stone-200">Noch kein Lebenslauf</p>
            <p className="mt-1 text-xs text-stone-500">Wähle eine Vorlage und lege eine Arbeitsversion an.</p>
          </div>
        )}
      </section>
    </div>
  )
}
