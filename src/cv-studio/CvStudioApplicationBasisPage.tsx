import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, Briefcase, CheckCircle2, FileText, Loader2, Sparkles } from 'lucide-react'
import AppCtaButton from '../components/ui/AppCtaButton'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'
import {
  createCvStudioResume,
  createCvStudioResumeFromTemplate,
  fetchJobApplication,
  getCvStudioResume,
  getCvStudioResumeTemplates,
  linkCvStudioJobApplication,
  listCvStudioResumes,
} from '../api/client'
import type { CvStudioResumeSummary } from '../types'
import type { ResumeTemplateDto } from './cvTypes'
import type { CreateParams } from './components/overview/CvCreateDialog'

export default function CvStudioApplicationBasisPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appLabel, setAppLabel] = useState('')
  const [resumes, setResumes] = useState<CvStudioResumeSummary[]>([])
  const [templates, setTemplates] = useState<ResumeTemplateDto[]>([])
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!applicationId) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return
      }
      const [rows, tpl, job] = await Promise.all([
        listCvStudioResumes(token),
        getCvStudioResumeTemplates(token),
        fetchJobApplication(token, applicationId).catch(() => null),
      ])
      setResumes(rows)
      setTemplates(tpl)
      if (job) setAppLabel(`${job.company} - ${job.jobTitle}`)
      else setAppLabel('Bewerbung')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }, [applicationId, getToken])

  useEffect(() => {
    void load()
  }, [load])

  const { linkedForApp, otherResumes } = useMemo(() => {
    if (!applicationId)
      return { linkedForApp: [] as CvStudioResumeSummary[], otherResumes: [] as CvStudioResumeSummary[] }
    const linked = resumes.filter(r => r.linkedJobApplicationId === applicationId)
    const linkedIds = new Set(linked.map(r => r.id))
    return {
      linkedForApp: linked,
      otherResumes: resumes.filter(r => !linkedIds.has(r.id)),
    }
  }, [resumes, applicationId])

  async function runCreate(params: CreateParams) {
    const token = await getToken()
    if (!token) throw new Error('Kein Sitzungs-Token.')

    const link = {
      jobApplicationId: params.linkedJobApplicationId ?? applicationId ?? null,
      targetCompany: params.targetCompany ?? null,
      targetRole: params.targetRole ?? null,
    }

    let created
    if (params.cloneFromId) {
      const source = await getCvStudioResume(token, params.cloneFromId)
      created = await createCvStudioResume(token, {
        title: (appLabel || `Kopie von ${source.title}`).slice(0, 160),
        templateKey: source.templateKey ?? params.templateKey,
        resumeData: source.resumeData,
      })
      await linkCvStudioJobApplication(token, created.id, link)
    } else {
      created = await createCvStudioResumeFromTemplate(token, params.templateKey, link)
    }

    navigate(`/cv-studio/edit/${created.id}`, { replace: true })
  }

  async function onPickExisting(resumeId: string) {
    if (!applicationId) return
    setCreating(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Kein Sitzungs-Token.')
      const job = await fetchJobApplication(token, applicationId).catch(() => null)
      await runCreate({
        templateKey: templates[0]?.key ?? 'software-developer',
        cloneFromId: resumeId,
        linkedJobApplicationId: applicationId,
        targetCompany: job?.company ?? undefined,
        targetRole: job?.jobTitle ?? undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anlegen fehlgeschlagen.')
    } finally {
      setCreating(false)
    }
  }

  async function onPickTemplate(templateKey: string) {
    if (!applicationId) return
    setCreating(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Kein Sitzungs-Token.')
      const job = await fetchJobApplication(token, applicationId).catch(() => null)
      await runCreate({
        templateKey,
        linkedJobApplicationId: applicationId,
        targetCompany: job?.company ?? undefined,
        targetRole: job?.jobTitle ?? undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anlegen fehlgeschlagen.')
    } finally {
      setCreating(false)
    }
  }

  if (!applicationId) {
    return <p className="text-sm text-stone-500">Keine Bewerbungs-ID.</p>
  }

  return (
    <div className="pb-12">
      <Link
        to={`/applications/${encodeURIComponent(applicationId)}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-300"
      >
        <ArrowLeft size={13} aria-hidden />
        Zurück zur Bewerbung
      </Link>

      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">CV.Studio</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Welchen CV als Basis?</h1>
          <InfoExplainerButton
            variant="onDark"
            modalTitle="CV-Basis für diese Bewerbung"
            ariaLabel="Erklärung zur Auswahl des Lebenslaufs"
            className="shrink-0"
          >
            <p>
              Ist schon ein CV mit dieser Bewerbung verknüpft, öffnest du ihn direkt in der Liste unten. Optional kannst
              du einen anderen Lebenslauf als Kopie übernehmen (neue Arbeitsversion + Verknüpfung) oder neu aus einer
              Vorlage starten.
            </p>
          </InfoExplainerButton>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-stone-400">
          <Briefcase size={16} className="shrink-0 text-amber-400/90" aria-hidden />
          {appLabel}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">Verknüpft, kopieren oder neu - Details über das Info-Symbol.</p>
      </div>

      {error ? (
        <div role="alert" className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-stone-400">
          <Loader2 className="animate-spin" size={20} aria-hidden />
          Lädt…
        </div>
      ) : (
        <>
          {linkedForApp.length > 0 ? (
            <section className="mb-10 rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-5">
              <h2 className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-100">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-400" aria-hidden />
                Verknüpfter Lebenslauf für diese Bewerbung
                <InfoExplainerButton
                  variant="onDark"
                  modalTitle="Verknüpfter Lebenslauf"
                  ariaLabel="Erklärung zum verknüpften Lebenslauf"
                  className="text-emerald-200/90 hover:bg-emerald-950/60 hover:text-emerald-50"
                >
                  <p>
                    Dieser Eintrag ist mit dieser Stelle verknüpft - hier weiterbearbeiten, statt einen neuen Ableger
                    anzulegen.
                  </p>
                </InfoExplainerButton>
              </h2>
              <ul className="space-y-4">
                {linkedForApp.map(r => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 rounded-lg border border-emerald-500/20 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white">{r.title}</p>
                      <p className="mt-1 text-xs text-stone-500">Mit dieser Bewerbung verknüpft.</p>
                    </div>
                    <AppCtaButton
                      disabled={creating}
                      onClick={() => navigate(`/cv-studio/edit/${encodeURIComponent(r.id)}`, { replace: true })}
                      className="shrink-0"
                    >
                      CV öffnen
                    </AppCtaButton>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mb-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                {linkedForApp.length > 0
                  ? 'Weitere Lebensläufe - als Kopie übernehmen'
                  : 'Bestehende Lebensläufe'}
              </h2>
              <InfoExplainerButton
                variant="onDark"
                modalTitle="Weitere oder erste Lebensläufe"
                ariaLabel="Erklärung zu Kopie, Vorlage und leerer Liste"
                className="shrink-0"
              >
                <p>
                  Wenn bereits ein CV mit dieser Bewerbung verknüpft ist, kannst du hier einen anderen Lebenslauf als
                  Kopie übernehmen (neue Version + Verknüpfung) oder unten neu aus einer Vorlage starten.
                </p>
                <p className="mt-3">
                  Ohne jeglichen CV im Konto: wähle unten eine Vorlage - der neue Lebenslauf wird mit dieser Bewerbung
                  verknüpft.
                </p>
              </InfoExplainerButton>
            </div>
            {otherResumes.length === 0 ? (
              <p className="text-sm text-stone-500">
                {linkedForApp.length > 0 ? 'Keine weiteren CVs.' : 'Noch keine CVs.'}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {otherResumes.map(r => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
                  >
                    <p className="font-medium text-stone-100">{r.title}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {r.targetCompany || r.targetRole
                        ? [r.targetCompany, r.targetRole].filter(Boolean).join(' - ')
                        : 'Kein Kontext'}
                    </p>
                    <AppCtaButton
                      size="sm"
                      disabled={creating}
                      onClick={() => void onPickExisting(r.id)}
                      className="mt-3 w-full"
                    >
                      {creating ? 'Wird angelegt…' : 'Als Basis verwenden'}
                    </AppCtaButton>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-primary-light" aria-hidden />
              Neu aus Vorlage
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map(t => (
                <button
                  key={t.key}
                  type="button"
                  disabled={creating}
                  onClick={() => void onPickTemplate(t.key)}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50"
                >
                  <FileText size={18} className="mb-2 text-stone-400" aria-hidden />
                  <p className="font-medium text-stone-100">{t.displayName}</p>
                  <p className="mt-1 text-xs text-stone-500">{t.description}</p>
                </button>
              ))}
            </div>
          </section>

          <p className="mt-10 text-center text-xs text-stone-600">
            <Link to="/cv-studio" className="text-primary-light hover:underline">
              Zur CV.Studio-Übersicht
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
