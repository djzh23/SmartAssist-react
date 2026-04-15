import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Lightbulb, ListOrdered } from 'lucide-react'
import { guideBySlug, GUIDE_CATEGORY_META } from '../../content/guides'

export default function GuideArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? guideBySlug(slug) : undefined

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-600">Artikel nicht gefunden.</p>
        <Link to="/guides" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Zur Übersicht
        </Link>
      </div>
    )
  }

  const catMeta = GUIDE_CATEGORY_META[article.category]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/guides"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Alle Ratgeber
      </Link>

      <article>
        <div className={`mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm ${catMeta.accentClass}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${catMeta.chipClass}`}
            >
              {catMeta.label}
            </span>
            {typeof article.readingMinutes === 'number' ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                ca. {article.readingMinutes} Min. Lesezeit
              </span>
            ) : null}
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">{article.title}</h1>
        {article.subtitle ? <p className="mb-4 text-lg text-slate-600">{article.subtitle}</p> : null}
        <p className="mb-8 text-base leading-relaxed text-slate-600">{article.intro}</p>

        {article.highlights && article.highlights.length > 0 ? (
          <div className="mb-10 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-900">
              <Lightbulb className="h-4 w-4 flex-shrink-0" aria-hidden />
              Wichtig auf einen Blick
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-violet-950">
              {article.highlights.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-violet-600" aria-hidden>
                    •
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {article.steps && article.steps.length > 0 ? (
          <div className="mb-10 space-y-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ListOrdered className="h-5 w-5 text-primary" aria-hidden />
              Schritte
            </h2>
            {article.steps.map((block, bi) => (
              <div
                key={bi}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/90 px-4 py-4 shadow-sm"
              >
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{block.title}</h3>
                <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-slate-800 marker:font-semibold marker:text-primary">
                  {block.items.map((item, ii) => (
                    <li key={ii} className="pl-1">
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : null}

        {article.sections.map(section => (
          <section key={section.heading} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">{section.heading}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        {article.examples && article.examples.length > 0 ? (
          <div className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Beispiele</h2>
            {article.examples.map((ex, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/40 shadow-sm"
              >
                <div className="border-b border-amber-200/80 bg-amber-100/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-950">
                  {ex.label}
                </div>
                <pre className="whitespace-pre-wrap break-words px-3 py-3 font-mono text-[13px] leading-relaxed text-slate-800">
                  {ex.body}
                </pre>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  )
}
