import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import { blogPosts } from '../content/blog/posts'
import '../styles/landing.css'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function BlogIndexPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[760px] px-5 pb-16 pt-24 sm:pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">Ratgeber</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-stone-50 sm:text-4xl">
          Bewerbung vorbereiten, ohne die Anzeige zu überfliegen
        </h1>
        <p className="mt-4 max-w-[560px] text-sm leading-relaxed text-stone-400 sm:text-base">
          Kurze Texte zur Stellenanalyse, zum Lebenslauf und zum Abgleich mit echten Ausschreibungen.
          Für Jobsuchende in Pflege, Vertrieb, Büro, Handwerk, Bildung, IT und anderen Berufen.
        </p>

        <ul className="mt-10 space-y-4">
          {blogPosts.map(post => (
            <li key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                className="block rounded-2xl border border-stone-600/35 bg-white/[0.03] p-5 transition hover:border-amber-500/30 hover:bg-white/[0.05]"
              >
                <p className="text-[11px] text-stone-500">
                  {formatDate(post.date)} · {post.readingMinutes} Min. Lesezeit
                </p>
                <h2 className="mt-2 text-lg font-semibold text-stone-50">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">{post.description}</p>
                <p className="mt-3 text-sm font-medium text-amber-300">Artikel lesen</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
