import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight } from 'lucide-react'
import { GUIDE_ARTICLES } from '../../content/guides'

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
          <BookOpen className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ratgeber</h1>
          <p className="text-sm text-slate-600">
            So nutzt du PrivatePrep fokussiert — ohne doppelte Schritte und mit klarem Kontext.
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {GUIDE_ARTICLES.map(article => (
          <li key={article.slug}>
            <Link
              to={`/guides/${article.slug}`}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary-light/30"
            >
              <span className="font-medium text-slate-900">{article.title}</span>
              <ChevronRight
                className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
