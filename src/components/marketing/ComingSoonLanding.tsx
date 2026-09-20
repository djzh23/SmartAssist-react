import { SignInButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { PUBLIC_AFTER_AUTH } from './PublicSiteChrome'
import { NewsletterForm } from './NewsletterForm'
import '../../styles/landing.css'

const FEATURES = [
  'Match-Score gegen deinen Lebenslauf',
  'Konkrete Bullet-Vorschläge',
  'Fact-Gate gegen erfundene Skills',
]

export function ComingSoonLanding() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#120c08]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-[960px] items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo-nav.webp" alt="" className="h-7 w-7 rounded-lg sm:h-8 sm:w-8" width={32} height={32} />
            <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-50/90 bg-clip-text text-[14px] font-bold tracking-tight text-transparent sm:text-[17px]">
              PrivatePrep
            </span>
          </div>
          <SignInButton mode="modal" fallbackRedirectUrl={PUBLIC_AFTER_AUTH}>
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center rounded-full border border-stone-600/50 bg-white/[0.04] px-3 text-xs font-medium text-stone-300 sm:min-h-[40px] sm:px-4 sm:text-sm"
            >
              Anmelden
            </button>
          </SignInButton>
        </nav>
      </header>

      <main id="main-content">
        <section className="px-5 pb-10 pt-12 sm:pb-14 sm:pt-16">
          <div className="mx-auto max-w-[640px] text-center">
            <h1 className="font-serif text-[clamp(30px,5.2vw,52px)] font-bold leading-[1.14] text-stone-50">
              Deutsche KI-Bewerbungsanalyse
            </h1>
            <p className="mt-5 text-base leading-relaxed text-stone-400 sm:text-lg">
              Bald verfügbar. Lade deinen Lebenslauf hoch, füge eine Stellenausschreibung ein,
              bekomme konkrete Bullet-Point-Vorschläge zurück, die zu dir passen.
            </p>
          </div>
        </section>

        <section className="px-5 pb-12">
          <div className="relative mx-auto max-w-[880px] overflow-hidden rounded-3xl border border-stone-600/40 bg-[#14110e] shadow-landing-lg">
            <img
              src="/screenshots/analyze-preview.png"
              alt="Vorschau der Analyse-Ansicht"
              width={1200}
              height={800}
              className="h-auto w-full opacity-70"
            />
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-stone-300 sm:text-base">
              Screenshot folgt
            </p>
          </div>
        </section>

        <section className="px-5 pb-12">
          <div className="mx-auto grid max-w-[880px] gap-4 sm:grid-cols-3">
            {FEATURES.map(title => (
              <div key={title} className="rounded-2xl border border-stone-600/35 bg-white/[0.03] px-4 py-5 text-center">
                <p className="text-sm font-semibold text-amber-300">{title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 pb-16">
          <div className="mx-auto max-w-[480px] text-center">
            <h2 className="text-2xl font-bold text-stone-50">Beta-Zugang anfragen</h2>
            <p className="mt-3 text-sm text-stone-400">
              Trag deine E-Mail ein, wir melden uns wenn die App öffentlich geht.
            </p>
            <div className="mt-6">
              <NewsletterForm />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-600">
              Deine E-Mail nutzen wir ausschließlich für die Beta-Ankündigung.
              Kein Newsletter, kein Marketing, keine Weitergabe an Dritte.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-[#0D0800] px-6 py-10 text-center text-xs text-stone-600">
        <p>© 2026 PrivatePrep</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <Link to="/impressum" className="transition-colors hover:text-stone-400">Impressum</Link>
          <Link to="/datenschutz" className="transition-colors hover:text-stone-400">Datenschutz</Link>
        </p>
      </footer>
    </div>
  )
}
