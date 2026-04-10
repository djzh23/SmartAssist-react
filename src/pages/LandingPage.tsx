import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import { Check, ChevronRight, Loader2, Menu, Play, RotateCcw, Send, X } from 'lucide-react'
import { askAgentDemo, fetchDemoTtsAudio } from '../api/client'
import LearningResponse from '../components/chat/LearningResponse'
import { parseLearningResponse } from '../utils/parseLearningResponse'
import '../styles/landing.css'

/** Sichtbare Knappheit; optional in `.env` als `VITE_REMAINING_FREE_SLOTS` überschreiben */
const REMAINING_FREE_SLOTS =
  (import.meta.env.VITE_REMAINING_FREE_SLOTS as string | undefined)?.trim() || '42'

// ── Section Divider: nur Wellen & Kurven (keine Raster/Hex/Balken/Punkte) ─────

type DividerVariant =
  | 'wave'
  | 'microdots'
  | 'hatch'
  | 'blend'
  | 'sunrise'
  | 'mesh'
  | 'grain'
  | 'thread'
  | 'night'

function SectionDivider({
  from,
  to,
  dark = false,
  variant,
  className = '',
}: {
  from: string
  to: string
  dark?: boolean
  variant: DividerVariant
  className?: string
}) {
  const s = dark
    ? {
        main: 'rgba(255,255,255,0.13)',
        soft: 'rgba(255,255,255,0.065)',
        accent: 'rgba(45,212,191,0.22)',
        fill: 'rgba(255,255,255,0.04)',
      }
    : {
        main: 'rgba(120,53,15,0.1)',
        soft: 'rgba(120,53,15,0.055)',
        accent: 'rgba(13,148,136,0.16)',
        fill: 'rgba(251,191,36,0.07)',
      }

  const waves = (() => {
    switch (variant) {
      case 'wave':
        return (
          <g>
            <path d="M0 15 Q360 8 720 15 T1440 15" fill="none" stroke={s.main} strokeWidth="0.65" strokeLinecap="round" />
            <path d="M0 21 Q360 14 720 21 T1440 21" fill="none" stroke={s.soft} strokeWidth="0.48" strokeLinecap="round" />
          </g>
        )
      case 'microdots':
        return (
          <g>
            <path d="M0 17 Q240 9 480 17 T960 17 T1440 17" fill="none" stroke={s.main} strokeWidth="0.52" strokeLinecap="round" />
            <path d="M0 13 Q240 21 480 13 T960 13 T1440 13" fill="none" stroke={s.soft} strokeWidth="0.42" strokeLinecap="round" />
            <path d="M0 22 Q240 5 480 22 T960 22 T1440 22" fill="none" stroke={s.accent} strokeWidth="0.38" strokeLinecap="round" opacity={0.85} />
          </g>
        )
      case 'hatch':
        return (
          <g>
            {[9, 13, 17, 21].map((y, i) => (
              <path
                key={y}
                d={`M0 ${y} Q360 ${y - 2 + (i % 3)} 720 ${y} T1440 ${y}`}
                fill="none"
                stroke={i % 2 === 0 ? s.main : s.soft}
                strokeWidth="0.4"
                strokeLinecap="round"
              />
            ))}
          </g>
        )
      case 'blend':
        return dark ? (
          <g>
            <path d="M0 24 Q720 6 1440 18 L1440 28 L0 28 Z" fill={s.fill} opacity={0.95} />
            <path d="M0 17 Q720 4 1440 13" fill="none" stroke={s.main} strokeWidth="0.62" strokeLinecap="round" />
            <path d="M0 21 Q720 10 1440 17" fill="none" stroke={s.soft} strokeWidth="0.48" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M0 15 Q720 7 1440 15" fill="none" stroke={s.main} strokeWidth="0.52" strokeLinecap="round" />
            <path d="M0 19 Q720 11 1440 19" fill="none" stroke={s.soft} strokeWidth="0.45" strokeLinecap="round" />
          </g>
        )
      case 'sunrise':
        return (
          <g>
            <path d="M0 24 Q360 12 720 20 T1440 20" fill="none" stroke={s.soft} strokeWidth="0.48" strokeLinecap="round" />
            <path d="M180 26 A540 10 0 0 1 1260 26" fill="none" stroke={s.main} strokeWidth="0.52" strokeLinecap="round" opacity={0.5} />
            <path d="M0 11 Q720 5 1440 11" fill="none" stroke={s.accent} strokeWidth="0.38" strokeLinecap="round" opacity={0.8} />
          </g>
        )
      case 'mesh':
        return (
          <g>
            <path d="M0 10 Q480 17 960 10 T1440 10" fill="none" stroke={s.main} strokeWidth="0.4" strokeLinecap="round" />
            <path d="M0 16 Q480 9 960 16 T1440 16" fill="none" stroke={s.soft} strokeWidth="0.48" strokeLinecap="round" />
            <path d="M0 22 Q480 5 960 22 T1440 22" fill="none" stroke={s.accent} strokeWidth="0.38" strokeLinecap="round" opacity={0.72} />
          </g>
        )
      case 'grain':
        return (
          <g opacity={0.95}>
            <path d="M40 11 C200 19 280 5 440 13 S720 7 880 19" fill="none" stroke={s.soft} strokeWidth="0.38" strokeLinecap="round" />
            <path d="M520 17 C680 9 760 21 920 13 S1200 19 1400 9" fill="none" stroke={s.main} strokeWidth="0.42" strokeLinecap="round" />
            <path d="M80 22 C400 8 700 24 1360 15" fill="none" stroke={s.accent} strokeWidth="0.34" strokeLinecap="round" />
          </g>
        )
      case 'thread':
        return (
          <g>
            <path
              d="M0 17 C240 3 480 33 720 11 S1200 23 1440 17"
              fill="none"
              stroke={s.main}
              strokeWidth="0.55"
              strokeLinecap="round"
            />
            <path
              d="M0 13 C240 25 480 3 720 13 S1200 19 1440 13"
              fill="none"
              stroke={s.soft}
              strokeWidth="0.4"
              strokeLinecap="round"
              opacity={0.5}
            />
          </g>
        )
      case 'night':
        return (
          <g>
            <path d="M0 15 Q720 7 1440 15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.48" strokeLinecap="round" />
            <path d="M0 19 Q720 11 1440 19" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="0.52" strokeLinecap="round" />
            <path d="M0 12 Q360 20 720 9 T1440 12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.42" strokeLinecap="round" />
          </g>
        )
    }
  })()

  return (
    <div
      className={['relative w-full overflow-hidden h-5 sm:h-6', className].join(' ')}
      style={{ background: `linear-gradient(to bottom, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 28"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {waves}
      </svg>
    </div>
  )
}

// ── Kleines Werkzeuge-Ornament (Karriere · KI · Wachstum) ────────────────────

function FeaturesHeadingOrnament() {
  return (
    <div className="mb-6 flex justify-center" aria-hidden="true">
      <svg viewBox="0 0 400 40" className="h-10 w-full max-w-[min(22rem,100%)] text-amber-800/25" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 28 L20 14 L28 14 L28 8 L36 8 L36 28 Z M24 18 L32 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="68" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="88" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="108" cy="22" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M72 20 L85 16 M85 16 L105 22 M105 22 L72 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity={0.6} />
        <path
          d="M140 30 L155 12 L170 28 L185 14 L200 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M230 28 L250 10 L270 28 L290 10 L310 28" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity={0.5} />
        <path
          d="M340 28 L350 18 L360 24 L370 14 L380 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

// ── Navbar ───────────────────────────────────────────────────────────────────

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const navH = window.innerWidth >= 768 ? 96 : 88
  const top = el.getBoundingClientRect().top + window.scrollY - navH
  window.scrollTo({ top, behavior: 'smooth' })
}

/** Sektionen mit dunklem Hintergrund — Navigation schaltet dort auf Dark-Theme */
const DARK_NAV_SECTION_IDS = ['how-it-works', 'cta', 'footer'] as const

function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [overDarkBg, setOverDarkBg] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let raf = 0
    const NAV_OVERLAP_PX = 104

    const checkDarkOverlap = () => {
      let overlaps = false
      for (const id of DARK_NAV_SECTION_IDS) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top < NAV_OVERLAP_PX && rect.bottom > 6) {
          overlaps = true
          break
        }
      }
      setOverDarkBg(overlaps)
    }

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(checkDarkOverlap)
    }

    checkDarkOverlap()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)
  const go = (id: string) => {
    scrollTo(id)
    closeMobile()
  }

  /** Desktop: Pill + animierte Unterstreichung + klarer Hover/Fokus */
  const navLinkClass = overDarkBg
    ? [
        'relative cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-amber-100/92',
        'transition-all duration-200 ease-out',
        'after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full',
        'after:bg-gradient-to-r after:from-amber-200/95 after:to-amber-50/90 after:transition-transform after:duration-200 after:ease-out after:scale-x-0 after:origin-center',
        'hover:bg-white/15 hover:text-white hover:after:scale-x-100',
        'active:bg-white/12 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
      ].join(' ')
    : [
        'relative cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-slate-600',
        'transition-all duration-200 ease-out',
        'after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary',
        'after:transition-transform after:duration-200 after:ease-out after:scale-x-0 after:origin-center',
        'hover:bg-amber-100/80 hover:text-slate-900 hover:shadow-sm hover:after:scale-x-100',
        'active:bg-amber-100 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50/90',
      ].join(' ')

  /** Mobile Flyout: volle Zeile, Rand + Chevron — wirkt wie tippbare Liste */
  const navLinkClassMobilePanel =
    'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-3 text-left text-sm font-medium text-slate-800 transition-all duration-200 hover:border-amber-200/90 hover:bg-amber-50/95 hover:shadow-sm active:scale-[0.99] active:bg-amber-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

  const shellSurface = overDarkBg
    ? scrolled
      ? 'border-white/20 bg-gradient-to-b from-slate-950/95 via-[#1a1208]/96 to-[#0d0800]/98 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/10'
      : 'border-white/18 bg-gradient-to-b from-slate-900/92 via-[#1c1200]/94 to-[#0d0800]/97 shadow-[0_10px_40px_-6px_rgba(0,0,0,0.45)] ring-1 ring-white/10'
    : scrolled
      ? 'border-amber-300/45 bg-gradient-to-b from-white/95 via-amber-50/35 to-amber-50/20 shadow-[0_12px_40px_-6px_rgba(28,18,0,0.14)]'
      : 'border-amber-200/35 bg-gradient-to-b from-white/92 via-white/88 to-amber-50/30 shadow-[0_4px_28px_-4px_rgba(28,18,0,0.08)]'

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-[100] px-3 pt-3 sm:px-5 sm:pt-4">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Menü schließen"
          className="pointer-events-auto fixed inset-0 z-0 bg-slate-900/25 backdrop-blur-[2px] md:hidden"
          onClick={closeMobile}
        />
      )}

      <nav
        className={[
          'pointer-events-auto relative z-10 mx-auto flex max-w-[1120px] items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur-xl transition-[box-shadow,border-color,background-color,ring-color] duration-300 sm:gap-4 sm:rounded-[1.35rem] sm:px-5 sm:py-3',
          shellSurface,
        ].join(' ')}
        aria-label="Hauptnavigation"
      >
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            closeMobile()
          }}
          className={[
            'flex min-w-0 items-center gap-2 rounded-xl py-1.5 pl-1 pr-2 text-left transition-all duration-200',
            overDarkBg
              ? 'hover:bg-white/10 active:scale-[0.98]'
              : 'hover:bg-amber-50/90 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          ].join(' ')}
        >
          <img
            src="/favicon.png"
            alt=""
            className={[
              'h-8 w-8 flex-shrink-0 rounded-xl sm:h-9 sm:w-9',
              overDarkBg ? 'ring-1 ring-white/25' : 'ring-1 ring-amber-200/50',
            ].join(' ')}
          />
          <span
            className={[
              'text-[15px] font-bold tracking-tight sm:text-[17px]',
              overDarkBg
                ? 'bg-gradient-to-r from-amber-100 via-amber-50 to-amber-50/90 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 bg-clip-text text-transparent',
            ].join(' ')}
          >
            PrivatePrep
          </span>
        </button>

        <div className="hidden items-center gap-0.5 md:flex">
          <button type="button" onClick={() => scrollTo('demo')} className={navLinkClass}>
            Live Demo
          </button>
          <button type="button" onClick={() => scrollTo('pricing')} className={navLinkClass}>
            Preise
          </button>
          <button type="button" onClick={() => scrollTo('faq')} className={navLinkClass}>
            FAQ
          </button>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          <SignInButton mode="modal" fallbackRedirectUrl="/tools">
            <button
              type="button"
              className={[
                'hidden min-h-[40px] rounded-full border px-3.5 py-2 text-xs font-medium shadow-sm transition-all duration-200 sm:inline-flex sm:px-4 sm:text-sm',
                overDarkBg
                  ? 'border-white/25 bg-white/10 text-white hover:border-white/45 hover:bg-white/18 hover:shadow-md active:scale-[0.98]'
                  : 'border-slate-200/90 bg-white/90 text-slate-700 hover:border-amber-400/80 hover:bg-amber-50 hover:text-slate-900 hover:shadow-md active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              ].join(' ')}
            >
              Anmelden
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
            <button
              type="button"
              className="inline-flex min-h-[40px] max-w-[calc(100vw-8rem)] items-center justify-center truncate rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-3 py-2 text-[11px] font-semibold text-white shadow-md shadow-amber-900/10 ring-1 ring-amber-500/20 transition-all duration-200 hover:from-amber-500 hover:to-amber-600 hover:shadow-lg hover:ring-amber-400/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-5 sm:text-sm"
            >
              Kostenlos starten
            </button>
          </SignUpButton>

          <button
            type="button"
            className={[
              'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 md:hidden',
              overDarkBg
                ? 'border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/18 hover:shadow-md active:scale-95'
                : 'border-amber-200/70 bg-amber-50/60 text-slate-700 hover:border-amber-400/60 hover:bg-amber-100/90 hover:shadow-sm active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            ].join(' ')}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* Mobile flyout */}
      {mobileOpen && (
        <div
          id="landing-mobile-menu"
          className="pointer-events-auto relative z-10 mx-auto mt-2 max-w-[1120px] overflow-hidden rounded-2xl border border-amber-200/50 bg-white/95 p-2 shadow-xl shadow-amber-900/10 backdrop-blur-xl md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="flex flex-col gap-1">
            <button type="button" className={navLinkClassMobilePanel} onClick={() => go('demo')}>
              <span>Live Demo</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
            </button>
            <button type="button" className={navLinkClassMobilePanel} onClick={() => go('pricing')}>
              <span>Preise</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
            </button>
            <button type="button" className={navLinkClassMobilePanel} onClick={() => go('faq')}>
              <span>FAQ</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
            </button>
            <div className="my-1 border-t border-amber-100" />
            <SignInButton mode="modal" fallbackRedirectUrl="/tools">
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-left text-sm font-medium text-slate-800 transition-all duration-200 hover:border-amber-300/80 hover:bg-amber-50 hover:shadow-sm active:bg-amber-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                onClick={closeMobile}
              >
                Anmelden
              </button>
            </SignInButton>
          </div>
        </div>
      )}
    </header>
  )
}

// ── Chat Mockup (decorative) ──────────────────────────────────────────────────

function ChatMockup() {
  const [showTyping, setShowTyping] = useState(true)

  useEffect(() => {
    const id = window.setInterval(() => setShowTyping(v => !v), 3000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative mx-auto max-w-[340px]">
      <div className="-rotate-2 overflow-hidden rounded-[22px] bg-white shadow-[0_24px_80px_rgba(124,58,237,0.22)]">
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3">
          <span className="text-sm font-bold text-white">⚡ PrivatePrep</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            <span className="text-xs text-white/80">Online</span>
          </div>
        </div>
        <div className="space-y-3 bg-slate-50 p-4">
          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-xs text-white">⚡</div>
            <div className="max-w-[220px] rounded-[12px_12px_12px_4px] bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
              <span className="font-semibold text-emerald-700">Stellenanalyse</span>
              <p className="mt-1 leading-snug">Top-Keywords: React, TypeScript, agile …</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[220px] rounded-[12px_12px_4px_12px] bg-gradient-to-r from-amber-600 to-amber-700 px-3 py-2 text-xs text-white">
              Analysiere diese Junior-Entwickler-Stelle …
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-xs text-white">⚡</div>
            <div className="max-w-[220px] rounded-[12px_12px_12px_4px] border-l-[3px] border-l-emerald-500 bg-white px-3 py-2 text-xs shadow-sm">
              <p className="font-semibold text-slate-800">Match & Lücken</p>
              <p className="text-slate-600">12 Keywords · 3 Muss-Anforderungen</p>
              <p className="mt-1 text-[10px] text-emerald-600">Nächster Schritt: Anschreiben</p>
            </div>
          </div>
          {showTyping && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-xs text-white">⚡</div>
              <div className="rounded-[12px_12px_12px_4px] bg-white px-3 py-3 shadow-sm">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
          <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">Schreib eine Nachricht…</div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <Send size={12} className="text-white" />
          </div>
        </div>
      </div>
      {/* Floating score card */}
      <div className="absolute -bottom-6 right-0 rotate-2 flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="text-xs font-semibold text-slate-800">10 Sek. Analyse</p>
          <p className="text-[10px] text-emerald-600">Keywords & Interview-Hinweise</p>
        </div>
      </div>
    </div>
  )
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex flex-col justify-center overflow-hidden scroll-mt-24 pt-[5.25rem] sm:scroll-mt-28 sm:pt-28"
      style={{ background: 'linear-gradient(160deg, #FFFDF5 0%, #FFF8E5 55%, #FEF3C7 100%)', minHeight: '100svh' }}
    >
      {/* Tile dot pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(180,100,0,0.1) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }}
      />

      {/* Große Flächen, Wellenbänder, skalierte Formen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-28 h-[min(95vw,780px)] w-[min(95vw,780px)] rounded-full bg-amber-300/22 blur-[130px]" />
        <div className="absolute -bottom-32 -left-32 h-[min(88vw,560px)] w-[min(88vw,560px)] rounded-full bg-amber-200/28 blur-[100px]" />
        <div className="absolute right-1/3 top-[42%] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full bg-cyan-200/18 blur-[95px]" />
        <div className="absolute -left-[10%] bottom-[-6%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full bg-violet-300/14 blur-[110px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[38vh] min-h-[220px] max-h-[380px] w-full text-amber-400/[0.09]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,110 Q360,70 720,110 T1440,95 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-0 left-0 right-0 h-[30vh] min-h-[180px] max-h-[300px] w-full text-violet-400/[0.07]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,130 Q480,90 960,125 T1440,105 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
        <div className="absolute left-[5%] top-[24%] h-28 w-28 bg-amber-400/16" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute bottom-[24%] right-[7%] h-24 w-24 rotate-45 rounded-xl bg-amber-400/18" />
        <div className="absolute right-[14%] top-[16%] h-20 w-20 rounded-full border-2 border-amber-400/26" />
        <div className="absolute left-[8%] bottom-[30%] h-36 w-36 rounded-full border border-amber-400/16" />
        <div className="absolute left-[14%] bottom-[14%] h-24 w-24 bg-amber-400/14" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div className="absolute right-[26%] top-[30%] h-16 w-16 rotate-45 border border-amber-300/26" />
      </div>

      {/* Gleiche horizontale Achse wie die schwebende Nav: header px + max-w 1120 + nav-internes px */}
      <div className="relative z-10 w-full px-3 sm:px-5">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-3 pb-16 pt-16 sm:px-5 md:grid-cols-2 md:min-h-[calc(100vh-64px)]">
        {/* Left: copy */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800">
            Angetrieben von Claude KI
          </div>

          <h1 className="mb-5 text-[clamp(32px,4.8vw,56px)] font-bold leading-[1.12] text-slate-900">
            Bewerbung vorbereiten.
            <br />
            Stelle analysieren.
            <br />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              Interview meistern.
            </span>
          </h1>

          <p className="mb-8 max-w-[520px] text-lg leading-relaxed text-slate-600">
            Stellenanzeige reinkopieren — in 10 Sekunden weißt du, welche Keywords fehlen, wo dein Lebenslauf Lücken hat,
            und welche Interview-Fragen auf dich zukommen.
          </p>

          <div className="mb-7 flex flex-wrap items-center gap-3">
            <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
              <button className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1C1200] to-[#2D1C08] px-7 text-base font-semibold text-amber-300 shadow-lg shadow-black/25 transition-all hover:scale-[1.02] hover:shadow-xl">
                Kostenlos ausprobieren
                <span className="opacity-70">→</span>
              </button>
            </SignUpButton>
            <button
              type="button"
              onClick={() => scrollTo('demo')}
              className="flex h-12 items-center gap-2 rounded-2xl border-2 border-amber-200 bg-white/80 px-6 text-base font-medium text-amber-800 backdrop-blur-sm transition-all hover:border-amber-400 hover:bg-amber-50"
            >
              <Play size={15} className="text-primary" fill="currentColor" />
              Live Demo ansehen
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span>✓ Keine Kreditkarte</span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span>✓ In 30 Sekunden startklar</span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span>
              ✓ Nur noch <span className="font-semibold text-slate-700">{REMAINING_FREE_SLOTS}</span> kostenlose Plätze
            </span>
          </div>
        </div>

        {/* Right: chat mockup */}
        <div className="hidden items-center justify-center py-16 md:flex">
          <ChatMockup />
        </div>
        </div>
      </div>
    </section>
  )
}

// ── Problem / Solution (Social proof transition) ─────────────────────────────

function ProblemSolutionSection() {
  return (
    <section
      id="problem"
      className="relative flex flex-col justify-center px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 45%, #FEF3C7 100%)', minHeight: 'min(100svh, 920px)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(180,100,0,0.07) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/2 h-[min(120vw,640px)] w-[min(120vw,640px)] -translate-y-1/2 rounded-full bg-amber-200/20 blur-[100px]" />
        <div className="absolute -right-[18%] bottom-0 h-[min(90vw,480px)] w-[min(90vw,480px)] rounded-full bg-orange-200/25 blur-[90px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[28vh] min-h-[160px] max-h-[280px] w-full text-amber-300/[0.08]" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,95 Q400,55 800,100 T1440,80 L1440,180 L0,180 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[960px]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
          Das Problem
        </div>
        <h2 className="mb-5 text-[clamp(26px,3.8vw,40px)] font-bold leading-tight text-slate-900">
          Bewerben kostet Zeit. Viel Zeit.
        </h2>
        <p className="mb-12 max-w-[720px] text-lg leading-relaxed text-slate-600">
          Durchschnittlich 45 Minuten pro Anschreiben.
          3 Stunden Vorbereitung pro Interview.
          Und trotzdem die Frage: Passe ich überhaupt auf diese Stelle?
          PrivatePrep analysiert die Stellenanzeige in Sekunden —
          nicht in Stunden. Du weißt sofort, worauf es ankommt,
          und bereitest dich gezielt vor statt ins Blaue.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <p className="mb-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
              45 Min <span className="text-amber-600">→</span> 10 Sek
            </p>
            <p className="text-sm font-medium text-slate-700">Stellenanalyse statt manuelles Lesen</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <p className="mb-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">12 Keywords</p>
            <p className="text-sm font-medium text-slate-700">Durchschnittlich erkannte Schlüsselbegriffe pro Stelle</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <p className="mb-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">5 Werkzeuge</p>
            <p className="text-sm font-medium text-slate-700">Alles in einer Oberfläche</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features Section ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '💼',
    color: '#10B981',
    iconBg: 'bg-emerald-100/90 ring-1 ring-emerald-200/60',
    title: 'Stellenanalyse',
    desc: 'Stellenanzeige einfügen — sofort sehen, welche Keywords zählen, wo dein Profil matcht und welche Lücken du im Anschreiben adressieren solltest.',
    chip: '„Analysiere diese Stelle: [Text einfügen]"',
    highlight: true,
    badge: 'Karriere',
    cardClass:
      'border-emerald-400/35 bg-gradient-to-br from-emerald-50/95 via-white/75 to-teal-100/45 shadow-[0_12px_40px_-12px_rgba(5,150,105,0.22)] ring-1 ring-emerald-300/25',
    chipClass: 'border border-emerald-300/50 bg-emerald-100/70 text-emerald-950/80',
  },
  {
    icon: '🎯',
    color: '#06B6D4',
    iconBg: 'bg-cyan-100/90 ring-1 ring-cyan-200/60',
    title: 'Interview Coach',
    desc: 'Realistische Fragen basierend auf der Stelle und deinem Profil. Mit Antwortstruktur nach der STAR-Methode und konkretem Feedback.',
    chip: '„Gib mir 5 Fragen für diese Stelle"',
    highlight: true,
    badge: 'Karriere',
    cardClass:
      'border-cyan-400/35 bg-gradient-to-br from-cyan-50/95 via-white/75 to-sky-100/50 shadow-[0_12px_40px_-12px_rgba(8,145,178,0.18)] ring-1 ring-cyan-300/25',
    chipClass: 'border border-cyan-300/50 bg-cyan-100/65 text-cyan-950/85',
  },
  {
    icon: '💬',
    color: '#64748B',
    iconBg: 'bg-violet-100/80 ring-1 ring-violet-200/50',
    title: 'KI-Chat',
    desc: 'Texte schärfen, Fragen klären, Ideen entwickeln. Dein offener Arbeitsbereich für alles, was keine feste Kategorie braucht.',
    chip: '„Wie formuliere ich das professioneller?"',
    highlight: false,
    badge: 'Flex',
    cardClass:
      'border-violet-300/40 bg-gradient-to-br from-slate-100/90 via-violet-50/55 to-indigo-50/40 shadow-[0_10px_36px_-12px_rgba(99,102,241,0.14)] ring-1 ring-violet-200/30',
    chipClass: 'border border-violet-200/60 bg-violet-100/55 text-violet-950/80',
  },
  {
    icon: '💻',
    color: '#3B82F6',
    iconBg: 'bg-sky-100/90 ring-1 ring-sky-200/60',
    title: 'Code-Assistent',
    desc: 'Code reviewen, Bugs finden, Algorithmen verstehen. Für alle Sprachen, von JavaScript bis Python, von Anfänger bis Senior.',
    chip: '„Was ist falsch in meinem Code?"',
    highlight: false,
    badge: 'Tech',
    cardClass:
      'border-sky-400/35 bg-gradient-to-br from-sky-50/95 via-white/70 to-indigo-100/40 shadow-[0_12px_40px_-12px_rgba(37,99,235,0.16)] ring-1 ring-sky-300/25',
    chipClass: 'border border-sky-300/55 bg-sky-100/70 text-sky-950/85',
  },
  {
    icon: '🌍',
    color: '#F59E0B',
    iconBg: 'bg-amber-100/90 ring-1 ring-amber-200/60',
    title: 'Sprachtraining',
    desc: 'Lerne mit echten Gesprächen. Übersetzung, Grammatik und Aussprache-Feedback — für Bewerbungen im Ausland oder den Arbeitsalltag.',
    chip: '„Wie sage ich ‚Ich suche einen neuen Job‘ auf Spanisch?"',
    highlight: false,
    badge: 'Sprache',
    cardClass:
      'border-amber-400/40 bg-gradient-to-br from-amber-50/95 via-orange-50/50 to-amber-100/45 shadow-[0_12px_40px_-12px_rgba(217,119,6,0.18)] ring-1 ring-amber-300/30',
    chipClass: 'border border-amber-300/55 bg-amber-100/75 text-amber-950/85',
  },
] as const

function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ minHeight: '100svh' }}
    >
      {/* Lebendiger Basis-Gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 50% -15%, rgba(251,191,36,0.42), transparent 52%),
            radial-gradient(ellipse 70% 50% at 100% 40%, rgba(167,139,250,0.14), transparent 50%),
            radial-gradient(ellipse 65% 45% at 0% 65%, rgba(52,211,153,0.13), transparent 48%),
            linear-gradient(175deg, #fde68a 0%, #fef08a 12%, #fef3c7 38%, #fff7ed 72%, #fffdfb 100%)
          `,
        }}
      />
      {/* Feines Raster */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(146,64,14,0.11) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }}
      />

      {/* Farbakzente: große Blobs + Wellen + größere Formen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-[18%] h-[min(85vw,520px)] w-[min(85vw,520px)] rounded-full bg-amber-400/25 blur-[100px]" />
        <div className="absolute -left-24 bottom-[8%] h-[min(78vw,460px)] w-[min(78vw,460px)] rounded-full bg-orange-300/22 blur-[95px]" />
        <div className="absolute left-1/2 top-[45%] h-[min(55vw,420px)] w-[min(55vw,420px)] -translate-x-1/2 rounded-full bg-emerald-400/14 blur-[85px]" />
        <div className="absolute right-[5%] top-[12%] h-[min(40vw,320px)] w-[min(40vw,320px)] rounded-full bg-violet-300/12 blur-[80px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[36vh] min-h-[200px] max-h-[380px] w-full text-amber-400/[0.09]" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,120 Q420,75 840,125 T1440,100 L1440,220 L0,220 Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-0 left-0 right-0 h-[22vh] min-h-[120px] max-h-[200px] w-full text-emerald-400/[0.06]" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,45 Q1080,85 720,55 T0,70 L0,0 Z" fill="currentColor" />
        </svg>
        <div className="absolute right-[5%] top-[20%] h-28 w-28 bg-amber-500/18" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div className="absolute left-[5%] top-[52%] h-20 w-20 bg-amber-500/16" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div className="absolute right-[12%] bottom-[14%] h-28 w-28 rounded-full border-2 border-amber-400/22" />
        <div className="absolute left-[8%] top-[26%] h-16 w-16 rounded-full border-2 border-amber-500/20" />
        <div className="absolute left-[18%] bottom-[8%] h-20 w-20 rotate-45 rounded-lg border border-amber-500/22" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1100px]">
        <div className="mb-14 text-center">
          <FeaturesHeadingOrnament />
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-800">
            Werkzeuge
          </div>
          <h2 className="mb-3 text-[clamp(28px,4vw,44px)] font-bold text-slate-900">
            Alles, was du für die Bewerbung brauchst
          </h2>
          <p className="text-lg text-slate-600">
            Fünf spezialisierte KI-Werkzeuge. Eine Oberfläche. Kein Tool-Hopping.
          </p>
        </div>

        {/* Mobile: horizontal snap-scroll  |  sm+: 2-col  |  lg+: 3-col */}
        <div className={[
          'flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide',
          '-mx-6 px-6',
          'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-x-visible sm:pb-0 sm:snap-none',
          'lg:grid-cols-3',
        ].join(' ')}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={[
                'w-[78vw] max-w-[300px] flex-shrink-0 snap-center',
                'sm:w-auto sm:max-w-none',
                'group relative cursor-default overflow-hidden rounded-2xl border p-6 backdrop-blur-[2px] transition-all duration-200 hover:-translate-y-1.5',
                f.cardClass,
                f.highlight ? 'sm:ring-2 sm:ring-amber-400/35' : '',
              ].join(' ')}
            >
              {/* Warm glow on hover */}
              <div
                className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-90"
                style={{ background: `${f.color}35` }}
              />
              {'badge' in f && f.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-amber-900/15">
                  {f.badge}
                </span>
              )}
              <div className={`relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-sm ${f.iconBg}`}>
                {f.icon}
              </div>
              <h3 className="relative z-10 mb-2 text-base font-bold text-slate-900">{f.title}</h3>
              <p className="relative z-10 mb-4 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              <span
                className={[
                  'relative z-10 inline-flex w-full items-center rounded-xl px-3 py-2 font-mono text-[11px] leading-snug sm:text-xs',
                  f.chipClass,
                ].join(' ')}
              >
                {f.chip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Live Demo Section ─────────────────────────────────────────────────────────

interface DemoMessage {
  role: 'user' | 'assistant'
  text: string
  ts?: string
}

type DemoTool = 'language' | 'job' | 'interview' | 'programming' | 'general'

interface DemoToolConfig {
  emoji: string
  label: string
  placeholder: string
  chip: string
}

const DEMO_TOOL_CONFIG: Record<DemoTool, DemoToolConfig> = {
  job: {
    emoji: '💼',
    label: 'Stellenanalyse',
    placeholder: 'Stellenanzeige oder Anforderungen einfügen…',
    chip: 'Analysiere diese Stelle: Junior Softwareentwickler (m/w/d), React, TypeScript, agile Methoden',
  },
  interview: {
    emoji: '🎯',
    label: 'Interview',
    placeholder: 'Zielposition eingeben…',
    chip: 'Gib mir 5 Fragen für diese Stelle',
  },
  programming: {
    emoji: '💻',
    label: 'Code',
    placeholder: 'Code oder Frage eingeben…',
    chip: 'Was ist der Unterschied zwischen async/await und Promises?',
  },
  language: {
    emoji: '🌍',
    label: 'Sprachen',
    placeholder: 'Schreib auf Deutsch…',
    chip: 'Wie sage ich „Ich suche einen neuen Job“ auf Spanisch?',
  },
  general: {
    emoji: '💬',
    label: 'Chat',
    placeholder: 'Stell eine Frage…',
    chip: 'Wie formuliere ich das professioneller?',
  },
}

const TOOL_ORDER: DemoTool[] = ['job', 'interview', 'programming', 'language', 'general']
const PER_TOOL_LIMIT = 2 // each tool gets 2 independent messages

function buildAskParams(tool: DemoTool, msg: string, sessionId: string) {
  const base = { message: msg, sessionId }
  switch (tool) {
    case 'language':
      return {
        ...base,
        toolType: 'language' as const,
        languageLearningMode: true,
        nativeLanguage: 'Deutsch',
        targetLanguage: 'Spanisch',
        nativeLanguageCode: 'de',
        targetLanguageCode: 'es',
        level: 'adaptive',
        learningGoal: 'Kurze Sätze, Zielsprache und Übersetzung',
      }
    case 'job':
      return { ...base, toolType: 'jobanalyzer' as const }
    case 'interview':
      return { ...base, toolType: 'interviewprep' as const }
    case 'programming':
      return { ...base, toolType: 'programming' as const }
    default:
      return { ...base, toolType: undefined }
  }
}

// ── Markdown helpers ──────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

interface RichLineProps { line: string; dotColor: string; numColor: string }
function RichLine({ line, dotColor, numColor }: RichLineProps) {
  if (!line.trim()) return <div className="h-1" />
  if (/^#{1,3}\s/.test(line)) {
    return <p className="mt-1.5 font-semibold text-slate-800">{renderInline(line.replace(/^#{1,3}\s/, ''))}</p>
  }
  if (/^[-•*]\s/.test(line)) {
    return (
      <p className="flex items-start gap-2">
        <span className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`} />
        <span className="leading-relaxed">{renderInline(line.replace(/^[-•*]\s/, ''))}</span>
      </p>
    )
  }
  const nm = line.match(/^(\d+)\.\s(.+)/)
  if (nm) {
    return (
      <p className="flex items-start gap-2">
        <span className={`flex-shrink-0 font-bold ${numColor}`}>{nm[1]}.</span>
        <span className="leading-relaxed">{renderInline(nm[2])}</span>
      </p>
    )
  }
  return <p className="leading-relaxed">{renderInline(line)}</p>
}

interface RichTextProps { text: string; dotColor: string; numColor: string }
function RichText({ text, dotColor, numColor }: RichTextProps) {
  return (
    <div className="space-y-0.5 text-sm text-slate-700">
      {text.split('\n').map((line, i) => (
        <RichLine key={i} line={line} dotColor={dotColor} numColor={numColor} />
      ))}
    </div>
  )
}

function parseCodeBlocks(text: string): Array<{ type: 'text' | 'code'; content: string }> {
  const parts: Array<{ type: 'text' | 'code'; content: string }> = []
  const regex = /```(?:\w+)?\n?([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) })
    parts.push({ type: 'code', content: m[1].trim() })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })
  return parts
}

// ── Tool-specific response cards ──────────────────────────────────────────────

function JobResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-emerald-100 px-4 py-2">
        <span className="text-sm">💼</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Job-Analyse</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-emerald-400" numColor="text-emerald-600" />
      </div>
    </div>
  )
}

function InterviewResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-cyan-100 px-4 py-2">
        <span className="text-sm">🎯</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700">Interview-Vorbereitung</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-cyan-400" numColor="text-cyan-600" />
      </div>
    </div>
  )
}

function CodeResponseBubble({ text }: { text: string }) {
  const parts = parseCodeBlocks(text)
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-slate-200 px-4 py-2">
        <span className="text-sm">💻</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Code-Assistent</span>
      </div>
      <div className="space-y-2 px-4 py-3">
        {parts.map((p, i) =>
          p.type === 'code'
            ? (
              <pre key={i} className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2.5 text-xs leading-relaxed text-emerald-400">
                <code>{p.content}</code>
              </pre>
            )
            : p.content.trim()
              ? <RichText key={i} text={p.content.trim()} dotColor="bg-slate-400" numColor="text-slate-600" />
              : null
        )}
      </div>
    </div>
  )
}

function GeneralResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-amber-100 px-4 py-2">
        <span className="text-sm">💬</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">PrivatePrep</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-amber-400" numColor="text-amber-600" />
      </div>
    </div>
  )
}

function DemoAssistantBubble({ text, tool }: { text: string; tool: DemoTool }) {
  if (tool === 'language') {
    const parsed = parseLearningResponse(text)
    if (parsed?.isStructured) {
      return (
        <LearningResponse
          data={{
            targetLanguageText: parsed.targetText,
            nativeLanguageText: parsed.translationText,
            learnTip: parsed.tipText ?? undefined,
          }}
          targetLang="Spanisch"
          nativeLang="Deutsch"
          targetLangCode="es"
          timestamp={new Date().toISOString()}
          fetchAudio={fetchDemoTtsAudio}
        />
      )
    }
  }
  if (tool === 'job')         return <JobResponseBubble text={text} />
  if (tool === 'interview')   return <InterviewResponseBubble text={text} />
  if (tool === 'programming') return <CodeResponseBubble text={text} />
  return <GeneralResponseBubble text={text} />
}

function LiveDemoSection() {
  const [activeTool, setActiveTool] = useState<DemoTool>('job')
  const [msgByTool, setMsgByTool] = useState<Record<DemoTool, DemoMessage[]>>({
    language: [], job: [], interview: [], programming: [], general: [],
  })
  // per-tool independent message count (each tool has PER_TOOL_LIMIT messages)
  const [countByTool, setCountByTool] = useState<Record<DemoTool, number>>({
    language: 0, job: 0, interview: 0, programming: 0, general: 0,
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sessionIds = useRef<Record<DemoTool, string>>({
    language:    `demo_${Math.random().toString(36).slice(2, 9)}`,
    job:         `demo_${Math.random().toString(36).slice(2, 9)}`,
    interview:   `demo_${Math.random().toString(36).slice(2, 9)}`,
    programming: `demo_${Math.random().toString(36).slice(2, 9)}`,
    general:     `demo_${Math.random().toString(36).slice(2, 9)}`,
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgByTool, loading])

  const currentMsgs  = msgByTool[activeTool]
  const cfg          = DEMO_TOOL_CONFIG[activeTool]
  const toolCount    = countByTool[activeTool]
  const atToolLimit  = toolCount >= PER_TOOL_LIMIT
  const allExhausted = TOOL_ORDER.every(t => countByTool[t] >= PER_TOOL_LIMIT)
  const unusedTools  = TOOL_ORDER.filter(t => countByTool[t] < PER_TOOL_LIMIT && t !== activeTool)

  const handleToolSwitch = (tool: DemoTool) => {
    setActiveTool(tool)
    setInput('')
  }

  const handleReset = () => {
    setMsgByTool(prev => ({ ...prev, [activeTool]: [] }))
    setCountByTool(prev => ({ ...prev, [activeTool]: 0 }))
    sessionIds.current[activeTool] = `demo_${Math.random().toString(36).slice(2, 9)}`
    setInput('')
  }

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || atToolLimit || loading) return
    setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'user', text: msg }] }))
    setInput('')
    setLoading(true)
    try {
      const res = await askAgentDemo(buildAskParams(activeTool, msg, sessionIds.current[activeTool]))
      const ts = new Date().toISOString()
      setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'assistant', text: res.reply, ts }] }))
      setCountByTool(prev => ({ ...prev, [activeTool]: prev[activeTool] + 1 }))
    } catch (err: unknown) {
      const isDemoLimit = err instanceof Error && (err.message === 'demo_limit' || err.name === 'UsageLimitError')
      const errText = isDemoLimit
        ? 'Demo-Limit erreicht. Registriere dich für unbegrenzten Zugang.'
        : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
      setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'assistant', text: errText }] }))
      if (isDemoLimit) setCountByTool(prev => ({ ...prev, [activeTool]: PER_TOOL_LIMIT }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="demo"
      className="relative flex flex-col justify-center overflow-hidden px-4 py-16 scroll-mt-14 sm:px-6 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #fffef4 0%, #FFFBEB 30%, #FEF9C3 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(180,100,0,0.06) 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      />
      {/* Große Blobs, Wellen, zweite Akzentfarbe */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-[18%] h-[min(75vw,440px)] w-[min(75vw,440px)] rounded-full bg-amber-200/18 blur-[85px]" />
        <div className="absolute -right-24 bottom-[20%] h-[min(82vw,480px)] w-[min(82vw,480px)] rounded-full bg-amber-200/16 blur-[80px]" />
        <div className="absolute -right-[8%] top-[38%] h-[min(50vw,420px)] w-[min(50vw,420px)] rounded-full bg-violet-200/14 blur-[75px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[34vh] min-h-[200px] max-h-[360px] w-full text-amber-300/[0.1]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,105 Q380,65 760,110 T1440,95 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-0 left-0 right-0 h-[22vh] min-h-[120px] max-h-[200px] w-full text-violet-300/[0.06]" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,38 Q960,78 480,48 T0,62 L0,0 Z" fill="currentColor" />
        </svg>
        <div className="absolute right-[4%] top-[12%] h-24 w-24 rotate-45 rounded-xl border border-amber-300/22" />
        <div className="absolute left-[3%] bottom-[18%] h-28 w-28 bg-amber-300/14" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[640px]">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Probier es aus</p>
          <h2 className="mb-3 text-3xl font-bold text-slate-800">In 10 Sekunden verstehen, was PrivatePrep kann</h2>
          <p className="text-slate-600">
            Keine Anmeldung nötig. Wähle ein Werkzeug und stelle eine Frage.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            2 kostenlose Nachrichten pro Werkzeug — kein Account nötig.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* ── Tool tabs with progress badges ── */}
          <div className="flex border-b border-slate-100">
            {TOOL_ORDER.map(tool => {
              const t = DEMO_TOOL_CONFIG[tool]
              const isActive   = activeTool === tool
              const count      = countByTool[tool]
              const exhausted  = count >= PER_TOOL_LIMIT
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => handleToolSwitch(tool)}
                  className={[
                    'relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition-all duration-150',
                    isActive && !exhausted  ? 'border-b-2 border-primary bg-white text-primary'
                      : isActive && exhausted ? 'border-b-2 border-emerald-400 bg-white text-emerald-600'
                        : exhausted           ? 'border-b-2 border-transparent text-slate-300 hover:text-slate-400'
                          : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600',
                  ].join(' ')}
                  title={t.label}
                >
                  <span className="relative text-[17px]">
                    {t.emoji}
                    {/* ✓ badge when exhausted */}
                    {exhausted && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 text-[7px] font-bold leading-none text-white">
                        ✓
                      </span>
                    )}
                    {/* count badge when partially used */}
                    {!exhausted && count > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold leading-none text-white">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:block">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── Messages ── */}
          <div className="max-h-[360px] min-h-[180px] space-y-4 overflow-y-auto p-3 sm:p-5">
            {currentMsgs.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-4xl">{cfg.emoji}</span>
                <p className="text-sm text-slate-400">
                  {atToolLimit && !allExhausted
                    ? `${cfg.label} ausprobiert! Wähle ein anderes Werkzeug.`
                    : allExhausted
                      ? 'Alle Werkzeuge ausprobiert. Registriere dich für unbegrenzten Zugang.'
                      : 'Tippe eine Frage oder nutze den Vorschlag unten.'}
                </p>
              </div>
            )}

            {currentMsgs.map((m, i) => (
              <div
                key={`${activeTool}-${m.role}-${i}`}
                className={m.role === 'user' ? 'flex justify-end' : 'flex'}
              >
                {m.role === 'user' ? (
                  <div className="max-w-[85%] break-words rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  </div>
                ) : (
                  <DemoAssistantBubble text={m.text} tool={activeTool} />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex">
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Chip (only when no messages yet for this tool) ── */}
          {!atToolLimit && currentMsgs.length === 0 && (
            <div className="px-3 pb-3 sm:px-5">
              <button
                type="button"
                onClick={() => void send(cfg.chip)}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs text-slate-600 transition-colors hover:border-amber-600/40 hover:bg-primary-light hover:text-primary"
              >
                <span className="flex-shrink-0">{cfg.emoji}</span>
                <span className="truncate">{cfg.chip}</span>
                <span className="ml-auto flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  Ausprobieren →
                </span>
              </button>
            </div>
          )}

          {/* ── Bottom area: tool exhausted / all exhausted / input ── */}
          {allExhausted ? (
            <div className="border-t border-slate-100 px-4 py-6 text-center sm:px-5">
              <p className="mb-1 text-sm font-semibold text-slate-800">
                Du hast alle 5 Werkzeuge ausprobiert 🎉
              </p>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Kostenlos registrieren: täglich 20 Nachrichten, alle Werkzeuge, Verlauf im Browser.
              </p>
              <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
                <button className="mb-3 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto">
                  Kostenlos registrieren: 20 Nachrichten pro Tag
                </button>
              </SignUpButton>
              <p className="text-xs text-slate-400">
                Bereits Konto?{' '}
                <SignInButton mode="modal" fallbackRedirectUrl="/tools">
                  <button type="button" className="font-medium text-primary hover:underline">
                    Anmelden
                  </button>
                </SignInButton>
              </p>
            </div>
          ) : atToolLimit ? (
            /* Current tool exhausted — nudge to other tools */
            <div className="border-t border-slate-100 px-3 py-4 sm:px-5">
              <p className="mb-3 text-center text-xs font-medium text-slate-500">
                ✅ <strong>{cfg.label}</strong> ausprobiert! Noch {unusedTools.length} Werkzeug{unusedTools.length !== 1 ? 'e' : ''} übrig:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {unusedTools.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToolSwitch(t)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-amber-600/40 hover:bg-primary-light hover:text-primary"
                  >
                    <span>{DEMO_TOOL_CONFIG[t].emoji}</span>
                    {DEMO_TOOL_CONFIG[t].label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-center">
                <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
                  <button className="text-xs font-medium text-primary hover:underline">
                    Oder direkt registrieren →
                  </button>
                </SignUpButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 border-t border-slate-100 px-3 py-2.5 sm:gap-2 sm:px-4">
              {currentMsgs.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
                  title="Gespräch zurücksetzen"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
                }}
                placeholder={cfg.placeholder}
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-amber-600/20 disabled:opacity-50 sm:px-4"
                style={{ fontSize: 'max(16px, 0.875rem)' }}
              />
              <button
                type="button"
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          )}

          {/* ── Per-tool message counter ── */}
          {!atToolLimit && !allExhausted && (
            <div className="flex items-center justify-between border-t border-slate-50 px-3 py-2 sm:px-5">
              <span className="text-[10px] text-slate-300">
                {PER_TOOL_LIMIT - toolCount} von {PER_TOOL_LIMIT} Nachrichten für {cfg.label}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: PER_TOOL_LIMIT }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-4 rounded-full transition-colors ${i < toolCount ? 'bg-primary' : 'bg-slate-100'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ── How It Works Section ──────────────────────────────────────────────────────

const STEPS = [
  {
    num: '1',
    icon: '🔑',
    title: 'Kostenloses Konto erstellen',
    text: 'Melde dich mit einem Klick über Google an. Keine Kreditkarte nötig.',
    color: 'from-amber-400 to-amber-300',
    glow: 'bg-amber-400/50',
  },
  {
    num: '2',
    icon: '🎯',
    title: 'Werkzeug wählen',
    text: 'Stellenanalyse, Interview-Vorbereitung, Code-Hilfe, Sprachtraining oder freier Chat.',
    color: 'from-amber-500 to-amber-400',
    glow: 'bg-amber-500/50',
  },
  {
    num: '3',
    icon: '⚡',
    title: 'Sofort loslegen',
    text: 'Die KI analysiert dein Anliegen und liefert eine strukturierte, umsetzbare Antwort — in Sekunden, nicht Stunden.',
    color: 'from-amber-600 to-amber-500',
    glow: 'bg-amber-600/50',
  },
] as const

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(160deg, #1C1200 0%, #0D0800 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
      />

      {/* Große Flächen, Wellenbänder, skalierte Akzente */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-[18%] h-[min(95vw,560px)] w-[min(95vw,560px)] rounded-full bg-amber-500/16 blur-[110px]" />
        <div className="absolute -right-24 bottom-[20%] h-[min(88vw,500px)] w-[min(88vw,500px)] rounded-full bg-amber-300/12 blur-[95px]" />
        <div className="absolute left-1/2 top-[55%] h-[min(70vw,520px)] w-[min(70vw,520px)] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[100px]" />
        <svg className="absolute top-0 left-0 right-0 h-[32vh] min-h-[180px] max-h-[320px] w-full text-amber-400/[0.07]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,75 Q720,130 0,95 L0,0 Z" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-0 left-0 right-0 h-[30vh] min-h-[180px] max-h-[300px] w-full text-white/[0.04]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,110 Q360,70 720,110 T1440,95 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
        <div className="absolute right-[7%] top-[20%] h-28 w-28 bg-amber-400/16" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute left-[5%] bottom-[18%] h-24 w-24 bg-amber-400/12" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute left-[14%] top-[26%] h-40 w-40 rounded-full border border-amber-500/14" />
        <div className="absolute right-[18%] bottom-[14%] h-32 w-32 rounded-full border border-amber-400/10" />
        <div className="absolute right-[4%] bottom-[36%] h-20 w-20 rotate-45 border-2 border-amber-400/16" />
        <div className="absolute left-[26%] top-[12%] h-24 w-24 rotate-45 rounded-lg bg-amber-400/10" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[900px]">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white/55">
            So funktioniert es
          </div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold text-white">
            In 30 Sekunden startklar
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="absolute left-[calc(50%/3+52px)] right-[calc(50%/3+52px)] top-7 hidden h-px border-t border-dashed border-white/10 md:block" />

          {STEPS.map((s) => (
            <div key={s.num} className="relative z-10 text-center">
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-xl ${s.glow}`} />
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-lg font-bold text-white shadow-lg`}>
                  {s.num}
                </div>
              </div>
              <div className="mb-3 text-4xl">{s.icon}</div>
              <h3 className="mb-2 text-base font-bold text-white">{s.title}</h3>
              <p className="text-sm leading-relaxed text-white/45">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Für wen? ────────────────────────────────────────────────────────────────

const AUDIENCE = [
  {
    title: 'Jobsuchende',
    text: 'Du bewirbst dich aktiv? PrivatePrep analysiert jede Stellenanzeige und bereitet dich gezielt auf das Interview vor. Kein Raten mehr — nur Fakten.',
  },
  {
    title: 'Karrierewechsler',
    text: 'Neues Feld, neue Anforderungen. Die KI zeigt dir genau, welche Kompetenzen du hervorheben solltest und wo du Lücken ansprechen musst.',
  },
  {
    title: 'Studierende & Berufseinsteiger',
    text: 'Erster Job, erste Bewerbung. PrivatePrep gibt dir die Struktur und die Sicherheit, die du für den Einstieg brauchst.',
  },
  {
    title: 'Entwickler',
    text: 'Code-Reviews, Debugging und Interview-Vorbereitung für technische Vorstellungsgespräche — mit einem Tool, das deine Sprache spricht.',
  },
] as const

function FuerWenSection() {
  return (
    <section
      id="audience"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFBEB 50%, #FEF3C7 100%)', minHeight: 'min(100svh, 900px)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(180,100,0,0.06) 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-[20%] h-[min(85vw,480px)] w-[min(85vw,480px)] rounded-full bg-amber-200/22 blur-[90px]" />
        <div className="absolute -left-24 bottom-[15%] h-[min(80vw,440px)] w-[min(80vw,440px)] rounded-full bg-orange-200/18 blur-[85px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[30vh] min-h-[180px] max-h-[300px] w-full text-amber-300/[0.08]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,100 Q400,58 800,105 T1440,88 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1000px]">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-800">
            Für wen
          </div>
          <h2 className="text-[clamp(26px,3.8vw,40px)] font-bold text-slate-900">
            Egal wo du stehst — PrivatePrep hilft beim nächsten Schritt
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {AUDIENCE.map(a => (
            <div
              key={a.title}
              className="rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm"
            >
              <h3 className="mb-2 text-base font-bold text-slate-900">{a.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Brauche ich technische Kenntnisse?',
    a: 'Nein. Du schreibst einfach auf Deutsch, was du brauchst. Die KI versteht dein Anliegen und antwortet strukturiert.',
  },
  {
    q: 'Was unterscheidet PrivatePrep von ChatGPT?',
    a: 'PrivatePrep ist auf Karriere-Vorbereitung spezialisiert. Die Stellenanalyse und der Interview Coach sind gezielt dafür gebaut — nicht generisch, sondern auf deinen Lebenslauf und die konkrete Stelle abgestimmt.',
  },
  {
    q: 'Sind meine Daten sicher?',
    a: 'Ja. Deine Gespräche werden nicht zum Trainieren von KI-Modellen verwendet. Die Datenverarbeitung erfolgt über verschlüsselte Verbindungen.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja, mit einem Klick. Keine Mindestlaufzeit, keine versteckten Gebühren.',
  },
  {
    q: 'In welchen Sprachen funktioniert PrivatePrep?',
    a: 'Die Oberfläche ist auf Deutsch. Die KI versteht und antwortet in über 50 Sprachen — ideal für Bewerbungen im internationalen Umfeld.',
  },
  {
    q: 'Was passiert nach den kostenlosen Nachrichten?',
    a: 'Du kannst warten (das Limit setzt um Mitternacht zurück) oder auf Starter upgraden, um sofort weiterzumachen und Zugang zur Stellenanalyse zu bekommen.',
  },
] as const

function FaqSection() {
  return (
    <section
      id="faq"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #FFFBEB 0%, #FFF8F0 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[30%] h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-x-1/2 rounded-full bg-amber-100/35 blur-[85px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[26vh] min-h-[150px] max-h-[260px] w-full text-amber-200/[0.35]" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,88 Q380,52 760,92 T1440,78 L1440,180 L0,180 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[720px]">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-800">
            Häufige Fragen
          </div>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map(item => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm open:border-amber-200 open:shadow-md"
            >
              <summary className="cursor-pointer list-none text-left text-sm font-semibold text-slate-900 after:float-right after:text-slate-400 after:content-['+'] group-open:after:content-['−']">
                {item.q}
              </summary>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing Preview Section ───────────────────────────────────────────────────

type PlanFeature = { text: string; included: boolean }

const PREVIEW_PLANS: Array<{
  id: string
  name: string
  price: string
  period: string
  icon: string
  borderClass: string
  headerBg: string
  badge?: string
  features: PlanFeature[]
  cta: string
  ctaClass: string
  useSignUp: boolean
  href?: string
  scale: boolean
}> = [
  {
    id: 'free',
    name: 'Free',
    price: '0 €',
    period: '',
    icon: '⚡',
    borderClass: 'border-slate-200',
    headerBg: 'bg-white',
    features: [
      { text: '20 Nachrichten pro Tag (nach Anmeldung)', included: true },
      { text: 'KI-Chat, Sprachtraining und Code-Assistent', included: true },
      { text: 'Sitzungsspeicher im Browser', included: true },
      { text: 'Stellenanalyse', included: false },
      { text: 'Interview Coach', included: false },
      { text: 'Gesprächsverlauf', included: false },
    ],
    cta: 'Kostenlos starten',
    ctaClass: 'border border-slate-300 bg-white text-slate-600 hover:border-amber-300 hover:text-primary',
    useSignUp: true,
    scale: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '6,90 €',
    period: '/ Monat',
    icon: '✨',
    borderClass: 'border-primary border-2',
    headerBg: 'bg-gradient-to-br from-amber-50 to-amber-50',
    badge: 'Empfohlen',
    features: [
      { text: '50 Nachrichten pro Tag', included: true },
      { text: 'Alle 5 Werkzeuge inkl. Stellenanalyse & Interview Coach', included: true },
      { text: 'Audio-Aussprache', included: true },
      { text: '14 Tage Gesprächsverlauf', included: true },
    ],
    cta: 'Starter wählen',
    ctaClass: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-200 hover:shadow-lg',
    useSignUp: false,
    href: '/pricing',
    scale: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '14,90 €',
    period: '/ Monat',
    icon: '👑',
    borderClass: 'border-amber-300',
    headerBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    features: [
      { text: '200 Nachrichten pro Tag', included: true },
      { text: 'Alle Werkzeuge + Priorität', included: true },
      { text: 'Vollständiger Gesprächsverlauf', included: true },
      { text: 'API-Zugang (demnächst)', included: true },
    ],
    cta: 'Pro werden',
    ctaClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200 hover:shadow-lg',
    useSignUp: false,
    href: '/pricing',
    scale: false,
  },
]

function PricingPreviewSection() {
  return (
    <section
      id="pricing"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 50%, #FFF7ED 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.14) 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      />

      {/* Große Blobs, Wellen, Formen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-16 h-[min(95vw,560px)] w-[min(95vw,560px)] rounded-full bg-amber-300/26 blur-[95px]" />
        <div className="absolute -left-28 bottom-0 h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full bg-orange-300/20 blur-[85px]" />
        <div className="absolute left-1/2 top-[40%] h-[min(55vw,400px)] w-[min(55vw,400px)] -translate-x-1/2 rounded-full bg-rose-200/10 blur-[75px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[34vh] min-h-[200px] max-h-[360px] w-full text-amber-400/[0.09]" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,115 Q440,72 880,118 T1440,98 L1440,220 L0,220 Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-0 left-0 right-0 h-[20vh] min-h-[110px] max-h-[180px] w-full text-orange-300/[0.07]" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,42 Q720,88 0,58 L0,0 Z" fill="currentColor" />
        </svg>
        <div className="absolute right-[9%] top-[20%] h-28 w-28 rotate-45 rounded-xl bg-amber-400/20" />
        <div className="absolute left-[6%] top-[36%] h-20 w-20 rotate-45 rounded-lg bg-orange-400/16" />
        <div className="absolute right-[16%] bottom-[18%] h-24 w-24 rotate-45 rounded-xl border-2 border-amber-400/24" />
        <div className="absolute left-[12%] top-[12%] h-24 w-24 bg-amber-300/20" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div className="absolute right-[5%] bottom-[26%] h-36 w-36 rounded-full border-2 border-amber-400/20" />
        <div className="absolute left-[28%] bottom-[10%] h-28 w-28 bg-amber-400/14" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1000px]">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-800">
            Preise
          </div>
          <h2 className="mb-3 text-[clamp(28px,4vw,44px)] font-bold text-slate-900">
            Einfach. Transparent. Fair.
          </h2>
          <p className="text-lg text-slate-600">
            Starte kostenlos und upgrade, wenn du bereit bist. Kein Abo-Trick, keine versteckten Kosten. Jederzeit kündbar.
          </p>
        </div>

        {/* Mobile: horizontal snap-scroll  |  md+: 3-column grid */}
        <div className={[
          'flex items-stretch gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide',
          '-mx-6 px-6',
          'md:mx-0 md:grid md:grid-cols-3 md:items-center md:gap-6 md:overflow-x-visible md:pb-0 md:snap-none',
        ].join(' ')}>
          {PREVIEW_PLANS.map(plan => (
            <div
              key={plan.id}
              className={[
                'w-[78vw] max-w-[300px] flex-shrink-0 snap-center',
                'md:w-auto md:max-w-none',
                'overflow-hidden rounded-3xl border bg-white shadow-sm',
                plan.borderClass,
                plan.scale ? 'md:scale-[1.04] shadow-xl shadow-amber-300/50' : '',
              ].join(' ')}
            >
              <div className={`px-5 pb-4 pt-5 ${plan.headerBg}`}>
                {'badge' in plan && plan.badge && (
                  <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{plan.icon}</span>
                  <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
              </div>
              <div className="space-y-2.5 px-5 py-4">
                {plan.features.map(f => (
                  <div key={f.text} className="flex items-start gap-2">
                    {f.included
                      ? <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                      : <X size={14} className="mt-0.5 flex-shrink-0 text-rose-400" aria-hidden />}
                    <span className={f.included ? 'text-xs text-slate-700' : 'text-xs text-slate-500'}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                {plan.useSignUp ? (
                  <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
                    <button className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${plan.ctaClass}`}>{plan.cta}</button>
                  </SignUpButton>
                ) : (
                  <a href={'href' in plan ? plan.href : '/pricing'}>
                    <button className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${plan.ctaClass}`}>{plan.cta}</button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-600">
          Alle Pläne enthalten alle kostenlosen Werkzeuge. Jederzeit kündbar.
        </p>
      </div>
    </section>
  )
}

// ── Final CTA Section ─────────────────────────────────────────────────────────

function FinalCtaSection() {
  return (
    <section
      id="cta"
      className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-20 text-center text-white scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(160deg, #1C1200 0%, #2D1C08 50%, #3D2A10 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
      />

      {/* Große Glows, konzentrische Wellen, weiche Formen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/2 h-[min(110vw,720px)] w-[min(110vw,720px)] -translate-y-1/2 rounded-full bg-white/6 blur-[100px]" />
        <div className="absolute -right-28 top-1/2 h-[min(100vw,640px)] w-[min(100vw,640px)] -translate-y-1/2 rounded-full bg-amber-300/12 blur-[95px]" />
        <div className="absolute left-1/2 top-1/2 h-[min(120vw,780px)] w-[min(120vw,780px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6" />
        <div className="absolute left-1/2 top-1/2 h-[min(95vw,620px)] w-[min(95vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-1/2 h-[min(70vw,480px)] w-[min(70vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/10" />
        <svg className="absolute bottom-0 left-0 right-0 h-[38vh] min-h-[220px] max-h-[400px] w-full text-white/[0.05]" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,130 Q420,85 840,125 T1440,105 L1440,240 L0,240 Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-0 left-0 right-0 h-[28vh] min-h-[160px] max-h-[280px] w-full text-amber-400/[0.06]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,55 Q720,115 0,75 L0,0 Z" fill="currentColor" />
        </svg>
        <div className="absolute left-[8%] bottom-[24%] h-32 w-32 rotate-45 rounded-2xl border border-white/12" />
        <div className="absolute right-[8%] top-[26%] h-28 w-28 rotate-45 rounded-xl bg-white/[0.06]" />
        <div className="absolute right-[12%] bottom-[16%] h-40 w-40 bg-white/[0.05]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[600px]">
        <div className="mb-6 text-6xl">⚡</div>
        <h2 className="mb-4 text-[clamp(28px,4vw,44px)] font-bold">
          Deine nächste Bewerbung — besser vorbereitet als je zuvor.
        </h2>
        <p className="mb-10 text-lg text-white/75">
          Schließ dich Nutzern an, die ihre Bewerbungen gezielt statt auf gut Glück vorbereiten.
        </p>
        <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
          <button className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-10 py-4 text-base font-bold text-amber-950 shadow-2xl shadow-black/40 transition-all hover:scale-[1.02] hover:brightness-105">
            Kostenlos starten →
          </button>
        </SignUpButton>
        <p className="mt-4 text-sm text-white/40">Keine Kreditkarte erforderlich</p>
      </div>
    </section>
  )
}

// ── Footer Section ────────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <footer id="footer" className="relative overflow-hidden px-6 py-12" style={{ background: '#0D0800' }}>
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
      />
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <img src="/favicon.png" alt="PrivatePrep" className="h-7 w-7 rounded-lg" />
              <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-lg font-bold text-transparent">PrivatePrep</span>
            </div>
            <p className="text-sm text-slate-500">KI-Werkzeuge für deine Karriere</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="transition-colors hover:text-white">Datenschutz</a>
            <a href="#" className="transition-colors hover:text-white">Nutzungsbedingungen</a>
            <a href="#" className="transition-colors hover:text-white">Kontakt</a>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="mb-1 text-xs text-slate-600">Entwickelt mit .NET 9, React und Claude KI</p>
          <p className="text-xs text-slate-700">© 2026 PrivatePrep. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/tools', { replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <SectionDivider from="#FEF3C7" to="#FEF3C7" variant="wave" />
      <ProblemSolutionSection />
      <SectionDivider from="#FEF3C7" to="#FEF3C7" variant="microdots" />
      <FeaturesSection />
      <SectionDivider from="#fffdfb" to="#fffef4" variant="hatch" />
      <LiveDemoSection />
      <SectionDivider from="#FEF9C3" to="#1C1200" dark variant="blend" />
      <HowItWorksSection />
      <SectionDivider from="#0D0800" to="#FFFBEB" dark variant="sunrise" />
      <FuerWenSection />
      <SectionDivider from="#FEF3C7" to="#FFFBEB" variant="mesh" />
      <PricingPreviewSection />
      <SectionDivider from="#FFF7ED" to="#FFFBEB" variant="grain" />
      <FaqSection />
      <SectionDivider from="#FFF8F0" to="#1C1200" dark variant="thread" />
      <FinalCtaSection />
      <SectionDivider from="#3D2A10" to="#0D0800" dark variant="night" />
      <FooterSection />
    </div>
  )
}

