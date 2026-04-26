import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Lightbulb, ListOrdered } from 'lucide-react'
import { guideBySlug, GUIDE_CATEGORY_META } from '../../content/guides'

export default function GuideArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? guideBySlug(slug) : undefined

  if (!article) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-stone-400/40 bg-app-parchment/95 px-6 py-12 text-center shadow-landing">
          <p className="text-stone-700">Artikel nicht gefunden.</p>
          <Link to="/guides" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  const catMeta = GUIDE_CATEGORY_META[article.category]

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6">
          <Link
            to="/guides"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Alle Ratgeber
          </Link>

          <article>
            <div
              className={[
                'mb-5 rounded-xl border border-stone-400/40 bg-white/95 px-4 py-3 shadow-card sm:px-5 sm:py-3.5',
                catMeta.articleMetaClass,
              ].join(' ')}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                    catMeta.chipClass,
                  ].join(' ')}
                >
                  {catMeta.label}
                </span>
                {typeof article.readingMinutes === 'number' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    ca. {article.readingMinutes} Min. Lesezeit
                  </span>
                ) : null}
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{article.title}</h1>
            {article.subtitle ? (
              <p className="mb-4 text-base font-medium leading-relaxed text-stone-700 sm:text-lg">{article.subtitle}</p>
            ) : null}
            <p className="mb-8 text-sm leading-relaxed text-stone-700 sm:text-base">{article.intro}</p>

            {article.highlights && article.highlights.length > 0 ? (
              <div className="mb-10 rounded-xl border border-amber-200/70 bg-primary-light/80 px-4 py-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-600">
                  <Lightbulb className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Wichtig auf einen Blick
                </div>
                <ul className="space-y-2.5 text-sm leading-relaxed text-stone-900">
                  {article.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="font-bold text-primary" aria-hidden>
                        •
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {article.steps && article.steps.length > 0 ? (
              <div className="mb-10 space-y-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                  <ListOrdered className="h-4 w-4 text-primary" aria-hidden />
                  Schritte
                </h2>
                {article.steps.map((block, bi) => (
                  <div
                    key={bi}
                    className="rounded-xl border border-stone-400/40 bg-white/95 px-4 py-4 shadow-card sm:px-5 sm:py-5"
                  >
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                      {block.title}
                    </h3>
                    <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-stone-800 marker:font-semibold marker:text-primary">
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
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                  {section.heading}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-stone-800">
                  {section.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ))}

            {article.examples && article.examples.length > 0 ? (
              <div className="mt-10 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Beispiele</h2>
                {article.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-amber-200/80 bg-white/90 shadow-card"
                  >
                    <div className="border-b border-amber-200/70 bg-primary-light/70 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-stone-800">
                      {ex.label}
                    </div>
                    <pre className="whitespace-pre-wrap break-words bg-app-parchment/50 px-3 py-3 font-mono text-[13px] leading-relaxed text-stone-800">
                      {ex.body}
                    </pre>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        </div>
      </div>
    </div>
  )
}
