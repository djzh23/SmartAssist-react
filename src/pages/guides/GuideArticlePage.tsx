import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { guideBySlug } from '../../content/guides'

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
        <h1 className="mb-3 text-3xl font-bold text-slate-900">{article.title}</h1>
        <p className="mb-8 text-base leading-relaxed text-slate-600">{article.intro}</p>
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
      </article>
    </div>
  )
}
