import { ExternalLink, Trash2 } from 'lucide-react'
import AppCtaButton from '../ui/AppCtaButton'
import { inboxSourceLabel, type InboxJobListItem } from '../../api/inboxClient'

interface Props {
  jobs: InboxJobListItem[]
  activeId: string | null
  loadingId: string | null
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

function relativeWhen(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (sec < 60) return 'gerade eben'
  const min = Math.round(sec / 60)
  if (min < 60) return `vor ${min} Min.`
  const hours = Math.round(min / 60)
  if (hours < 24) return `vor ${hours} Std.`
  try {
    return new Date(iso).toLocaleDateString('de-DE', { dateStyle: 'medium' })
  } catch {
    return ''
  }
}

export default function AnalyzeInboxList({ jobs, activeId, loadingId, onOpen, onDelete }: Props) {
  if (jobs.length === 0) return null

  return (
    <section className="mx-auto mb-5 w-full max-w-[820px]" aria-labelledby="inbox-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="inbox-heading" className="text-sm font-semibold text-[#f5f1eb]">
          Gespeicherte Stellen
        </h2>
        <p className="text-xs text-[#a89e91]">Öffnen, prüfen, dann selbst analysieren oder löschen</p>
      </div>
      <ul className="flex flex-col gap-2">
        {jobs.map(job => {
          const active = job.id === activeId
          return (
            <li
              key={job.id}
              className={[
                'rounded-2xl border bg-[#232019] p-4',
                active ? 'border-[#d97757]' : 'border-[#3a332d]',
              ].join(' ')}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium leading-snug text-[#f5f1eb]">{job.title}</p>
                  <p className="mt-0.5 text-sm text-[#a89e91]">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[#8a7f70]">
                    {inboxSourceLabel(job.sourceKind)}
                    {relativeWhen(job.extractedAt) ? ` · ${relativeWhen(job.extractedAt)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {job.sourceUrl ? (
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#a89e91] transition hover:bg-white/[0.06] hover:text-[#f0ebe0]"
                      aria-label="Originalanzeige oeffnen"
                    >
                      <ExternalLink size={16} aria-hidden />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onDelete(job.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#a89e91] transition hover:bg-white/[0.06] hover:text-[#e89372]"
                    aria-label="Stelle entfernen"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                  <AppCtaButton
                    size="sm"
                    variant="secondary"
                    onClick={() => onOpen(job.id)}
                    loading={loadingId === job.id}
                    disabled={loadingId !== null && loadingId !== job.id}
                  >
                    Öffnen
                  </AppCtaButton>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
