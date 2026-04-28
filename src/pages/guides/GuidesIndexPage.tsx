import { Link } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  ChevronRight,
  Clock,
  Compass,
  Layers,
  MessageCircle,
  Mic2,
  Route,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import InfoExplainerButton from '../../components/ui/InfoExplainerButton'
import type { GuideCategory } from '../../content/guides'
import {
  GUIDE_ARTICLES,
  GUIDE_CATEGORY_META,
  GUIDE_CATEGORY_ORDER,
  GUIDE_INDEX_PATH_HINT,
} from '../../content/guides'

const CATEGORY_ICONS: Record<GuideCategory, LucideIcon> = {
  grundlagen: Layers,
  bewerbung: Briefcase,
  chat: MessageCircle,
  interview: Mic2,
}

export default function GuidesIndexPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero */}
        <header className="mb-8 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
                <BookOpen className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">Lernpfad</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                      Ratgeber
                    </h1>
                  </div>
                  <InfoExplainerButton
                    variant="onLight"
                    modalTitle="So nutzt du die Ratgeber"
                    ariaLabel="Ausführliche Erklärung zu den Ratgebern"
                    className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
                  >
                    <p>
                      Jeder Artikel ist auf konkrete Schritte in PrivatePrep ausgelegt: wo du klickst, welche Daten du
                      pflegst und wie Profil, Bewerbungen und Chat zusammenspielen.
                    </p>
                    <p className="mt-3">{GUIDE_INDEX_PATH_HINT}</p>
                    <p className="mt-3 text-stone-600">
                      Nutze die Sprungmarken zu den Themenbereichen, wenn du schon weißt, wonach du suchst - oder lies
                      die Grundlagen zuerst, wenn du neu einsteigst.
                    </p>
                  </InfoExplainerButton>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">
                  Praxisnahe Anleitungen, damit du die App effizient nutzt: weniger Kontext-Chaos, klarere Chats und
                  stimmige Bewerbungsdaten von Anfang an.
                </p>
                <p className="mt-2 flex items-start gap-2 text-sm font-medium text-stone-800">
                  <Route className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{GUIDE_INDEX_PATH_HINT}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sprungmarken */}
          <nav
            className="mt-6 border-t border-stone-400/35 pt-5"
            aria-label="Themenbereiche"
          >
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <Compass className="h-3.5 w-3.5" aria-hidden />
              Direkt zum Thema
            </p>
            <div className="flex flex-wrap gap-2">
              {GUIDE_CATEGORY_ORDER.map(cat => {
                const meta = GUIDE_CATEGORY_META[cat]
                return (
                  <a
                    key={cat}
                    href={`#guides-${cat}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-400/45 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm transition hover:border-primary/45 hover:bg-primary-light/40"
                  >
                    {meta.label}
                  </a>
                )
              })}
            </div>
          </nav>
        </header>

        {/* Kategorien */}
        <div className="flex flex-col gap-8 sm:gap-10">
          {GUIDE_CATEGORY_ORDER.map(category => {
            const articles = GUIDE_ARTICLES.filter(a => a.category === category)
            if (articles.length === 0) return null
            const meta = GUIDE_CATEGORY_META[category]
            const Icon = CATEGORY_ICONS[category]
            return (
              <section
                key={category}
                id={`guides-${category}`}
                aria-labelledby={`guide-cat-${category}`}
                className={`scroll-mt-6 ${meta.indexPanelClass}`}
              >
                <div
                  className={[
                    'rounded-xl border border-stone-400/40 bg-white/92 shadow-card backdrop-blur-sm',
                    meta.headerTopClass,
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5 sm:py-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-400/30 bg-app-parchment/80 text-stone-800 shadow-sm">
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">Themenbereich</p>
                      <h2 id={`guide-cat-${category}`} className="mt-0.5 text-xl font-bold tracking-tight text-stone-900">
                        {meta.label}
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                </div>

                {category === 'bewerbung' && (
                  <div className="mt-4 rounded-xl border border-teal-600/35 bg-gradient-to-r from-teal-50/98 to-white/95 px-4 py-3.5 shadow-sm sm:px-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Hinweis CV.Studio</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-teal-950/90">
                      Vorlagen enthalten nur synthetische Beispieldaten. Du startest mit einer Kopie, füllst deine echten
                      Stationen ein und speicherst - so bleiben fremde Daten aus der App fern.
                    </p>
                    <Link
                      to="/guides/cv-studio-vorlagen-dummy"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:text-primary"
                    >
                      Zum Artikel „Vorlagen mit Beispieldaten“
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                )}

                <ul className="mt-3 space-y-2.5 sm:mt-4">
                  {articles.map(article => (
                    <li key={article.slug}>
                      <Link
                        to={`/guides/${article.slug}`}
                        className={[
                          'group flex items-stretch gap-0 overflow-hidden rounded-xl border border-stone-400/40 bg-white/95 text-left shadow-card transition',
                          'hover:border-stone-400/55 hover:shadow-landing-md',
                          meta.cardLeftClass,
                        ].join(' ')}
                      >
                        <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5 sm:px-5 sm:py-4">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                meta.chipClass,
                              ].join(' ')}
                            >
                              {meta.label}
                            </span>
                            {typeof article.readingMinutes === 'number' ? (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stone-500">
                                <Clock className="h-3 w-3" aria-hidden />
                                ca. {article.readingMinutes} Min.
                              </span>
                            ) : null}
                          </div>
                          <span className="text-base font-semibold leading-snug text-stone-900 group-hover:text-primary">
                            {article.title}
                          </span>
                          {article.subtitle ? (
                            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{article.subtitle}</p>
                          ) : (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-600">
                              {article.intro}
                            </p>
                          )}
                        </div>
                        <div className="flex w-11 shrink-0 items-center justify-center border-l border-stone-400/30 bg-app-parchment/50 sm:w-12">
                          <ChevronRight
                            className="h-5 w-5 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-primary"
                            aria-hidden
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
