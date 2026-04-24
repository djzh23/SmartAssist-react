import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, Briefcase, FileText, Loader2, Sparkles } from 'lucide-react'
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
      if (job) setAppLabel(`${job.company} — ${job.jobTitle}`)
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
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Welchen CV als Basis?</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-stone-400">
          <Briefcase size={16} className="shrink-0 text-amber-400/90" aria-hidden />
          {appLabel}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">
          Wähle einen bestehenden Lebenslauf zum Ableiten oder lege einen neuen aus einer Vorlage an. Der CV wird mit
          dieser Bewerbung verknüpft; der Anzeigename setzt sich aus Firma und Rolle.
        </p>
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
          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold text-white">Bestehende Lebensläufe</h2>
            {resumes.length === 0 ? (
              <p className="text-sm text-stone-500">Noch keine anderen CVs — nutze unten eine Vorlage.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {resumes.map(r => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
                  >
                    <p className="font-medium text-stone-100">{r.title}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {r.targetCompany || r.targetRole
                        ? [r.targetCompany, r.targetRole].filter(Boolean).join(' — ')
                        : 'Kein Kontext'}
                    </p>
                    <button
                      type="button"
                      disabled={creating}
                      onClick={() => void onPickExisting(r.id)}
                      className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                    >
                      {creating ? 'Wird angelegt…' : 'Als Basis verwenden'}
                    </button>
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
