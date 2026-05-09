import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import { Check, ChevronRight, Loader2, Menu, Play, RotateCcw, Send, X } from 'lucide-react'
import { askAgentDemo } from '../api/client'
import AppCtaButton from '../components/ui/AppCtaButton'
import { IconHubIcon, type IconHubName } from '../components/ui/IconHubIcon'
import '../styles/landing.css'

/** Hero ChatMockup: Typewriter-Zeile nach der Denk-Animation */
const CHAT_MOCKUP_ANSWER_LINE = 'Analyse fertig. Interview-Fragen werden vorbereitet.'

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
      {...(dark ? { 'data-nav-dark-zone': 'true' } : {})}
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

// ── Navbar ───────────────────────────────────────────────────────────────────

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const navH = window.innerWidth >= 768 ? 96 : 88
  const top = el.getBoundingClientRect().top + window.scrollY - navH
  window.scrollTo({ top, behavior: 'smooth' })
}

function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  /** Desktop: dunkles Theme (gesamte Landing Page) */
  const navLinkClass = [
    'relative cursor-pointer rounded-full px-3 py-2 text-sm font-medium',
    'text-stone-200/95 [text-shadow:_0_1px_2px_rgb(0_0_0_/_45%)]',
    'transition-all duration-200 ease-out',
    'after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full',
    'after:bg-gradient-to-r after:from-amber-300 after:to-amber-200 after:transition-transform after:duration-200 after:ease-out after:scale-x-0 after:origin-center',
    'hover:bg-white/10 hover:text-white hover:after:scale-x-100',
    'active:bg-white/8 active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
  ].join(' ')

  const navLinkClassMobilePanel =
    'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-3 text-left text-sm font-medium text-stone-200 transition-all duration-200 hover:border-white/15 hover:bg-white/8 hover:shadow-sm active:scale-[0.99] active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208]'

  /** Eine warme Kante (kein kühles Weiß + Ring): Amber-Ton + weiches Innenlicht */
  const shellSurface = scrolled
    ? [
        'border border-stone-600/50 bg-gradient-to-b from-[#1e1610]/96 via-[#16100c]/97 to-[#0d0800]/99',
        'shadow-landing-lg',
        'backdrop-blur-xl backdrop-saturate-150',
      ].join(' ')
    : [
        'border border-stone-600/45 bg-gradient-to-b from-[#231a14]/92 via-[#18100c]/94 to-[#0f0a08]/97',
        'shadow-landing-md',
        'backdrop-blur-xl backdrop-saturate-150',
      ].join(' ')

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-[100] px-3 pt-3 sm:px-5 sm:pt-4">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Menü schließen"
          className="pointer-events-auto fixed inset-0 z-0 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      <nav
        className={[
          'pointer-events-auto relative z-10 mx-auto flex max-w-[1120px] items-center justify-between gap-2 rounded-2xl px-3 py-2.5 transition-[box-shadow,border-color,background-color] duration-300 sm:gap-4 sm:rounded-[1.35rem] sm:px-5 sm:py-3',
          shellSurface,
        ].join(' ')}
        aria-label="Hauptnavigation"
      >
        <button
          type="button"
          aria-label="Applikum: zum Seitenanfang"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            closeMobile()
          }}
          className="flex min-w-0 items-center gap-2 rounded-xl py-1.5 pl-1 pr-2 text-left transition-all duration-200 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <img
            src="/logo-nav.webp"
            alt=""
            width={96}
            height={96}
            decoding="async"
            fetchPriority="high"
            className="h-8 w-8 flex-shrink-0 rounded-xl ring-1 ring-amber-500/20 sm:h-9 sm:w-9"
          />
          <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-50/90 bg-clip-text text-[15px] font-bold tracking-tight text-transparent sm:text-[17px]">
            Applikum
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
          <SignInButton mode="modal" fallbackRedirectUrl="/overview">
            <button
              type="button"
              className="hidden min-h-[40px] rounded-full border border-amber-800/45 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-stone-100 shadow-sm transition-all duration-200 hover:border-amber-600/50 hover:bg-amber-950/35 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:inline-flex sm:px-4 sm:text-sm"
            >
              Anmelden
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/overview">
            <button
              type="button"
              className="inline-flex min-h-[40px] max-w-[calc(100vw-8rem)] items-center justify-center truncate rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-2 text-[11px] font-bold text-amber-950 shadow-lg shadow-black/30 ring-1 ring-amber-300/40 transition-all duration-200 hover:from-amber-300 hover:to-amber-400 hover:shadow-xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-5 sm:text-sm"
            >
              Kostenlos starten
            </button>
          </SignUpButton>

          <button
            type="button"
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-amber-800/45 bg-white/[0.06] text-white transition-all duration-200 hover:border-amber-600/50 hover:bg-amber-950/35 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:hidden"
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
          className="pointer-events-auto relative z-10 mx-auto mt-2 max-w-[1120px] overflow-hidden rounded-2xl border border-stone-600/45 bg-[#1a1208]/95 p-2 shadow-landing-md backdrop-blur-xl backdrop-saturate-150 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="flex flex-col gap-1">
            <button type="button" className={navLinkClassMobilePanel} onClick={() => go('demo')}>
              <span>Live Demo</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-400" aria-hidden />
            </button>
            <button type="button" className={navLinkClassMobilePanel} onClick={() => go('pricing')}>
              <span>Preise</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-400" aria-hidden />
            </button>
            <button type="button" className={navLinkClassMobilePanel} onClick={() => go('faq')}>
              <span>FAQ</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-400" aria-hidden />
            </button>
            <div className="my-1 border-t border-white/10" />
            <SignInButton mode="modal" fallbackRedirectUrl="/overview">
              <button
                type="button"
                className="w-full rounded-xl border border-white/18 bg-white/6 px-4 py-3 text-left text-sm font-medium text-stone-100 transition-all duration-200 hover:border-amber-400/35 hover:bg-white/10 hover:shadow-sm active:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208]"
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

type MockupVis = { m1: boolean; user: boolean; m2: boolean; typing: boolean; answer: boolean }

function ChatMockup() {
  const [vis, setVis] = useState<MockupVis>({
    m1: false,
    user: false,
    m2: false,
    typing: false,
    answer: false,
  })
  const [typedAnswer, setTypedAnswer] = useState('')

  /** Gestaffelte „Konversation“, dann kurze Denk-Animation, dann Typewriter als fertige Antwort. Loop ohne Skalierung. */
  useEffect(() => {
    let alive = true
    const timers: number[] = []
    const after = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(() => {
        if (alive) fn()
      }, ms))
    }

    function cycle() {
      if (!alive) return
      setVis({ m1: false, user: false, m2: false, typing: false, answer: false })
      setTypedAnswer('')
      after(220, () => setVis(s => ({ ...s, m1: true })))
      after(780, () => setVis(s => ({ ...s, user: true })))
      after(1380, () => setVis(s => ({ ...s, m2: true })))
      after(2080, () => setVis(s => ({ ...s, typing: true })))
      after(3180, () => setVis(s => ({ ...s, typing: false, answer: true })))
      after(9200, cycle)
    }

    cycle()
    return () => {
      alive = false
      timers.forEach(id => window.clearTimeout(id))
    }
  }, [])

  useEffect(() => {
    if (!vis.answer) {
      setTypedAnswer('')
      return
    }
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setTypedAnswer(CHAT_MOCKUP_ANSWER_LINE.slice(0, i))
      if (i >= CHAT_MOCKUP_ANSWER_LINE.length) window.clearInterval(id)
    }, 34)
    return () => window.clearInterval(id)
  }, [vis.answer])

  const avatar = (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-800 shadow-sm shadow-amber-950/40 ring-1 ring-amber-400/25">
      <IconHubIcon name="lightning" tone="inverse" className="h-3.5 w-3.5" />
    </div>
  )

  return (
    <div className="relative mx-auto max-w-[340px]">
      <div className="-rotate-2 overflow-hidden rounded-[22px] border border-stone-500/35 bg-[#100d0b] shadow-landing-lg ring-1 ring-stone-700/25">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-amber-800 to-[#92400e] px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-amber-50">
            <IconHubIcon name="lightning" tone="inverse" className="h-4 w-4 shrink-0 opacity-95" />
            Applikum
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]" />
            <span className="text-xs text-amber-100/85">Online</span>
          </div>
        </div>
        <div className="space-y-3 bg-[#0c0a08] p-4">
          {vis.m1 && (
            <div className="chat-mockup-bubble-in flex gap-2">
              {avatar}
              <div className="max-w-[220px] rounded-[12px_12px_12px_4px] border border-stone-500/30 bg-[#151210] px-3 py-2 text-xs shadow-[inset_0_1px_0_0_rgba(255,251,235,0.04)]">
                <span className="font-semibold text-teal-400/95">Stellenanalyse</span>
                <p className="mt-1 leading-snug text-stone-400">8 von 12 Keywords passen. 3 Lücken gefunden.</p>
              </div>
            </div>
          )}
          {vis.user && (
            <div className="chat-mockup-bubble-in flex justify-end">
              <div className="max-w-[220px] rounded-[12px_12px_4px_12px] border border-amber-600/35 bg-gradient-to-br from-amber-600 to-amber-800 px-3 py-2 text-xs font-medium text-amber-50 shadow-md shadow-black/25 ring-1 ring-inset ring-white/10">
                Analysiere: Junior Frontend bei CHECK24, München
              </div>
            </div>
          )}
          {vis.m2 && (
            <div className="chat-mockup-bubble-in flex gap-2">
              {avatar}
              <div className="max-w-[220px] rounded-[12px_12px_12px_4px] border border-stone-500/30 border-l-[3px] border-l-teal-600/55 bg-[#151210] px-3 py-2 text-xs shadow-[inset_0_1px_0_0_rgba(255,251,235,0.04)]">
                <p className="font-semibold text-stone-100">Ergebnis: MÖGLICH.</p>
                <p className="text-stone-400">Nächster Schritt: Anschreiben.</p>
              </div>
            </div>
          )}
          {vis.typing && (
            <div className="chat-mockup-bubble-in flex gap-2">
              {avatar}
              <div className="rounded-[12px_12px_12px_4px] border border-stone-500/30 bg-[#151210] px-3 py-3 shadow-[inset_0_1px_0_0_rgba(255,251,235,0.04)]">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          {vis.answer && (
            <div className="chat-mockup-bubble-in flex gap-2">
              {avatar}
              <div className="max-w-[220px] rounded-[12px_12px_12px_4px] border border-amber-900/35 bg-[#161008] px-3 py-2 text-xs text-stone-200 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.06)]">
                <span className="leading-relaxed">
                  {typedAnswer}
                  {typedAnswer.length < CHAT_MOCKUP_ANSWER_LINE.length && (
                    <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-amber-400/80 align-middle" aria-hidden />
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-stone-600/30 bg-[#0f0c0a] px-3 py-2.5">
          <div className="flex-1 rounded-lg border border-stone-600/35 bg-[#0a0806] px-3 py-2 text-xs text-stone-500">
            Nachricht schreiben …
          </div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 shadow-sm ring-1 ring-inset ring-white/15">
            <Send size={12} className="text-amber-50" />
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 right-0 rotate-2 flex items-center gap-2.5 rounded-2xl border border-stone-500/35 bg-[#14110e] px-3 py-2.5 shadow-landing-md ring-1 ring-amber-950/20">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/50 ring-1 ring-amber-500/20">
          <IconHubIcon name="lightning" tone="onDark" className="h-5 w-5 shrink-0 text-amber-200/90" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-100">10 Sek. Analyse</p>
          <p className="text-[10px] text-teal-400/90">Keywords & Interview-Hinweise</p>
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
      style={{ background: 'linear-gradient(165deg, #120c08 0%, #1a100a 42%, #16110d 100%)', minHeight: '100svh' }}
    >
      <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-[0.52] sm:opacity-75 md:opacity-90" />

      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
        <div className="absolute -right-40 -top-28 h-[min(95vw,780px)] w-[min(95vw,780px)] rounded-full bg-amber-600/12 blur-[130px]" />
        <div className="absolute -bottom-32 -left-32 h-[min(88vw,560px)] w-[min(88vw,560px)] rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute right-1/3 top-[42%] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full bg-amber-400/6 blur-[95px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[38vh] min-h-[220px] max-h-[380px] w-full text-white/[0.04]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,110 Q360,70 720,110 T1440,95 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 w-full px-3 sm:px-5">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 px-3 pb-16 pt-16 sm:grid-cols-2 sm:gap-10 sm:px-5 md:gap-12 md:min-h-[calc(100vh-64px)]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/22 bg-amber-950/30 px-4 py-1.5 text-xs font-semibold text-amber-100/90">
            Für Bewerbungen in Deutschland
          </div>

          <h1 className="font-serif mb-6 text-[clamp(32px,4.8vw,56px)] font-bold leading-[1.15] text-stone-100">
            <span className="mb-3 block sm:mb-4">Wissen, ob die Stelle passt.</span>
            <span className="block">Bevor du dich bewirbst.</span>
          </h1>

          <p className="mb-8 max-w-[520px] text-lg leading-relaxed text-stone-400">
            Kopier die Stellenanzeige rein. In 10 Sekunden siehst du, welche Keywords zählen, wo dein Lebenslauf Lücken hat und welche Interviewfragen auf dich zukommen.
          </p>

          <div className="mb-8 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <SignUpButton mode="modal" fallbackRedirectUrl="/overview">
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 text-base font-bold text-amber-950 shadow-lg shadow-black/35 ring-1 ring-inset ring-white/20 transition-all hover:scale-[1.02] hover:from-amber-300 hover:to-amber-400 hover:shadow-xl sm:w-auto sm:justify-start"
              >
                Kostenlos starten
              </button>
            </SignUpButton>
            <button
              type="button"
              onClick={() => scrollTo('demo')}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-stone-600/45 bg-white/[0.055] px-6 text-base font-medium text-stone-100 shadow-landing backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-amber-950/20 sm:w-auto"
            >
              <Play size={15} className="text-amber-400" fill="currentColor" />
              Live Demo
            </button>
          </div>

          <p className="max-w-[520px] text-sm text-stone-400">
            Keine Kreditkarte. In 30 Sekunden startklar.
          </p>
        </div>

        {/* Chat mockup: sichtbar ab sm (Tablet), leicht skaliert für schmalere Spalte */}
        <div className="hidden w-full justify-center pb-4 pt-2 sm:flex sm:justify-end sm:pb-0 sm:pt-0 md:justify-center md:py-12">
          <div className="origin-top scale-[0.82] sm:scale-90 md:scale-100">
            <ChatMockup />
          </div>
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
      style={{ background: 'linear-gradient(180deg, #14100c 0%, #1a130e 48%, #17110e 100%)', minHeight: 'min(100svh, 920px)' }}
    >
      <div className="landing-dot-grid-fine pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/2 h-[min(120vw,640px)] w-[min(120vw,640px)] -translate-y-1/2 rounded-full bg-amber-600/8 blur-[100px]" />
        <div className="absolute -right-[18%] bottom-0 h-[min(90vw,480px)] w-[min(90vw,480px)] rounded-full bg-amber-500/7 blur-[90px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[28vh] min-h-[160px] max-h-[280px] w-full text-white/[0.035]" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,95 Q400,55 800,100 T1440,80 L1440,180 L0,180 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[960px]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/22 bg-amber-950/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/85">
          Das Problem
        </div>
        <h2 className="mb-5 text-[clamp(26px,3.8vw,40px)] font-bold leading-tight text-stone-50">
          Bewerben dauert. Und meistens blind.
        </h2>
        <p className="mb-12 max-w-[720px] text-lg leading-relaxed text-stone-400">
          Die meisten lesen eine Stellenanzeige, schreiben ein Anschreiben und hoffen. Ob sie wirklich passen, wissen sie erst im Gespräch. Oder nach der Absage.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-600/45 bg-[#1a1512]/90 p-6 shadow-landing-md backdrop-blur-sm">
            <p className="mb-2 text-2xl font-bold tabular-nums text-stone-50 sm:text-3xl">
              45 Min <span className="text-amber-400">→</span> 10 Sek
            </p>
            <p className="text-sm font-medium leading-relaxed text-stone-400">
              Stellenanalyse statt manuelles Lesen. Du weißt sofort, ob sich die Bewerbung lohnt.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-600/45 bg-[#1a1512]/90 p-6 shadow-landing-md backdrop-blur-sm">
            <p className="mb-2 text-2xl font-bold tabular-nums text-stone-50 sm:text-3xl">Bis zu 12 Keywords</p>
            <p className="text-sm font-medium leading-relaxed text-stone-400">
              Automatisch erkannt und mit deinem Profil abgeglichen. Fehlende Keywords siehst du direkt.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-600/45 bg-[#1a1512]/90 p-6 shadow-landing-md backdrop-blur-sm">
            <p className="mb-2 text-2xl font-bold tabular-nums text-stone-50 sm:text-3xl">5 Werkzeuge, ein Ort</p>
            <p className="text-sm font-medium leading-relaxed text-stone-400">
              Analyse, Interview, Anschreiben, Lebenslauf und Karriere-Chat. Kein Wechsel zwischen Apps.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features Section ──────────────────────────────────────────────────────────

const FEATURES: Array<{
  icon: IconHubName
  color: string
  iconBg: string
  title: string
  desc: string
  chip: string
  highlight: boolean
  badge: string
  cardClass: string
  chipClass: string
}> = [
  {
    icon: 'work',
    color: '#10B981',
    iconBg: 'bg-emerald-500/12 ring-1 ring-emerald-500/20',
    title: 'Stellenanalyse',
    desc:
      'Stellenanzeige einfügen, Ergebnis in Sekunden. Du siehst, welche Anforderungen du erfüllst, welche Keywords fehlen und ob sich die Bewerbung lohnt.',
    chip: '„Passt diese Stelle zu meinem Profil?"',
    highlight: true,
    badge: 'Karriere',
    cardClass: 'bg-gradient-to-br from-[#14201c]/95 via-[#121816]/98 to-[#0f1412]/95',
    chipClass: 'border border-stone-600/45 bg-emerald-950/35 text-emerald-100/90',
  },
  {
    icon: 'target',
    color: '#06B6D4',
    iconBg: 'bg-cyan-500/12 ring-1 ring-cyan-500/20',
    title: 'Interview Coach',
    desc:
      'Realistische Fragen, zugeschnitten auf die Stelle und dein Profil. Jede Antwort bekommt Feedback nach Struktur, Inhalt und Überzeugungskraft.',
    chip: '„Stell mir 5 Fragen für diese Stelle"',
    highlight: false,
    badge: 'Karriere',
    cardClass: 'bg-gradient-to-br from-[#121c22]/95 via-[#101820]/98 to-[#0e1618]/95',
    chipClass: 'border border-stone-600/45 bg-cyan-950/32 text-cyan-100/90',
  },
  {
    icon: 'chat',
    color: '#A855F7',
    iconBg: 'bg-violet-500/12 ring-1 ring-violet-500/20',
    title: 'Anschreiben',
    desc:
      'Ein Anschreiben, das auf die Stelle und deine Erfahrung eingeht. Keine Floskeln, kein „hiermit bewerbe ich mich“. Direkt verwendbar.',
    chip: '„Schreib ein Anschreiben für diese Stelle"',
    highlight: false,
    badge: 'Karriere',
    cardClass: 'bg-gradient-to-br from-[#18141f]/95 via-[#14121a]/98 to-[#100e16]/95',
    chipClass: 'border border-stone-600/45 bg-violet-950/30 text-violet-100/88',
  },
  {
    icon: 'star',
    color: '#3B82F6',
    iconBg: 'bg-sky-500/12 ring-1 ring-sky-500/20',
    title: 'Lebenslauf',
    desc:
      'Lebenslauf erstellen, versionieren und als PDF oder Word exportieren. Verschiedene Designs, ATS-optimiert, auf jede Bewerbung anpassbar.',
    chip: '„Erstelle einen Lebenslauf für diese Stelle"',
    highlight: false,
    badge: 'Karriere',
    cardClass: 'bg-gradient-to-br from-[#121a24]/95 via-[#101820]/98 to-[#0e141c]/95',
    chipClass: 'border border-stone-600/45 bg-sky-950/32 text-sky-100/90',
  },
  {
    icon: 'lightning',
    color: '#F59E0B',
    iconBg: 'bg-amber-500/14 ring-1 ring-amber-500/22',
    title: 'Karriere-Chat',
    desc:
      'Dein offener Kanal für alles rund um die Bewerbung. Formulierungen schärfen, Strategien besprechen, Gehalt einordnen.',
    chip: '„Wie formuliere ich eine Gehaltsvorstellung?"',
    highlight: false,
    badge: 'Flex',
    cardClass: 'bg-gradient-to-br from-[#221a12]/95 via-[#1a140e]/98 to-[#161008]/95',
    chipClass: 'border border-stone-600/45 bg-amber-950/35 text-amber-100/90',
  },
]

function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{
        minHeight: '100svh',
        background: 'linear-gradient(178deg, #16110d 0%, #1e140f 35%, #18100c 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 80% 20%, rgba(245,158,11,0.07), transparent 50%),
            radial-gradient(ellipse 60% 45% at 10% 70%, rgba(52,211,153,0.05), transparent 48%)
          `,
        }}
      />
      <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-70" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-[18%] h-[min(85vw,520px)] w-[min(85vw,520px)] rounded-full bg-amber-600/8 blur-[100px]" />
        <div className="absolute -left-24 bottom-[8%] h-[min(78vw,460px)] w-[min(78vw,460px)] rounded-full bg-amber-500/6 blur-[95px]" />
        <div className="absolute left-1/2 top-[45%] h-[min(55vw,420px)] w-[min(55vw,420px)] -translate-x-1/2 rounded-full bg-emerald-600/5 blur-[85px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[36vh] min-h-[200px] max-h-[380px] w-full text-white/[0.04]" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,120 Q420,75 840,125 T1440,100 L1440,220 L0,220 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1100px]">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-950/35 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-200/85">
            Werkzeuge
          </div>
          <h2 className="mb-3 text-[clamp(28px,4vw,44px)] font-bold text-stone-50">
            Fünf Werkzeuge. Eine Oberfläche.
          </h2>
          <p className="text-lg text-stone-400">
            Jedes Werkzeug ist auf einen Schritt im Bewerbungsprozess spezialisiert.
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
                'group relative cursor-default overflow-hidden rounded-2xl border border-stone-600/45 p-6 shadow-landing-md backdrop-blur-[2px] transition-all duration-200 hover:-translate-y-1.5 hover:border-stone-500/50',
                f.cardClass,
                f.highlight ? 'sm:shadow-landing-promo sm:border-amber-500/35' : '',
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
              <div className={`relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${f.iconBg}`}>
                <IconHubIcon name={f.icon} className="h-6 w-6" tone="onDark" />
              </div>
              <h3 className="relative z-10 mb-2 text-base font-bold text-stone-100">{f.title}</h3>
              <p className="relative z-10 mb-4 text-sm leading-relaxed text-stone-400">{f.desc}</p>
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

type DemoTool = 'job' | 'interview' | 'cover' | 'resume' | 'general'

interface DemoToolConfig {
  icon: IconHubName
  label: string
  placeholder: string
  chip: string
}

const DEMO_TOOL_CONFIG: Record<DemoTool, DemoToolConfig> = {
  job: {
    icon: 'work',
    label: 'Stellenanalyse',
    placeholder: 'Stellenanzeige hier einfügen oder Link eingeben...',
    chip: 'Analysiere: Junior .NET Entwickler bei CHECK24, München',
  },
  interview: {
    icon: 'target',
    label: 'Interview',
    placeholder: 'Für welche Stelle willst du üben?',
    chip: 'Stell mir 3 Fragen für ein Frontend-Interview',
  },
  cover: {
    icon: 'chat',
    label: 'Anschreiben',
    placeholder: 'Stelle und Unternehmen eingeben...',
    chip: 'Anschreiben für eine Marketing-Stelle bei Siemens',
  },
  resume: {
    icon: 'star',
    label: 'Lebenslauf',
    placeholder: 'Welche Rolle und Branche?',
    chip: 'Lebenslauf für Softwareentwickler, 2 Jahre Erfahrung',
  },
  general: {
    icon: 'lightning',
    label: 'Chat',
    placeholder: 'Was möchtest du wissen?',
    chip: "Wie antworte ich auf 'Was sind Ihre Schwächen?'",
  },
}

const TOOL_ORDER: DemoTool[] = ['job', 'interview', 'cover', 'resume', 'general']
const PER_TOOL_LIMIT = 2 // each tool gets 2 independent messages

function buildAskParams(tool: DemoTool, msg: string, sessionId: string) {
  const base = { message: msg, sessionId }
  switch (tool) {
    case 'job':
      return { ...base, toolType: 'jobanalyzer' as const }
    case 'interview':
      return { ...base, toolType: 'interviewprep' as const }
    case 'cover':
    case 'resume':
    case 'general':
      return { ...base, toolType: 'general' as const }
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
    return <p className="mt-1.5 font-semibold text-stone-100">{renderInline(line.replace(/^#{1,3}\s/, ''))}</p>
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
    <div className="space-y-0.5 text-sm text-stone-300">
      {text.split('\n').map((line, i) => (
        <RichLine key={i} line={line} dotColor={dotColor} numColor={numColor} />
      ))}
    </div>
  )
}

// ── Tool-specific response cards ──────────────────────────────────────────────

function JobResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-stone-600/45 bg-gradient-to-br from-emerald-950/32 to-[#120c08] shadow-landing">
      <div className="flex items-center gap-1.5 border-b border-stone-600/35 px-4 py-2">
        <IconHubIcon name="work" className="h-4 w-4 shrink-0" tone="onDark" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">Stellenanalyse</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-emerald-400" numColor="text-emerald-400" />
      </div>
    </div>
  )
}

function InterviewResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-stone-600/45 bg-gradient-to-br from-cyan-950/28 to-[#120c08] shadow-landing">
      <div className="flex items-center gap-1.5 border-b border-stone-600/35 px-4 py-2">
        <IconHubIcon name="target" className="h-4 w-4 shrink-0" tone="onDark" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Interview-Vorbereitung</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-cyan-400" numColor="text-cyan-400" />
      </div>
    </div>
  )
}

function GeneralResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-stone-600/45 bg-gradient-to-br from-amber-950/28 to-[#120c08] shadow-landing">
      <div className="flex items-center gap-1.5 border-b border-stone-600/35 px-4 py-2">
        <IconHubIcon name="chat" className="h-4 w-4 shrink-0" tone="onDark" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">Applikum</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-amber-400" numColor="text-amber-400" />
      </div>
    </div>
  )
}

function DemoAssistantBubble({ text, tool }: { text: string; tool: DemoTool }) {
  if (tool === 'job') return <JobResponseBubble text={text} />
  if (tool === 'interview') return <InterviewResponseBubble text={text} />
  return <GeneralResponseBubble text={text} />
}

function LiveDemoSection() {
  const [activeTool, setActiveTool] = useState<DemoTool>('job')
  const [msgByTool, setMsgByTool] = useState<Record<DemoTool, DemoMessage[]>>({
    job: [], interview: [], cover: [], resume: [], general: [],
  })
  // per-tool independent message count (each tool has PER_TOOL_LIMIT messages)
  const [countByTool, setCountByTool] = useState<Record<DemoTool, number>>({
    job: 0, interview: 0, cover: 0, resume: 0, general: 0,
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sessionIds = useRef<Record<DemoTool, string>>({
    job: `demo_${Math.random().toString(36).slice(2, 9)}`,
    interview: `demo_${Math.random().toString(36).slice(2, 9)}`,
    cover: `demo_${Math.random().toString(36).slice(2, 9)}`,
    resume: `demo_${Math.random().toString(36).slice(2, 9)}`,
    general: `demo_${Math.random().toString(36).slice(2, 9)}`,
  })
  const messagesScrollRef = useRef<HTMLDivElement>(null)

  /** Scroll only the demo transcript pane. scrollIntoView would pull the whole window down to #demo on every load. */
  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [msgByTool, loading, activeTool])

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
      style={{ background: 'linear-gradient(180deg, #120c08 0%, #18100c 40%, #14100d 100%)', minHeight: '100svh' }}
    >
      <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-75" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-[18%] h-[min(75vw,440px)] w-[min(75vw,440px)] rounded-full bg-amber-600/8 blur-[85px]" />
        <div className="absolute -right-24 bottom-[20%] h-[min(82vw,480px)] w-[min(82vw,480px)] rounded-full bg-violet-600/6 blur-[80px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[34vh] min-h-[200px] max-h-[360px] w-full text-white/[0.04]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,105 Q380,65 760,110 T1440,95 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[640px]">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Ausprobieren</p>
          <h2 className="mb-3 text-3xl font-bold text-stone-50">Probier es aus. Ohne Anmeldung.</h2>
          <p className="text-stone-400">
            Wähle ein Werkzeug und stell eine Frage. Zwei Nachrichten pro Werkzeug, ohne Account.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-stone-600/45 bg-[#17120f]/98 shadow-landing-lg backdrop-blur-sm">

          {/* ── Tool tabs with progress badges ── */}
          <div className="relative border-b border-stone-600/35 bg-[#100d0b]">
            <div className="flex">
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
                    'relative flex flex-1 flex-col items-center gap-0.5 py-3 pb-3.5 text-[10px] font-semibold transition-all duration-150',
                    isActive && !exhausted
                      ? 'bg-[#0e0b09] text-amber-300 after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-amber-500 after:to-amber-400'
                      : isActive && exhausted
                        ? 'bg-[#0e0b09] text-emerald-400 after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-emerald-500 after:to-emerald-400'
                        : exhausted
                          ? 'text-stone-400 hover:bg-white/[0.03] hover:text-stone-300'
                          : 'text-stone-300 hover:bg-white/[0.03] hover:text-stone-200',
                  ].join(' ')}
                  title={t.label}
                >
                  <span className="relative flex h-[17px] w-[17px] items-center justify-center">
                    <IconHubIcon name={t.icon} className="h-[17px] w-[17px]" tone="onDark" />
                    {/* done badge when exhausted */}
                    {exhausted && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 text-white">
                        <Check size={9} strokeWidth={3} className="shrink-0" aria-hidden />
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
          </div>

          {/* ── Messages ── */}
          <div
            ref={messagesScrollRef}
            className="max-h-[360px] min-h-[180px] space-y-4 overflow-y-auto bg-[#0c0907] p-3 sm:p-5"
          >
            {currentMsgs.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <IconHubIcon name={cfg.icon} className="h-14 w-14" tone="onDark" />
                <p className="text-sm text-stone-400">
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
                  <div className="max-w-[85%] break-words rounded-2xl rounded-br-sm border border-primary-hover/50 bg-primary px-4 py-2.5 text-sm text-white">
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  </div>
                ) : (
                  <DemoAssistantBubble text={m.text} tool={activeTool} />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex">
                <div className="rounded-2xl rounded-bl-sm border border-stone-600/40 bg-[#1a1512] px-4 py-3 shadow-landing">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* ── Chip (only when no messages yet for this tool) ── */}
          {!atToolLimit && currentMsgs.length === 0 && (
            <div className="px-3 pb-3 sm:px-5">
              <button
                type="button"
                onClick={() => void send(cfg.chip)}
                className="flex w-full items-center gap-2 rounded-xl border border-stone-600/45 bg-[#1a1512] px-3 py-2.5 text-left text-xs text-stone-300 shadow-landing transition-colors hover:border-amber-500/35 hover:bg-[#1f1814] hover:text-amber-200"
              >
                <IconHubIcon name={cfg.icon} className="h-4 w-4 shrink-0" tone="onDark" />
                <span className="truncate">{cfg.chip}</span>
                <span className="ml-auto flex-shrink-0 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold text-stone-950">
                  Ausprobieren
                </span>
              </button>
            </div>
          )}

          {/* ── Bottom area: tool exhausted / all exhausted / input ── */}
          {allExhausted ? (
            <div className="border-t border-stone-600/35 bg-[#0f0c0a] px-4 py-6 text-center sm:px-5">
              <p className="mb-1 flex items-center justify-center gap-2 text-sm font-semibold text-stone-100">
                <IconHubIcon name="winner" className="h-5 w-5 shrink-0" tone="onDark" />
                Du hast alle 5 Werkzeuge ausprobiert
              </p>
              <p className="mb-5 text-sm leading-relaxed text-stone-400">
                Kostenlos registrieren: täglich 20 Nachrichten, alle Werkzeuge, Verlauf im Browser.
              </p>
              <SignUpButton mode="modal" fallbackRedirectUrl="/overview">
                <AppCtaButton size="lg" className="mb-3 w-full sm:w-auto">
                  Kostenlos registrieren: 20 Nachrichten pro Tag
                </AppCtaButton>
              </SignUpButton>
              <p className="text-xs text-stone-600">
                Bereits Konto?{' '}
                <SignInButton mode="modal" fallbackRedirectUrl="/overview">
                  <button type="button" className="font-medium text-amber-400 hover:underline">
                    Anmelden
                  </button>
                </SignInButton>
              </p>
            </div>
          ) : atToolLimit ? (
            /* Current tool exhausted: nudge to other tools */
            <div className="border-t border-stone-600/35 bg-[#0f0c0a] px-3 py-4 sm:px-5">
              <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-stone-500">
                <Check size={14} className="shrink-0 text-emerald-500" aria-hidden />
                <span>
                  <strong>{cfg.label}</strong> ausprobiert! Noch {unusedTools.length} Werkzeug{unusedTools.length !== 1 ? 'e' : ''} übrig:
                </span>
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {unusedTools.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToolSwitch(t)}
                    className="flex items-center gap-1.5 rounded-full border border-stone-600/45 bg-[#1a1512] px-3 py-1.5 text-xs text-stone-300 transition-colors hover:border-amber-500/35 hover:bg-[#1f1814] hover:text-amber-200"
                  >
                    <IconHubIcon name={DEMO_TOOL_CONFIG[t].icon} className="h-3.5 w-3.5 shrink-0" tone="onDark" />
                    {DEMO_TOOL_CONFIG[t].label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-center">
                <SignUpButton mode="modal" fallbackRedirectUrl="/overview">
                  <button className="text-xs font-medium text-amber-400 hover:underline">
                    Oder direkt registrieren →
                  </button>
                </SignUpButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 border-t border-stone-600/35 bg-[#0f0c0a] px-3 py-2.5 sm:gap-2 sm:px-4">
              {currentMsgs.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-stone-600/45 text-stone-400 transition-colors hover:border-amber-500/35 hover:text-stone-300"
                  aria-label="Gespräch zurücksetzen"
                  title="Gespräch zurücksetzen"
                >
                  <RotateCcw size={14} aria-hidden />
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
                className="min-w-0 flex-1 rounded-xl border border-stone-600/45 bg-[#1a1512] px-3 py-2.5 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/25 disabled:opacity-50 sm:px-4"
                style={{ fontSize: 'max(16px, 0.875rem)' }}
              />
              <button
                type="button"
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                aria-label={loading ? 'Nachricht wird gesendet' : 'Nachricht senden'}
                className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
              </button>
            </div>
          )}

          {/* ── Per-tool message counter ── */}
          {!atToolLimit && !allExhausted && (
            <div className="flex items-center justify-between border-t border-stone-600/30 bg-[#0c0907] px-3 py-2 sm:px-5">
              <span className="text-xs text-stone-400">
                {PER_TOOL_LIMIT - toolCount} von {PER_TOOL_LIMIT} Nachrichten für {cfg.label}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: PER_TOOL_LIMIT }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-4 rounded-full transition-colors ${i < toolCount ? 'bg-primary' : 'bg-white/10'}`}
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

const STEPS: Array<{
  num: string
  icon: IconHubName
  title: string
  text: string
  color: string
  glow: string
}> = [
  {
    num: '1',
    icon: 'key',
    title: 'Konto erstellen',
    text: 'Google-Login, fertig. Kein Fragebogen, keine Einrichtung.',
    color: 'from-amber-400 to-amber-300',
    glow: 'bg-amber-400/50',
  },
  {
    num: '2',
    icon: 'target',
    title: 'Stellenanzeige einfügen',
    text: 'Kopiere den Text oder den Link. Die Analyse startet automatisch.',
    color: 'from-amber-500 to-amber-400',
    glow: 'bg-amber-500/50',
  },
  {
    num: '3',
    icon: 'lightning',
    title: 'Ergebnis lesen, entscheiden, handeln',
    text: 'Du siehst sofort: passt die Stelle, was fehlt, was du tun kannst.',
    color: 'from-amber-600 to-amber-500',
    glow: 'bg-amber-600/50',
  },
]

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(165deg, #0f0a08 0%, #15100c 38%, #0a0605 100%)', minHeight: '100svh' }}
    >
      <div className="landing-dot-grid-fine pointer-events-none absolute inset-0 opacity-70" />

      {/* Große Flächen, Wellenbänder, skalierte Akzente */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-[18%] h-[min(95vw,560px)] w-[min(95vw,560px)] rounded-full bg-amber-600/8 blur-[110px]" />
        <div className="absolute -right-24 bottom-[20%] h-[min(88vw,500px)] w-[min(88vw,500px)] rounded-full bg-amber-500/6 blur-[95px]" />
        <div className="absolute left-1/2 top-[55%] h-[min(70vw,520px)] w-[min(70vw,520px)] -translate-x-1/2 rounded-full bg-teal-600/5 blur-[100px]" />
        <svg className="absolute top-0 left-0 right-0 h-[32vh] min-h-[180px] max-h-[320px] w-full text-white/[0.04]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,75 Q720,130 0,95 L0,0 Z" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-0 left-0 right-0 h-[30vh] min-h-[180px] max-h-[300px] w-full text-white/[0.035]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,110 Q360,70 720,110 T1440,95 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[900px]">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-950/35 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-200/85">
            So funktioniert es
          </div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold text-white">
            Drei Schritte. Kein Onboarding.
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="absolute left-[calc(50%/3+52px)] right-[calc(50%/3+52px)] top-7 hidden h-px border-t border-dashed border-amber-950/35 md:block" />

          {STEPS.map((s) => (
            <div key={s.num} className="relative z-10 text-center">
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-xl ${s.glow}`} />
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-lg font-bold text-white shadow-lg`}>
                  {s.num}
                </div>
              </div>
              <div className="mb-3 flex justify-center">
                <IconHubIcon name={s.icon} tone="onDark" className="h-12 w-12" />
              </div>
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
    text: 'Du bewirbst dich aktiv und willst bei jeder Stelle wissen: Passt das? Lohnt sich die Mühe? Wie bereite ich mich vor?',
  },
  {
    title: 'Karrierewechsler',
    text: 'Neues Feld, neue Anforderungen. Du siehst genau, welche Kompetenzen du mitbringst und wo du nachziehen musst.',
  },
  {
    title: 'Berufseinsteiger',
    text: 'Erster Job, erste Bewerbung. Du bekommst Struktur, Formulierungen und die Sicherheit, die dir noch fehlt.',
  },
] as const

function FuerWenSection() {
  return (
    <section
      id="audience"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #15100c 0%, #1a130e 45%, #16100d 100%)', minHeight: 'min(100svh, 900px)' }}
    >
      <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-[20%] h-[min(85vw,480px)] w-[min(85vw,480px)] rounded-full bg-amber-600/7 blur-[90px]" />
        <div className="absolute -left-24 bottom-[15%] h-[min(80vw,440px)] w-[min(80vw,440px)] rounded-full bg-amber-500/6 blur-[85px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[30vh] min-h-[180px] max-h-[300px] w-full text-white/[0.035]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,100 Q400,58 800,105 T1440,88 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1000px]">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-950/35 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-200/85">
            Für wen
          </div>
          <h2 className="text-[clamp(26px,3.8vw,40px)] font-bold text-stone-50">
            Egal ob erste Bewerbung oder Jobwechsel.
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {AUDIENCE.map(a => (
            <div
              key={a.title}
              className="rounded-2xl border border-stone-600/45 bg-[#1a1512]/90 p-6 shadow-landing-md backdrop-blur-sm"
            >
              <h3 className="mb-2 text-base font-bold text-stone-100">{a.title}</h3>
              <p className="text-sm leading-relaxed text-stone-400">{a.text}</p>
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
    q: 'Was unterscheidet das hier von ChatGPT?',
    a: 'ChatGPT ist ein allgemeiner Chatbot. Hier bekommt jedes Werkzeug einen eigenen Prompt, der auf Bewerbungen spezialisiert ist. Die Stellenanalyse prüft Keywords gegen dein Profil. Der Interview-Coach stellt Fragen nach STAR-Methode. Das Anschreiben wird auf die konkrete Stelle zugeschnitten. ChatGPT kann das nicht, weil es deinen Lebenslauf und die Stelle nicht kennt.',
  },
  {
    q: 'Brauche ich technische Kenntnisse?',
    a: 'Nein. Du kopierst eine Stellenanzeige rein und bekommst ein Ergebnis. Kein Setup, keine Konfiguration.',
  },
  {
    q: 'Welche KI steckt dahinter?',
    a: 'Wir nutzen verschiedene Sprachmodelle, je nachdem welches Werkzeug du verwendest. Die Modelle werden so ausgewählt, dass du die beste Qualität bei akzeptabler Geschwindigkeit bekommst. Die Details ändern sich regelmäßig, weil wir laufend optimieren.',
  },
  {
    q: 'Sind meine Daten sicher?',
    a: 'Dein Lebenslauf und deine Stellenanalysen werden verschlüsselt gespeichert. Wir geben keine Daten an Dritte weiter. Du kannst dein Konto und alle Daten jederzeit löschen.',
  },
  {
    q: 'Wie funktioniert die Zahlung?',
    a: 'Einmalzahlung per Kreditkarte oder PayPal. Kein Abo, keine automatische Verlängerung. Nach Ablauf des Zeitraums kannst du einen neuen Zugang kaufen. Deine Daten bleiben erhalten.',
  },
  {
    q: 'In welchen Sprachen funktioniert es?',
    a: 'Deutsch und Englisch. Die Werkzeuge erkennen automatisch, in welcher Sprache du schreibst, und antworten in derselben Sprache.',
  },
  {
    q: 'Was passiert nach Ablauf meines Zugangs?',
    a: 'Du kannst deine gespeicherten Lebensläufe und Bewerbungen weiterhin einsehen und als PDF exportieren. Die KI-Werkzeuge sind bis zum nächsten Kauf pausiert.',
  },
] as const

function FaqSection() {
  return (
    <section
      id="faq"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #120a08 0%, #18100e 55%, #140d0a 100%)' }}
    >
      <div className="landing-dot-grid-fine pointer-events-none absolute inset-0 opacity-65" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[30%] h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-x-1/2 rounded-full bg-amber-600/6 blur-[85px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[26vh] min-h-[150px] max-h-[260px] w-full text-white/[0.04]" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,88 Q380,52 760,92 T1440,78 L1440,180 L0,180 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[720px]">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-950/35 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-200/85">
            Häufige Fragen
          </div>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map(item => (
            <details
              key={item.q}
              className="group rounded-2xl border border-stone-600/45 bg-[#1a1512]/90 px-5 py-3 shadow-landing-md open:border-amber-500/40 open:shadow-landing-promo"
            >
              <summary className="cursor-pointer list-none text-left text-sm font-semibold text-stone-100 after:float-right after:text-stone-500 after:content-['+'] group-open:after:content-['−']">
                {item.q}
              </summary>
              <p className="mt-3 border-t border-stone-600/35 pt-3 text-sm leading-relaxed text-stone-400">{item.a}</p>
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
  icon: IconHubName
  borderClass: string
  headerBg: string
  badge?: string
  features: PlanFeature[]
  footnote?: string
  cta: string
  ctaClass: string
  useSignUp: boolean
  href?: string
  scale: boolean
}> = [
  {
    id: 'starter',
    name: 'Starter',
    price: '14,90€',
    period: '30 Tage Zugang. Einmalzahlung.',
    icon: 'star',
    borderClass: 'border-stone-600/45 bg-[#181310]/98 shadow-landing-md',
    headerBg: 'bg-[#1c1612]/95',
    features: [
      { text: '3 Lebensläufe mit PDF und Word-Export', included: true },
      { text: 'Stellenanalyse mit Keyword-Abgleich', included: true },
      { text: 'Karriere-Chat', included: true },
      { text: '10 Bewerbungen in der Pipeline', included: true },
      { text: '30 KI-Gespräche pro Tag', included: true },
    ],
    cta: 'Starter wählen',
    ctaClass:
      'border border-stone-600/45 bg-white/[0.05] text-stone-200 shadow-landing hover:border-amber-500/40 hover:bg-amber-950/25 hover:text-amber-100',
    useSignUp: false,
    href: '/pricing',
    scale: false,
  },
  {
    id: 'komplett',
    name: 'Komplett',
    price: '39,90€',
    period: '90 Tage Zugang. Einmalzahlung.',
    icon: 'trophy-award',
    borderClass: 'border-amber-500/45 bg-[#1a140f]/98 shadow-landing-promo',
    headerBg: 'bg-gradient-to-br from-amber-950/50 to-[#1f1810]/95',
    badge: 'Empfohlen',
    features: [
      { text: 'Unbegrenzte Lebensläufe', included: true },
      { text: 'Stellenanalyse mit Keyword-Abgleich', included: true },
      { text: 'Karriere-Chat', included: true },
      { text: 'Unbegrenzte Bewerbungen', included: true },
      { text: '50 KI-Gespräche pro Tag', included: true },
      { text: 'Interview-Coach mit STAR-Feedback', included: true },
      { text: 'Anschreiben-Generator', included: true },
      { text: 'Gehalts-Coach und LinkedIn-Tipps', included: true },
      { text: 'KI-Gedächtnis (lernt aus deinen Sessions)', included: true },
    ],
    footnote: '13,30€ pro Monat. 33% günstiger als Starter.',
    cta: 'Komplett wählen',
    ctaClass: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-200 hover:shadow-lg',
    useSignUp: false,
    href: '/pricing',
    scale: true,
  },
]

function PricingPreviewSection() {
  return (
    <section
      id="pricing"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(165deg, #130e0a 0%, #1a1210 42%, #150f0c 100%)', minHeight: '100svh' }}
    >
      <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-65" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-16 h-[min(95vw,560px)] w-[min(95vw,560px)] rounded-full bg-amber-600/9 blur-[95px]" />
        <div className="absolute -left-28 bottom-0 h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full bg-orange-600/7 blur-[85px]" />
        <div className="absolute left-1/2 top-[40%] h-[min(55vw,400px)] w-[min(55vw,400px)] -translate-x-1/2 rounded-full bg-rose-600/5 blur-[75px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[34vh] min-h-[200px] max-h-[360px] w-full text-white/[0.04]" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,115 Q440,72 880,118 T1440,98 L1440,220 L0,220 Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-0 left-0 right-0 h-[20vh] min-h-[110px] max-h-[180px] w-full text-white/[0.03]" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,42 Q720,88 0,58 L0,0 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[920px]">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-950/35 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-200/85">
            Preise
          </div>
          <h2 className="mb-3 text-[clamp(28px,4vw,44px)] font-bold text-stone-50">
            Kein Abo. Kein Kleingedrucktes.
          </h2>
          <p className="text-lg text-stone-400">
            Einmalzahlung, voller Zugang, fertig. Wähle den Zeitraum der zu deiner Jobsuche passt.
          </p>
        </div>

        {/* Mobile: horizontal snap-scroll  |  md+: 2-column grid */}
        <div className={[
          'flex items-stretch gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide',
          '-mx-6 px-6',
          'md:mx-0 md:grid md:grid-cols-2 md:items-stretch md:gap-6 md:overflow-x-visible md:pb-0 md:snap-none',
        ].join(' ')}>
          {PREVIEW_PLANS.map(plan => (
            <div
              key={plan.id}
              className={[
                'w-[78vw] max-w-[300px] flex-shrink-0 snap-center',
                'md:w-auto md:max-w-none',
                'overflow-hidden rounded-3xl border',
                plan.borderClass,
                plan.scale ? 'md:scale-[1.04]' : '',
              ].join(' ')}
            >
              <div className={`px-5 pb-4 pt-5 ${plan.headerBg}`}>
                {'badge' in plan && plan.badge && (
                  <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <IconHubIcon name={plan.icon} className="h-6 w-6 shrink-0" tone="onDark" />
                  <h3 className="text-lg font-bold text-stone-100">{plan.name}</h3>
                </div>
                <div className="text-3xl font-bold text-stone-50">{plan.price}</div>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{plan.period}</p>
              </div>
              <div className="relative space-y-2.5 px-5 py-4 before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-amber-800/35 before:to-transparent">
                {plan.features.map(f => (
                  <div key={f.text} className="flex items-start gap-2">
                    {f.included
                      ? <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                      : <X size={14} className="mt-0.5 flex-shrink-0 text-rose-400" aria-hidden />}
                    <span className={f.included ? 'text-xs text-stone-300' : 'text-xs text-stone-600'}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
              {plan.footnote && (
                <p className="px-5 pb-3 text-xs leading-relaxed text-stone-400">{plan.footnote}</p>
              )}
              <div className="px-5 pb-5">
                {plan.useSignUp ? (
                  <SignUpButton mode="modal" fallbackRedirectUrl="/overview">
                    <button className={`w-full rounded-xl px-4 py-3 min-h-[48px] text-base font-semibold transition-all sm:text-sm ${plan.ctaClass}`}>{plan.cta}</button>
                  </SignUpButton>
                ) : (
                  <a href={'href' in plan ? plan.href : '/pricing'}>
                    <button className={`w-full rounded-xl px-4 py-3 min-h-[48px] text-base font-semibold transition-all sm:text-sm ${plan.ctaClass}`}>{plan.cta}</button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-stone-500">
          Beide Pläne starten sofort nach der Zahlung. Keine automatische Verlängerung.
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
      style={{ background: 'linear-gradient(160deg, #1c1200 0%, #2a1b12 48%, #3d2a10 100%)', minHeight: '100svh' }}
    >
      <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-80" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/2 h-[min(110vw,720px)] w-[min(110vw,720px)] -translate-y-1/2 rounded-full bg-white/6 blur-[100px]" />
        <div className="absolute -right-28 top-1/2 h-[min(100vw,640px)] w-[min(100vw,640px)] -translate-y-1/2 rounded-full bg-amber-300/12 blur-[95px]" />
        <svg className="absolute bottom-0 left-0 right-0 h-[38vh] min-h-[220px] max-h-[400px] w-full text-white/[0.05]" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,130 Q420,85 840,125 T1440,105 L1440,240 L0,240 Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-0 left-0 right-0 h-[28vh] min-h-[160px] max-h-[280px] w-full text-amber-400/[0.06]" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,55 Q720,115 0,75 L0,0 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[640px] px-4">
        <div className="relative py-4 sm:py-8">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex justify-center">
              <IconHubIcon name="lightning" tone="onDark" className="h-16 w-16 sm:h-20 sm:w-20" />
            </div>
            <h2 className="mb-4 text-[clamp(28px,4vw,44px)] font-bold text-stone-50">
              Deine nächste Bewerbung. Vorbereitet.
            </h2>
            <p className="mb-10 max-w-[480px] text-lg text-stone-400">
              Starte jetzt und finde heraus, ob die Stelle zu dir passt.
            </p>
            <SignUpButton mode="modal" fallbackRedirectUrl="/overview">
              <button className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-10 py-4 text-base font-bold text-amber-950 shadow-2xl shadow-black/50 transition-all hover:scale-[1.02] hover:from-amber-300 hover:to-amber-400">
                Kostenlos starten
              </button>
            </SignUpButton>
            <p className="mt-4 text-sm text-stone-600">Keine Kreditkarte erforderlich</p>
          </div>
        </div>
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
              <img
                src="/logo-nav.webp"
                alt=""
                width={96}
                height={96}
                decoding="async"
                loading="lazy"
                className="h-7 w-7 rounded-lg"
              />
              <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-lg font-bold text-transparent">Applikum</span>
            </div>
            <p className="text-sm text-stone-500">KI-Werkzeuge für deine Karriere</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-500 md:justify-end">
            <a href="#" className="transition-colors hover:text-white">Datenschutz</a>
            <a href="#" className="transition-colors hover:text-white">Nutzungsbedingungen</a>
            <a href="#" className="transition-colors hover:text-white">Impressum</a>
            <a href="#" className="transition-colors hover:text-white">Kontakt</a>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-stone-700">© 2026 Applikum. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()

  /** Let the browser restore scroll on reload (F5). Global `scroll-behavior: smooth` breaks that in many engines. */
  useLayoutEffect(() => {
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    return () => {
      html.style.scrollBehavior = previous
    }
  }, [])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/overview', { replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  return (
    <div className="landing-page-root min-h-screen">
      <LandingNav />
      <main id="main-content">
        <HeroSection />
        <SectionDivider from="#16110d" to="#14100c" dark variant="wave" />
        <ProblemSolutionSection />
        <SectionDivider from="#17110e" to="#16110d" dark variant="microdots" />
        <FeaturesSection />
        <SectionDivider from="#18100c" to="#120c08" dark variant="hatch" />
        <LiveDemoSection />
        <SectionDivider from="#14100d" to="#0f0a08" dark variant="blend" />
        <HowItWorksSection />
        <SectionDivider from="#0a0605" to="#15100c" dark variant="sunrise" />
        <FuerWenSection />
        <SectionDivider from="#16110d" to="#130e0a" dark variant="mesh" />
        <PricingPreviewSection />
        <SectionDivider from="#150f0c" to="#120a08" dark variant="grain" />
        <FaqSection />
        <SectionDivider from="#140d0a" to="#1c1200" dark variant="thread" />
        <FinalCtaSection />
        <SectionDivider from="#3d2a10" to="#0d0800" dark variant="night" />
        <FooterSection />
      </main>
    </div>
  )
}

