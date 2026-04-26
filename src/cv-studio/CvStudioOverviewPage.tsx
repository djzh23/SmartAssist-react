import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import {
  createCvStudioResume,
  createCvStudioResumeFromTemplate,
  createJobApplication,
  deleteCvStudioPdfExport,
  deleteCvStudioResume,
  fetchJobApplications,
  getCvStudioResume,
  getCvStudioResumeTemplates,
  linkCvStudioJobApplication,
  listCvStudioPdfExports,
  listCvStudioResumes,
  type JobApplicationApi,
} from '../api/client'
import { useAppUi } from '../context/AppUiContext'
import type { CvStudioPdfExportRow, CvStudioResumeSummary } from '../types'
import type { ResumeTemplateDto } from './cvTypes'
import { filterGroups, groupResumes, type CvResumeGroup } from './lib/cvStudioGroups'
import CvApplicationGroup, { type CvGroupVisualVariant } from './components/overview/CvApplicationGroup'
import CvCreateDialog, { type CreateParams } from './components/overview/CvCreateDialog'
import CvExportHistory from './components/overview/CvExportHistory'
import CvQuotaBadge from './components/overview/CvQuotaBadge'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'

function groupVariantForCvGroup(g: CvResumeGroup): CvGroupVisualVariant {
  if (g.isUnlinked) return 'general'
  if (g.applicationId) return 'linked'
  return 'context'
}

export default function CvStudioOverviewPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const forApplication = searchParams.get('forApplication')
  const { getToken } = useAuth()
  const { requestConfirm } = useAppUi()

  // ── Data state ────────────────────────────────────────────────────────────
  const [resumes, setResumes] = useState<CvStudioResumeSummary[] | null>(null)
  const [templates, setTemplates] = useState<ResumeTemplateDto[]>([])
  const [jobApplications, setJobApplications] = useState<JobApplicationApi[]>([])
  const [pdfRows, setPdfRows] = useState<CvStudioPdfExportRow[]>([])
  const [pdfLimit, setPdfLimit] = useState(0)
  const [pdfUsed, setPdfUsed] = useState(0)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [prefillGroup, setPrefillGroup] = useState<CvResumeGroup | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Kein Sitzungs-Token. Bitte neu anmelden.')
        return
      }
      const [rows, tpl, pdf, apps] = await Promise.all([
        listCvStudioResumes(token),
        getCvStudioResumeTemplates(token),
        listCvStudioPdfExports(token).catch(() => ({
          rows: [] as CvStudioPdfExportRow[],
          limit: 0,
          used: 0,
        })),
        fetchJobApplications(token).catch(() => [] as JobApplicationApi[]),
      ])
      setResumes(rows)
      setTemplates(tpl)
      setPdfRows(pdf.rows)
      setPdfLimit(pdf.limit)
      setPdfUsed(pdf.used)
      setJobApplications(apps)
    } catch (e) {
      setResumes(null)
      setError(e instanceof Error ? e.message : 'CV.Studio konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  /** Tracker „CV anzeigen“: vorhandenen CV öffnen oder Basiswahl-Seite. */
  useEffect(() => {
    if (!forApplication || loading || resumes === null) return

    const linked = resumes.find(r => r.linkedJobApplicationId === forApplication)
    if (linked) {
      navigate(`/cv-studio/edit/${linked.id}`, { replace: true })
      return
    }

    navigate(`/cv-studio/basis/${encodeURIComponent(forApplication)}`, { replace: true })
    setSearchParams(
      prev => {
        const p = new URLSearchParams(prev)
        p.delete('forApplication')
        return p
      },
      { replace: true },
    )
  }, [forApplication, loading, resumes, navigate, setSearchParams])

  // ── Create resume ─────────────────────────────────────────────────────────
  async function handleCreate(params: CreateParams) {
    const token = await getToken()
    if (!token) throw new Error('Kein Sitzungs-Token. Bitte neu anmelden.')

    let linkedJobApplicationId = params.linkedJobApplicationId
    if (
      params.createJobApplicationEntry &&
      params.targetCompany?.trim() &&
      params.targetRole?.trim()
    ) {
      const app = await createJobApplication(token, {
        company: params.targetCompany.trim(),
        jobTitle: params.targetRole.trim(),
        jobUrl: params.jobUrl?.trim() || undefined,
      })
      linkedJobApplicationId = app.id
    }

    const linkPayload =
      linkedJobApplicationId || params.targetCompany?.trim() || params.targetRole?.trim()
        ? {
            jobApplicationId: linkedJobApplicationId ?? null,
            targetCompany: params.targetCompany?.trim() || null,
            targetRole: params.targetRole?.trim() || null,
          }
        : null

    let created
    if (params.cloneFromId) {
      const source = await getCvStudioResume(token, params.cloneFromId)
      created = await createCvStudioResume(token, {
        title: `Kopie von ${source.title}`,
        templateKey: source.templateKey ?? params.templateKey,
        resumeData: source.resumeData,
      })
      if (linkPayload)
        await linkCvStudioJobApplication(token, created.id, linkPayload)
    } else {
      created = await createCvStudioResumeFromTemplate(token, params.templateKey, linkPayload)
    }

    navigate(`/cv-studio/edit/${created.id}`)
  }

  async function handleDeleteResume(resume: CvStudioResumeSummary) {
    const ok = await requestConfirm({
      title: 'Lebenslauf löschen?',
      message:
        `„${resume.title}“ wirklich löschen?\n\nAlle gespeicherten Snapshots (Versionen) dieses Lebenslaufs werden mit entfernt. Zugehörige PDF-Export-Einträge in der Liste werden ebenfalls gelöscht.`,
      confirmLabel: 'Endgültig löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!ok) return
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return
    }
    try {
      await deleteCvStudioResume(token, resume.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.')
    }
  }

  // ── Delete PDF export ─────────────────────────────────────────────────────
  async function handleDeletePdf(id: string) {
    const token = await getToken()
    if (!token) return
    await deleteCvStudioPdfExport(token, id)
    await load()
  }

  // ── Open dialog ───────────────────────────────────────────────────────────
  function openDialog(group?: CvResumeGroup) {
    setPrefillGroup(group ?? null)
    setShowDialog(true)
  }

  async function confirmThenOpenCreateForGroup(group: CvResumeGroup) {
    if (group.resumes.length >= 2) {
      const ok = await requestConfirm({
        title: 'Weitere CV-Version?',
        message:
          'In dieser Gruppe liegen schon mehrere Lebensläufe. Ein weiterer lohnt sich meist für eine klar andere Variante (andere Zielstelle, kürzeres Layout, zweisprachig). Ohne konkreten Zweck entstehen leicht Dubletten. Trotzdem anlegen?',
        confirmLabel: 'Ja, anlegen',
        cancelLabel: 'Abbrechen',
      })
      if (!ok) return
    }
    openDialog(group)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const groups = resumes ? groupResumes(resumes) : []
  const filteredGroups = filterGroups(groups, searchQuery)
  const linkedCvGroups = filteredGroups.filter(g => g.applicationId && !g.isUnlinked)
  const otherCvGroups = filteredGroups.filter(g => !g.applicationId || g.isUnlinked)

  const defaultOpenCount = 3
  const hasResumes = (resumes?.length ?? 0) > 0

  const existingResumes = (resumes ?? []).map(r => ({ id: r.id, title: r.title }))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-10">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-2 border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">
          CV.Studio
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Lebensläufe
              </h1>
              <InfoExplainerButton
                variant="onDark"
                trigger="hint"
                modalTitle="So funktioniert CV.Studio"
                ariaLabel="Hinweis: Ablauf CV.Studio"
                className="border-white/20 text-stone-200 hover:bg-white/12"
              >
                <p>
                  Pro Bewerbung oder Kontext eine <strong>Arbeitsversion</strong>: du bearbeitest im Editor, speicherst
                  Zwischenstände als Versionen und kannst optional dieselbe Bewerbungs-ID wie unter „Meine
                  Bewerbungen“ nutzen.
                </p>
                <p className="mt-3">
                  <strong>Speichern:</strong> im Editor oben rechts „Jetzt speichern“ — dazu läuft Auto-Save im
                  Hintergrund.
                </p>
                <p className="mt-3">
                  <strong>Vorlagen</strong> starten mit anonymen Beispieldaten. Nach dem ersten Speichern gehört der
                  Inhalt nur dir — Platzhalter durch echte Daten ersetzen. Mehr dazu im{' '}
                  <Link to="/guides/cv-studio-vorlagen-dummy" className="font-semibold text-primary hover:underline">
                    Ratgeber
                  </Link>
                  .
                </p>
              </InfoExplainerButton>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Eine Kachel = eine Bewerbung oder ein freier Bereich. Darin liegen deine CV-Versionen — weniger
              Datei-Chaos, klarer Bezug zur Stelle.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => openDialog()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Plus size={16} aria-hidden />
              Neuer Lebenslauf
            </button>
            <CvQuotaBadge used={pdfUsed} limit={pdfLimit} />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm text-stone-400">
          <Loader2 className="animate-spin" size={18} aria-hidden />
          Daten werden geladen…
        </div>
      )}

      {/* Resume groups */}
      {!loading && resumes !== null && (
        <>
          {hasResumes && (
            <div className="mb-4">
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="CVs durchsuchen…"
                className="w-full max-w-sm rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
              />
            </div>
          )}

          {filteredGroups.length > 0 ? (
            <div className="mb-8 space-y-10">
              {linkedCvGroups.length > 0 && (
                <section className="scroll-mt-4" aria-labelledby="cv-studio-section-pipeline">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-2">
                    <h2
                      id="cv-studio-section-pipeline"
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-300"
                    >
                      Mit Bewerbung verknüpft
                    </h2>
                    <InfoExplainerButton
                      variant="onDark"
                      trigger="hint"
                      modalTitle="Mit Bewerbung verknüpft"
                      ariaLabel="Hinweis: CVs mit Bewerbung"
                      className="border-white/15 text-stone-200 hover:bg-white/10"
                    >
                      <p>
                        Jede Kachel gehört zu genau einer Zeile in „Meine Bewerbungen“. Alle CVs darin sind Versionen
                        für dieselbe Stelle — ideal, um Anschreiben und Lebenslauf konsistent zu halten.
                      </p>
                      <p className="mt-3">
                        Nutze <strong>„Weiteren CV …“</strong> nur, wenn du wirklich eine zweite Variante brauchst
                        (z. B. Kurzfassung oder andere Struktur).
                      </p>
                    </InfoExplainerButton>
                  </div>
                  <div className="space-y-2.5">
                    {linkedCvGroups.map((group, idx) => (
                      <CvApplicationGroup
                        key={group.key}
                        group={group}
                        variant="linked"
                        defaultOpen={idx < defaultOpenCount}
                        onCreateResume={confirmThenOpenCreateForGroup}
                        onDeleteResume={handleDeleteResume}
                      />
                    ))}
                  </div>
                </section>
              )}

              {otherCvGroups.length > 0 && (
                <section className="scroll-mt-4" aria-labelledby="cv-studio-section-standalone">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-2">
                    <h2
                      id="cv-studio-section-standalone"
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-300"
                    >
                      Allgemein & ohne Pipeline-ID
                    </h2>
                    <InfoExplainerButton
                      variant="onDark"
                      trigger="hint"
                      modalTitle="Allgemeine CVs und Kontext"
                      ariaLabel="Hinweis: CVs ohne Bewerbung"
                      className="border-white/15 text-stone-200 hover:bg-white/10"
                    >
                      <p>
                        Hier liegen Vorlagen, freie Varianten oder CVs, denen nur ein Firmen-/Rollenname mitgegeben
                        wurde — <strong>ohne</strong> feste ID aus der Bewerbungs-Pipeline.
                      </p>
                      <p className="mt-3">
                        Wenn du eine echte Bewerbung tracken willst, lege sie unter „Meine Bewerbungen“ an und verknüpfe
                        den CV dort — dann erscheint er oben unter „Mit Bewerbung verknüpft“.
                      </p>
                    </InfoExplainerButton>
                  </div>
                  <div className="space-y-2.5">
                    {otherCvGroups.map((group, idx) => (
                      <CvApplicationGroup
                        key={group.key}
                        group={group}
                        variant={groupVariantForCvGroup(group)}
                        defaultOpen={idx < 2}
                        onCreateResume={confirmThenOpenCreateForGroup}
                        onDeleteResume={handleDeleteResume}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : hasResumes ? (
            <p className="mb-8 text-sm text-stone-500">
              Keine Treffer für „{searchQuery}".
            </p>
          ) : (
            <div className="mb-8 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-12 text-center">
              <Sparkles className="mx-auto mb-3 text-primary-light/80" size={28} aria-hidden />
              <p className="text-sm font-medium text-stone-200">Noch kein Lebenslauf</p>
              <p className="mt-1 text-xs text-stone-500">
                Lege deinen ersten Lebenslauf an.
              </p>
              <button
                type="button"
                onClick={() => openDialog()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                <Plus size={15} aria-hidden />
                Neuer Lebenslauf
              </button>
            </div>
          )}

          {/* PDF export history */}
          <CvExportHistory
            rows={pdfRows}
            used={pdfUsed}
            limit={pdfLimit}
            onDelete={handleDeletePdf}
            requestConfirm={requestConfirm}
          />
        </>
      )}

      {/* Create dialog */}
      {showDialog && (
        <CvCreateDialog
          templates={templates}
          jobApplications={jobApplications}
          prefillGroup={prefillGroup}
          existingResumes={existingResumes}
          onConfirm={async params => {
            await handleCreate(params)
          }}
          onClose={() => {
            setShowDialog(false)
            setPrefillGroup(null)
          }}
        />
      )}
    </div>
  )
}
