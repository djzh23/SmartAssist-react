import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Clock } from 'lucide-react'
import { GUIDE_ARTICLES, GUIDE_CATEGORY_META, GUIDE_CATEGORY_ORDER } from '../../content/guides'

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-10 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <BookOpen className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ratgeber</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Schritt-für-Schritt durch PrivatePrep: Profil, Bewerbungen, Chat-Tools und Interview — mit Beispielen und
            klaren Reihenfolgen.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {GUIDE_CATEGORY_ORDER.map(category => {
          const articles = GUIDE_ARTICLES.filter(a => a.category === category)
          if (articles.length === 0) return null
          const meta = GUIDE_CATEGORY_META[category]
          return (
            <section key={category} aria-labelledby={`guide-cat-${category}`}>
              <div
                className={`mb-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/80 py-3 pl-4 pr-4 shadow-sm ${meta.accentClass}`}
              >
                <h2 id={`guide-cat-${category}`} className="text-base font-bold text-slate-900">
                  {meta.label}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">{meta.description}</p>
              </div>
              <ul className="flex flex-col gap-2">
                {articles.map(article => (
                  <li key={article.slug}>
                    <Link
                      to={`/guides/${article.slug}`}
                      className={`group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-primary/35 hover:bg-primary-light/25 ${meta.accentClass}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.chipClass}`}
                          >
                            {meta.label}
                          </span>
                          {typeof article.readingMinutes === 'number' ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                              <Clock className="h-3 w-3" aria-hidden />
                              ca. {article.readingMinutes} Min.
                            </span>
                          ) : null}
                        </div>
                        <span className="font-medium text-slate-900">{article.title}</span>
                        {article.subtitle ? (
                          <p className="mt-0.5 text-sm text-slate-600">{article.subtitle}</p>
                        ) : (
                          <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{article.intro}</p>
                        )}
                      </div>
                      <ChevronRight
                        className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
