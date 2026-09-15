import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import { Menu, X } from 'lucide-react'
import '../styles/landing.css'

const AFTER_AUTH = '/analyze'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const navLinkClass =
  'rounded-full px-3 py-2 text-sm font-medium text-stone-300 transition hover:bg-white/8 hover:text-white'

function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#120c08]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => scrollTo('hero')} className="flex items-center gap-2">
          <img src="/logo-nav.webp" alt="" className="h-8 w-8 rounded-lg" width={32} height={32} />
          <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-50/90 bg-clip-text text-[15px] font-bold tracking-tight text-transparent sm:text-[17px]">
            Applikum
          </span>
        </button>

        <div className="hidden items-center gap-0.5 md:flex">
          <button type="button" onClick={() => scrollTo('how')} className={navLinkClass}>Ablauf</button>
          <button type="button" onClick={() => scrollTo('demo')} className={navLinkClass}>Beispiel</button>
        </div>

        <div className="flex items-center gap-2">
          <SignInButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
            <button
              type="button"
              className="hidden min-h-[40px] rounded-full border border-amber-800/45 bg-white/[0.06] px-4 py-2 text-sm font-medium text-stone-100 sm:inline-flex"
            >
              Anmelden
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
            <button
              type="button"
              className="inline-flex min-h-[40px] items-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-bold text-amber-950 shadow-lg shadow-black/30"
            >
              Kostenlos starten
            </button>
          </SignUpButton>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-800/45 text-white md:hidden"
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="border-t border-white/8 bg-[#120c08] px-4 py-3 md:hidden">
          <button type="button" className={`${navLinkClass} block w-full text-left`} onClick={() => { scrollTo('how'); setMobileOpen(false) }}>Ablauf</button>
          <button type="button" className={`${navLinkClass} block w-full text-left`} onClick={() => { scrollTo('demo'); setMobileOpen(false) }}>Beispiel</button>
        </div>
      )}
    </header>
  )
}

function StaticDemo() {
  return (
    <div className="rounded-3xl border border-stone-600/40 bg-[#14110e] p-5 shadow-landing-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">Beispielbericht</p>
      <p className="mt-3 font-serif text-4xl font-bold text-stone-50">3,8</p>
      <p className="text-sm text-stone-400">Match-Score von 5,0</p>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-black/25 px-3 py-2 text-stone-300">CV-Match 4,2</div>
        <div className="rounded-xl bg-black/25 px-3 py-2 text-stone-300">Rolle 3,9</div>
        <div className="rounded-xl bg-black/25 px-3 py-2 text-stone-300">Kultur 3,5</div>
        <div className="rounded-xl bg-black/25 px-3 py-2 text-stone-300">Red Flags 2,0</div>
      </div>
      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">Skill-Lücken</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Kubernetes', 'Terraform'].map(s => (
            <span key={s} className="rounded-full border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 text-xs text-rose-100">{s}</span>
          ))}
          {['C#', 'SQL'].map(s => (
            <span key={s} className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-100">{s}</span>
          ))}
        </div>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-stone-300">
        <li>Team-API in C# betreut → REST-API für Bestellprozesse in C# entwickelt und betrieben.</li>
        <li>Datenbankkenntnisse → SQL-Abfragen für Reporting und Datenbereinigung geschrieben.</li>
        <li>Cloud-Erfahrung → Deployments auf Azure begleitet, ohne Kubernetes zu behaupten.</li>
      </ul>
    </div>
  )
}

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()

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
      navigate(AFTER_AUTH, { replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <LandingNav />
      <main id="main-content">
        <section
          id="hero"
          className="relative overflow-hidden pt-28"
          style={{ background: 'linear-gradient(165deg, #120c08 0%, #1a100a 42%, #16110d 100%)', minHeight: '100svh' }}
        >
          <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative z-10 mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-10 sm:grid-cols-2">
            <div>
              <p className="mb-6 inline-flex rounded-full border border-amber-500/22 bg-amber-950/30 px-4 py-1.5 text-xs font-semibold text-amber-100/90">
                Stellenanalyse für Bewerbungen in Deutschland
              </p>
              <h1 className="font-serif mb-6 text-[clamp(32px,4.8vw,56px)] font-bold leading-[1.15] text-stone-100">
                Wissen, ob die Stelle passt.
              </h1>
              <p className="mb-8 max-w-[520px] text-lg leading-relaxed text-stone-400">
                Profil, Story und Lebenslauf anlegen. Stellenanzeige einfügen. Du bekommst Match-Score, Skill-Lücken und 3–5 konkrete Formulierungen.
              </p>
              <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 text-base font-bold text-amber-950 shadow-lg sm:w-auto"
                >
                  Kostenlos starten
                </button>
              </SignUpButton>
              <p className="mt-4 text-sm text-stone-500">3 Analysen pro Tag kostenlos. Keine Kreditkarte.</p>
            </div>
            <div id="demo" className="scroll-mt-28">
              <StaticDemo />
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 bg-[#14100c] px-5 py-20">
          <div className="mx-auto grid max-w-[960px] gap-8 sm:grid-cols-3">
            {[
              ['1. Profil', 'Berufsfeld, kurze Story, Lebenslauf.'],
              ['2. Stelle', 'Anzeigentext einfügen — mindestens 100 Zeichen.'],
              ['3. Bericht', 'Score 1–5, Lücken-Tabelle, Umschreibungen.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-stone-600/35 bg-white/[0.03] p-5">
                <h2 className="text-lg font-semibold text-stone-50">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="bg-[#0D0800] px-6 py-10 text-center text-xs text-stone-600">
        © 2026 Applikum. Stellenanalyse — kein Chat, kein CV-Studio.
      </footer>
    </div>
  )
}
