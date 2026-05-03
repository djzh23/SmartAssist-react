import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  ChevronRight,
  Clock,
  Layers,
  MessageCircle,
  Mic2,
  Search,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import StandardPageContainer from '../../components/layout/StandardPageContainer'
import type { GuideArticle, GuideCategory } from '../../content/guides'
import {
  GUIDE_ARTICLES,
  GUIDE_CATEGORY_META,
  GUIDE_CATEGORY_ORDER,
} from '../../content/guides'

// ── static config ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<GuideCategory, LucideIcon> = {
  grundlagen: Layers,
  bewerbung: Briefcase,
  chat: MessageCircle,
  interview: Mic2,
}

// Ordered flow steps shown in the sidebar
const FLOW_STEPS = GUIDE_CATEGORY_ORDER.map(cat => ({
  cat,
  label: GUIDE_CATEGORY_META[cat].label,
}))

// Pinned "popular" articles by slug
const POPULAR_SLUGS = ['app-effizienz', 'stellenanalyse-chat', 'interview-vorbereitung']

// ── sub-components ────────────────────────────────────────────────────────────

function GuideCard({ article }: { article: GuideArticle }) {
  const meta = GUIDE_CATEGORY_META[article.category]
  return (
    <li>
      <Link
        to={`/guides/${article.slug}`}
        className="group flex items-center gap-3 overflow-hidden rounded-xl bg-[#1e1510]/80 px-4 py-3 ring-1 ring-white/[0.07] transition hover:bg-[#251a13]/80 hover:ring-amber-400/20"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={[
                'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                meta.chipClass,
              ].join(' ')}
            >
              {meta.label}
            </span>
            {typeof article.readingMinutes === 'number' && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-stone-500">
                <Clock size={10} aria-hidden />
                {article.readingMinutes} Min.
              </span>
            )}
          </div>
          <p className="text-sm font-semibold leading-snug text-stone-100 transition-colors group-hover:text-amber-200">
            {article.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
            {article.subtitle ?? article.intro}
          </p>
        </div>
        <ChevronRight
          size={15}
          className="shrink-0 text-stone-600 transition group-hover:translate-x-0.5 group-hover:text-amber-400"
          aria-hidden
        />
      </Link>
    </li>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function GuidesIndexPage() {
  const [activeTab, setActiveTab] = useState<GuideCategory>('grundlagen')
  const [searchQuery, setSearchQuery] = useState('')

  const isSearching = searchQuery.trim().length > 0
  const q = searchQuery.toLowerCase().trim()

  const searchResults = useMemo(() => {
    if (!isSearching) return []
    return GUIDE_ARTICLES.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        (a.subtitle ?? '').toLowerCase().includes(q) ||
        a.intro.toLowerCase().includes(q),
    )
  }, [q, isSearching])

  const activeArticles = useMemo(
    () => GUIDE_ARTICLES.filter(a => a.category === activeTab),
    [activeTab],
  )

  const popularGuides = useMemo(
    () =>
      POPULAR_SLUGS.map(slug => GUIDE_ARTICLES.find(a => a.slug === slug)).filter(
        (a): a is GuideArticle => Boolean(a),
      ),
    [],
  )

  const activeMeta = GUIDE_CATEGORY_META[activeTab]
  const ActiveIcon = CATEGORY_ICONS[activeTab]

  const nextCat =
    GUIDE_CATEGORY_ORDER[
      (GUIDE_CATEGORY_ORDER.indexOf(activeTab) + 1) % GUIDE_CATEGORY_ORDER.length
    ]
  const nextCatMeta = GUIDE_CATEGORY_META[nextCat]

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-transparent">
      <StandardPageContainer className="pt-3 pb-8 sm:py-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <PageHeader
          pageKey="guides"
          subtitle="Kurze Anleitungen, damit du BetweenAtna effizient nutzt."
          className="mb-4 sm:mb-5"
          hideTitleOnMobile
        />

        {/* ── Search + chips ─────────────────────────────────────────────────── */}
        <div className="mb-5 space-y-3">
          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Wonach suchst du?"
                aria-label="Ratgeber durchsuchen"
                className="w-full rounded-xl bg-[#1b120d]/78 py-2.5 pl-9 pr-9 text-sm text-stone-100 placeholder:text-stone-500 ring-1 ring-white/[0.07] transition focus:outline-none focus:ring-amber-400/35"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-500 hover:text-stone-300"
                  aria-label="Suche löschen"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Link
              to="/chat"
              className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-amber-500/90 px-3.5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 sm:inline-flex"
            >
              KI fragen
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          {/* Category chips — hidden when searching */}
          {!isSearching && (
            <div
              className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
              role="tablist"
              aria-label="Themenbereiche"
            >
              {GUIDE_CATEGORY_ORDER.map(cat => {
                const Icon = CATEGORY_ICONS[cat]
                const isActive = cat === activeTab
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(cat)}
                    className={[
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      isActive
                        ? 'border-amber-400/55 bg-amber-500/12 text-amber-200 shadow-[0_0_10px_-5px_rgba(245,158,11,0.3)]'
                        : 'border-white/10 bg-white/[0.03] text-stone-400 hover:border-white/18 hover:text-stone-200',
                    ].join(' ')}
                  >
                    <Icon size={11} aria-hidden />
                    {GUIDE_CATEGORY_META[cat].label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Search results ─────────────────────────────────────────────────── */}
        {isSearching ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
              {searchResults.length === 0
                ? 'Keine Ergebnisse'
                : `${searchResults.length} Ergebnis${searchResults.length !== 1 ? 'se' : ''}`}
              {' '}für „{searchQuery}"
            </p>
            {searchResults.length === 0 ? (
              <div className="rounded-2xl bg-[#1b120d]/50 px-6 py-10 text-center ring-1 ring-white/[0.06]">
                <p className="text-sm text-stone-400">Kein Ratgeber gefunden.</p>
                <Link
                  to="/chat"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300"
                >
                  Frag die KI direkt
                  <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {searchResults.map(article => (
                  <GuideCard key={article.slug} article={article} />
                ))}
              </ul>
            )}
          </div>
        ) : (
          /* ── Topic content ─────────────────────────────────────────────────── */
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_256px] lg:gap-5">

            {/* Left: topic intro + article list */}
            <div className="min-w-0" role="tabpanel">
              {/* Topic intro strip */}
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-[#1b120d]/78 px-4 py-3 ring-1 ring-white/[0.07]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                  <ActiveIcon size={16} className="text-amber-300/80" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-100">{activeMeta.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
                    {activeMeta.description}
                  </p>
                </div>
              </div>

              {/* Guide cards */}
              <ul className="space-y-2">
                {activeArticles.map(article => (
                  <GuideCard key={article.slug} article={article} />
                ))}
              </ul>

              {/* Mobile KI CTA */}
              <div className="mt-5 sm:hidden">
                <Link
                  to="/chat"
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/90 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  KI fragen
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            </div>

            {/* Right: sidebar — desktop only ─────────────────────────────── */}
            <aside className="hidden lg:flex lg:flex-col lg:gap-3">

              {/* Recommended flow */}
              <div className="rounded-xl bg-[#1b120d]/78 px-4 py-4 ring-1 ring-white/[0.07]">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                  Empfohlener Ablauf
                </p>
                <div className="flex flex-col gap-1">
                  {FLOW_STEPS.map((step, i) => {
                    const Icon = CATEGORY_ICONS[step.cat]
                    const isActive = step.cat === activeTab
                    return (
                      <button
                        key={step.cat}
                        type="button"
                        onClick={() => setActiveTab(step.cat)}
                        className={[
                          'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition',
                          isActive
                            ? 'bg-amber-500/12 text-amber-200'
                            : 'text-stone-500 hover:bg-white/5 hover:text-stone-300',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                            isActive ? 'bg-amber-500/25 text-amber-300' : 'bg-white/8 text-stone-600',
                          ].join(' ')}
                        >
                          {i + 1}
                        </span>
                        <Icon size={11} aria-hidden className="shrink-0" />
                        {step.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Popular guides */}
              <div className="rounded-xl bg-[#1b120d]/78 px-4 py-4 ring-1 ring-white/[0.07]">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                  Häufig gebraucht
                </p>
                <ul className="space-y-1.5">
                  {popularGuides.map(article => {
                    const meta = GUIDE_CATEGORY_META[article.category]
                    return (
                      <li key={article.slug}>
                        <Link
                          to={`/guides/${article.slug}`}
                          className="group flex items-start gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-white/5"
                        >
                          <ChevronRight
                            size={12}
                            className="mt-0.5 shrink-0 text-stone-700 transition group-hover:text-amber-400"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-400 transition group-hover:text-stone-200">
                              {article.title}
                            </p>
                            <p className="mt-0.5 text-[10px] text-stone-700">{meta.label}</p>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Next step nudge */}
              <div className="rounded-xl bg-[#1b120d]/78 px-4 py-3 ring-1 ring-amber-400/12">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400/60">
                  Nächster Schritt
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab(nextCat)}
                  className="group flex w-full items-center gap-2 rounded-lg py-0.5 text-left text-xs font-medium text-stone-500 transition hover:text-amber-300"
                >
                  <ArrowRight
                    size={12}
                    className="shrink-0 text-amber-500/40 transition group-hover:text-amber-400"
                  />
                  {nextCatMeta.label} erkunden
                </button>
              </div>
            </aside>
          </div>
        )}
      </StandardPageContainer>
    </div>
  )
}
