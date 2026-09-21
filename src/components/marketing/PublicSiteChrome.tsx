import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Menu, X } from 'lucide-react'

const AFTER_AUTH = '/analyze'
const LANDING_SECTIONS = [
  'hero',
  'funktionen',
  'ablauf',
  'bericht',
  'ueber',
  'datenschutz-teaser',
  'faq',
  'starten',
] as const

const NAV_ITEMS = [
  { id: 'funktionen', label: 'Funktionen' },
  { id: 'ablauf', label: 'So funktioniert es' },
  { id: 'bericht', label: 'Beispielbericht' },
] as const
export const LANDING_SCROLL_KEY = 'pp-landing-scroll'

export const PUBLIC_SHELL = 'mx-auto w-full max-w-[960px] px-5 sm:px-6'
const ANCHOR_GAP_PX = 24

function headerOffsetPx() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--pp-header-offset')
  const parsed = Number.parseFloat(raw)
  if (Number.isFinite(parsed) && parsed > 0) return parsed
  return document.querySelector('.pp-header')?.getBoundingClientRect().height ?? 100
}

function syncHeaderOffset() {
  const header = document.querySelector('.pp-header')
  const h = Math.ceil(header?.getBoundingClientRect().height ?? 100)
  document.documentElement.style.setProperty('--pp-header-offset', `${h}px`)
  document.documentElement.style.setProperty('--site-header-height', `${h}px`)
  return h
}

export function scrollToSection(id: string, behavior: ScrollBehavior = 'smooth') {
  if (!id || id === 'hero') {
    window.scrollTo({ top: 0, behavior })
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  const top = window.scrollY + el.getBoundingClientRect().top - headerOffsetPx() - ANCHOR_GAP_PX
  window.scrollTo({ top: Math.max(0, top), behavior })
}

function sectionFromHash(hash: string) {
  const id = hash.replace('#', '')
  if (id && LANDING_SECTIONS.includes(id as (typeof LANDING_SECTIONS)[number])) return id
  return 'hero'
}

function hashForSection(id: string) {
  return id === 'hero' ? '' : id
}

function BrandMark() {
  return (
    <>
      <span className="pp-brand-mark inline-flex">
        <img
          src="/logo-nav.webp"
          alt=""
          className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
          width={48}
          height={48}
        />
      </span>
      <span className="pp-wordmark text-[16px] sm:text-[18px]">
        Private<span>Prep</span>
      </span>
    </>
  )
}

interface PublicSiteHeaderProps {
  variant: 'landing' | 'page'
}

export function ClosedBetaBanner() {
  return (
    <div className="pp-banner">
      Geschlossene Beta
    </div>
  )
}

function navClass(stacked: boolean, active: boolean) {
  if (stacked) {
    return `pp-nav-link w-full justify-start text-left ${active ? 'pp-nav-link-active' : ''}`
  }
  return `pp-nav-link ${active ? 'pp-nav-link-active' : ''}`
}

function LandingNavLinks({
  isLanding,
  onNavigate,
  stacked = false,
  activeId,
  onGo,
}: {
  isLanding: boolean
  onNavigate?: () => void
  stacked?: boolean
  activeId: string
  onGo: (id: string) => void
}) {
  if (isLanding) {
    return (
      <>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onGo(item.id)}
            className={navClass(stacked, activeId === item.id)}
          >
            {item.label}
          </button>
        ))}
      </>
    )
  }

  return (
    <>
      {NAV_ITEMS.map(item => (
        <Link
          key={item.id}
          to={`/#${item.id}`}
          onClick={onNavigate}
          className={navClass(stacked, false)}
        >
          {item.label}
        </Link>
      ))}
    </>
  )
}

function HeaderCtas({
  stacked,
  onSignedIn,
}: {
  stacked: boolean
  onSignedIn?: () => void
}) {
  return (
    <div className={stacked ? 'mt-4 flex flex-col gap-2' : 'hidden items-center gap-2 lg:flex'}>
      <SignInButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
        <button
          type="button"
          onClick={onSignedIn}
          className={stacked ? 'pp-signin-ghost w-full' : 'pp-signin-ghost'}
        >
          Anmelden
        </button>
      </SignInButton>
      <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
        <button
          type="button"
          className={stacked ? 'pp-cta w-full min-h-11' : 'pp-cta pp-cta-nav'}
        >
          Kostenlos starten
        </button>
      </SignUpButton>
    </div>
  )
}

export function PublicSiteHeader({ variant }: PublicSiteHeaderProps) {
  const isLanding = variant === 'landing'
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState(() => sectionFromHash(location.hash))
  const skipHashScroll = useRef(false)
  const spyLocked = useRef(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useLayoutEffect(() => {
    if (!isLanding) return
    syncHeaderOffset()
    const id = sectionFromHash(location.hash)
    setActiveId(id)
    if (skipHashScroll.current) {
      skipHashScroll.current = false
      return
    }
    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(LANDING_SCROLL_KEY)
      if (saved) {
        window.scrollTo(0, Number(saved) || 0)
        return
      }
    }
    scrollToSection(id, 'auto')
  }, [isLanding, location.hash, navigationType])

  useEffect(() => {
    if (!isLanding) return
    const header = document.querySelector('.pp-header')
    if (!header) return

    let frame = 0
    const updateSpy = () => {
      if (spyLocked.current) return
      const probe = syncHeaderOffset() + ANCHOR_GAP_PX + 8
      let current = 'hero'
      for (const id of LANDING_SECTIONS) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= probe) current = id
      }
      setActiveId(current)
      if (location.pathname !== '/') return
      const nextHash = hashForSection(current)
      const currentHash = window.location.hash.replace('#', '')
      if (currentHash !== nextHash) {
        skipHashScroll.current = true
        navigate(
          nextHash ? { pathname: '/', hash: `#${nextHash}` } : { pathname: '/' },
          { replace: true },
        )
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        updateSpy()
      })
    }

    syncHeaderOffset()
    updateSpy()
    window.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(() => {
      syncHeaderOffset()
      updateSpy()
    })
    ro.observe(header)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [isLanding, location.hash, location.pathname, navigate])

  const closeMenu = () => setMenuOpen(false)

  const go = (id: string) => {
    skipHashScroll.current = true
    spyLocked.current = true
    setActiveId(id)
    navigate({ pathname: '/', hash: id === 'hero' ? '' : `#${id}` })
    scrollToSection(id, 'smooth')
    window.setTimeout(() => {
      spyLocked.current = false
    }, 1200)
    closeMenu()
  }

  return (
    <header className="pp-header">
      <nav className={`${PUBLIC_SHELL} relative flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]`}>
        {isLanding ? (
          <button type="button" onClick={() => go('hero')} className="flex min-w-0 items-center gap-2.5">
            <BrandMark />
          </button>
        ) : (
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark />
          </Link>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden items-center lg:flex">
            <LandingNavLinks isLanding={isLanding} activeId={activeId} onGo={go} />
          </div>
          <HeaderCtas stacked={false} />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#F5F5F5] lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </nav>
      {menuOpen ? (
        <div className={`pp-mobile-menu py-4 lg:hidden ${PUBLIC_SHELL}`}>
          <div className="flex flex-col gap-1">
            <LandingNavLinks isLanding={isLanding} onNavigate={closeMenu} stacked activeId={activeId} onGo={go} />
            <HeaderCtas
              stacked
              onSignedIn={closeMenu}
            />
          </div>
        </div>
      ) : null}
    </header>
  )
}

const FOOTER_PRODUCT = [
  { id: 'funktionen', label: 'Funktionen' },
  { id: 'ablauf', label: 'So funktioniert es' },
  { id: 'bericht', label: 'Beispielbericht' },
  { id: 'ueber', label: 'Über PrivatePrep' },
  { id: 'faq', label: 'FAQ' },
] as const

export function PublicSiteFooter() {
  return (
    <footer className="pp-footer">
      <div className={`${PUBLIC_SHELL} py-[60px]`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark />
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[#8A7F72]">
              Deutsche KI-Bewerbungsanalyse für alle Branchen.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#8A7F72]">
              Ein Projekt aus Hamburg.
            </p>
          </div>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.6px] text-[#C4B8AA]">Produkt</p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_PRODUCT.map(item => (
                <li key={item.id}>
                  <Link
                    to={`/#${item.id}`}
                    className="text-[13px] text-[#8A7F72] no-underline transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.6px] text-[#C4B8AA]">Rechtliches</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/impressum" className="text-[13px] text-[#8A7F72] no-underline transition-colors hover:text-white">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-[13px] text-[#8A7F72] no-underline transition-colors hover:text-white">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.6px] text-[#C4B8AA]">Kontakt</p>
            <a
              href="mailto:ijd.zouh@yahoo.com"
              className="mt-4 inline-block text-[13px] text-[#8A7F72] no-underline transition-colors hover:text-white"
            >
              ijd.zouh@yahoo.com
            </a>
            <p className="mt-2 text-[13px] leading-relaxed text-[#8A7F72]">
              Für Fragen oder Feedback.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t-[0.5px] border-[#3a342e] pt-6 text-[12px] text-[#9A9086] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PrivatePrep</p>
        </div>
      </div>
    </footer>
  )
}

export const PUBLIC_AFTER_AUTH = AFTER_AUTH
