import { Link } from 'react-router-dom'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { betaModeEnabled } from '../../config/env'

const AFTER_AUTH = '/analyze'

const navLinkClass =
  'rounded-full px-3 py-2 text-sm font-medium text-stone-300 transition hover:bg-white/8 hover:text-white'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

interface PublicSiteHeaderProps {
  variant: 'landing' | 'page'
}

export function ClosedBetaBanner() {
  return (
    <div className="bg-amber-400 px-4 py-2 text-center text-xs leading-relaxed text-stone-950 sm:text-sm">
      Diese Anwendung befindet sich in einer geschlossenen Beta-Phase. Der öffentliche Start ist für später geplant.
      Für Zugang zur Beta:{' '}
      <a href="mailto:ijd.zouh@yahoo.com" className="font-semibold underline decoration-stone-800/40 underline-offset-2">
        ijd.zouh@yahoo.com
      </a>
    </div>
  )
}

export function PublicSiteHeader({ variant }: PublicSiteHeaderProps) {
  const isLanding = variant === 'landing'

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#120c08]/90 backdrop-blur-xl">
      <ClosedBetaBanner />
      <nav className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        {isLanding ? (
          <button type="button" onClick={() => scrollTo('hero')} className="flex items-center gap-2">
            <img src="/logo-nav.webp" alt="" className="h-7 w-7 rounded-lg sm:h-8 sm:w-8" width={32} height={32} />
            <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-50/90 bg-clip-text text-[14px] font-bold tracking-tight text-transparent sm:text-[17px]">
              PrivatePrep
            </span>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-nav.webp" alt="" className="h-7 w-7 rounded-lg sm:h-8 sm:w-8" width={32} height={32} />
            <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-50/90 bg-clip-text text-[14px] font-bold tracking-tight text-transparent sm:text-[17px]">
              PrivatePrep
            </span>
          </Link>
        )}

        <div className="hidden items-center gap-0.5 md:flex">
          {betaModeEnabled ? null : (
            <>
              {isLanding ? (
                <>
                  <button type="button" onClick={() => scrollTo('features')} className={navLinkClass}>Funktionen</button>
                  <button type="button" onClick={() => scrollTo('how')} className={navLinkClass}>Ablauf</button>
                  <button type="button" onClick={() => scrollTo('demo')} className={navLinkClass}>Analysebericht</button>
                </>
              ) : (
                <>
                  <Link to="/#features" className={navLinkClass}>Funktionen</Link>
                  <Link to="/#how" className={navLinkClass}>Ablauf</Link>
                  <Link to="/#demo" className={navLinkClass}>Analysebericht</Link>
                </>
              )}
              <Link to="/blog" className={navLinkClass}>Ratgeber</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <SignInButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center rounded-full border border-amber-800/45 bg-white/[0.06] px-3 text-xs font-medium text-stone-100 sm:min-h-[40px] sm:px-4 sm:text-sm"
            >
              Anmelden
            </button>
          </SignInButton>
          {betaModeEnabled ? null : (
            <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
              <button
                type="button"
                className="inline-flex min-h-[36px] items-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 text-xs font-bold text-amber-950 shadow-lg shadow-black/30 sm:min-h-[40px] sm:px-4 sm:text-sm"
              >
                Kostenlos starten
              </button>
            </SignUpButton>
          )}
        </div>
      </nav>
    </header>
  )
}

export function PublicSiteFooter() {
  return (
    <footer className="bg-[#0D0800] px-6 py-10 text-center text-xs text-stone-600">
      <p>© 2026 PrivatePrep. KI-gestützte Stellenanalyse für Bewerbungen in Deutschland.</p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-4">
        {betaModeEnabled ? null : (
          <Link to="/blog" className="transition-colors hover:text-stone-400">Ratgeber</Link>
        )}
        <Link to="/impressum" className="transition-colors hover:text-stone-400">Impressum</Link>
        <Link to="/datenschutz" className="transition-colors hover:text-stone-400">Datenschutz</Link>
      </p>
    </footer>
  )
}

export const PUBLIC_AFTER_AUTH = AFTER_AUTH
