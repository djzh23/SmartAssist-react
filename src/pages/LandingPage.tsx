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
            PrivatePrep
          </span>
        </button>

        <div className="hidden items-center gap-0.5 md:flex">
          <button type="button" onClick={() => scrollTo('features')} className={navLinkClass}>Funktionen</button>
          <button type="button" onClick={() => scrollTo('how')} className={navLinkClass}>Ablauf</button>
          <button type="button" onClick={() => scrollTo('demo')} className={navLinkClass}>Analysebericht</button>
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
          <button type="button" className={`${navLinkClass} block w-full text-left`} onClick={() => { scrollTo('features'); setMobileOpen(false) }}>Funktionen</button>
          <button type="button" className={`${navLinkClass} block w-full text-left`} onClick={() => { scrollTo('how'); setMobileOpen(false) }}>Ablauf</button>
          <button type="button" className={`${navLinkClass} block w-full text-left`} onClick={() => { scrollTo('demo'); setMobileOpen(false) }}>Analysebericht</button>
        </div>
      )}
    </header>
  )
}

function StaticDemo() {
  return (
    <div className="rounded-3xl border border-stone-600/40 bg-[#14110e] p-5 shadow-landing-lg">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">Beispielbericht</p>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
          Gute Passung
        </span>
      </div>
      <p className="font-serif text-4xl font-bold text-stone-50">3,8</p>
      <p className="text-sm text-stone-400">Match-Score von 5,0</p>
      <p className="mt-1 text-[11px] text-stone-600">IT-Fachkraft auf Senior-DevOps-Stelle</p>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'CV-Match', value: '4,2', color: 'text-emerald-300' },
          { label: 'Rollenpassung', value: '3,9', color: 'text-amber-300' },
          { label: 'Kulturscreening', value: '3,5', color: 'text-amber-300' },
          { label: 'Red Flags', value: '2,0', color: 'text-rose-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-black/25 px-3 py-2">
            <p className={`text-sm font-semibold ${color}`}>{value}</p>
            <p className="mt-0.5 text-[10px] text-stone-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">Skill-Analyse</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="mr-0.5 self-center text-[10px] font-medium text-stone-500">Nicht vorhanden:</span>
          {['Kubernetes', 'Terraform'].map(s => (
            <span key={s} className="rounded-full border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 text-xs text-rose-100">{s}</span>
          ))}
          <span className="ml-1 mr-0.5 self-center text-[10px] font-medium text-stone-500">Nachgewiesen:</span>
          {['C#', 'SQL', 'Azure'].map(s => (
            <span key={s} className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-100">{s}</span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">CV-Formulierungsvorschläge</p>
        <ul className="mt-2 space-y-2 text-sm text-stone-300">
          <li className="rounded-lg bg-black/20 px-3 py-2">
            <span className="text-[10px] text-stone-500">Vorhandener Eintrag</span>
            <p className="mt-0.5 text-xs text-stone-500">Team-API in C# betreut</p>
            <span className="mt-1 block text-[10px] text-amber-400/80">Formulierungsvorschlag</span>
            <p className="text-xs text-stone-300">REST-API für Bestellprozesse in C# entwickelt und betrieben.</p>
          </li>
          <li className="rounded-lg bg-black/20 px-3 py-2">
            <span className="text-[10px] text-stone-500">Vorhandener Eintrag</span>
            <p className="mt-0.5 text-xs text-stone-500">Cloud-Erfahrung</p>
            <span className="mt-1 block text-[10px] text-amber-400/80">Formulierungsvorschlag</span>
            <p className="text-xs text-stone-300">Azure-Deployments eigenständig begleitet und dokumentiert.</p>
          </li>
        </ul>
      </div>
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

        {/* Hero */}
        <section
          id="hero"
          className="relative overflow-hidden pt-28"
          style={{ background: 'linear-gradient(165deg, #120c08 0%, #1a100a 42%, #16110d 100%)', minHeight: '100svh' }}
        >
          <div className="landing-dot-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative z-10 mx-auto flex max-w-[780px] flex-col items-center px-5 pb-20 pt-12 text-center">
            <p className="mb-6 inline-flex rounded-full border border-amber-500/22 bg-amber-950/30 px-4 py-1.5 text-xs font-semibold text-amber-100/90">
              KI-gestützte Stellenanalyse für den deutschen Arbeitsmarkt
            </p>
            <h1 className="font-serif mb-6 text-[clamp(34px,5.2vw,60px)] font-bold leading-[1.12] text-stone-100">
              Bewerbungen fundiert<br className="hidden sm:block" /> vorbereiten.
            </h1>
            <p className="mb-8 max-w-[560px] text-lg leading-relaxed text-stone-400">
              PrivatePrep analysiert Stellenanzeigen anhand des hinterlegten Karriereprofils und Lebenslaufs.
              Das Ergebnis ist ein strukturierter Bericht: Match-Score, Skill-Lückenanalyse und konkrete
              CV-Formulierungsvorschläge, die zur ausgeschriebenen Stelle passen.
            </p>
            <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
              <button
                type="button"
                className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 text-base font-bold text-amber-950 shadow-lg shadow-black/30"
              >
                Kostenlos starten
              </button>
            </SignUpButton>
            <p className="mt-4 text-sm text-stone-500">3 Analysen pro Tag im kostenlosen Tarif. Keine Zahlungsdaten erforderlich.</p>

            {/* Feature highlights */}
            <div className="mt-14 grid w-full max-w-[640px] grid-cols-2 gap-3 text-left sm:grid-cols-4">
              {[
                ['Match-Score', 'Gesamtbewertung 1,0 bis 5,0'],
                ['Skill-Analyse', 'Fehlende und vorhandene Qualifikationen'],
                ['CV-Optimierung', '3 bis 5 stellenspezifische Formulierungen'],
                ['Kulturscreening', 'Kulturelle Passungshinweise'],
              ].map(([label, desc]) => (
                <div key={label} className="rounded-2xl border border-stone-600/35 bg-white/[0.03] px-3 py-3">
                  <p className="text-xs font-semibold text-amber-300">{label}</p>
                  <p className="mt-1 text-[11px] leading-snug text-stone-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 bg-[#100d0a] px-5 py-20">
          <div className="mx-auto max-w-[960px]">
            <h2 className="mb-3 text-center text-2xl font-bold text-stone-100">Was PrivatePrep leistet</h2>
            <p className="mx-auto mb-12 max-w-[520px] text-center text-sm text-stone-500">
              Jede Analyse basiert auf dem persönlichen Karriereprofil und liefert vier strukturierte Bewertungsdimensionen.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Match-Score',
                  desc: 'Eine gewichtete Gesamtbewertung auf einer Skala von 1,0 bis 5,0. Vier Dimensionen fließen ein: CV-Abdeckung, Rollenpassung, Kulturscreening und erkannte Risikofaktoren.',
                },
                {
                  title: 'Skill-Lückenanalyse',
                  desc: 'Geforderte Qualifikationen werden mit dem Lebenslauf abgeglichen. Fehlende und vorhandene Skills werden getrennt ausgewiesen, damit Lücken gezielt adressiert werden können.',
                },
                {
                  title: 'CV-Formulierungen',
                  desc: 'Für bestehende Lebenslaufeinträge werden Umformulierungen vorgeschlagen, die relevante Keywords aus der Stellenanzeige aufgreifen, ohne nicht vorhandene Fähigkeiten zu behaupten.',
                },
                {
                  title: 'Kulturscreening',
                  desc: 'Sprache und Tonalität der Ausschreibung werden auf kulturelle Merkmale analysiert. Hinweise auf Hierarchieorientierung, Teamdynamik und Arbeitsweise fließen in die Bewertung ein.',
                },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-2xl border border-stone-600/35 bg-white/[0.03] p-5">
                  <h3 className="mb-2 text-sm font-semibold text-amber-300">{title}</h3>
                  <p className="text-sm leading-relaxed text-stone-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 bg-[#14100c] px-5 py-20">
          <div className="mx-auto max-w-[960px]">
            <h2 className="mb-3 text-center text-2xl font-bold text-stone-100">Ablauf in drei Schritten</h2>
            <p className="mx-auto mb-12 max-w-[480px] text-center text-sm text-stone-500">
              Das Karriereprofil wird einmalig angelegt. Jede Stellenanzeige wird danach in Sekunden analysiert.
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Karriereprofil anlegen',
                  desc: 'Berufsfeld, Erfahrungslevel, inhaltliche Schwerpunkte und Karriereziele werden einmalig hinterlegt. Der Lebenslauf wird als Volltext eingefügt oder als PDF hochgeladen. Dieses Profil bildet die Vergleichsbasis für jede folgende Analyse und muss nicht wiederholt bearbeitet werden.',
                },
                {
                  step: '2',
                  title: 'Stellenanzeige übergeben',
                  desc: 'Der vollständige Text einer Stellenausschreibung wird in das Analysefeld eingefügt. Das System wertet geforderte Qualifikationen, Unternehmenssprache, Soft-Skill-Erwartungen und implizite Anforderungen systematisch aus.',
                },
                {
                  step: '3',
                  title: 'Analysebericht abrufen',
                  desc: 'Innerhalb weniger Sekunden steht ein vollständiger Bericht bereit: gewichteter Match-Score, detaillierte Skill-Aufschlüsselung, Kulturscreening-Hinweise und direkt verwendbare CV-Formulierungsvorschläge.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-2xl border border-stone-600/35 bg-white/[0.03] p-6">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-300">
                    {step}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-stone-50">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Report */}
        <section id="demo" className="scroll-mt-20 bg-[#120c08] px-5 py-20">
          <div className="mx-auto max-w-[960px]">
            <h2 className="mb-3 text-center text-2xl font-bold text-stone-100">Aufbau eines Analyseberichts</h2>
            <p className="mx-auto mb-10 max-w-[500px] text-center text-sm text-stone-500">
              Beispielszenario: IT-Fachkraft mit C# und SQL bewirbt sich auf eine Senior-DevOps-Stelle mit Kubernetes-Anforderung.
            </p>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <StaticDemo />
              <div className="space-y-4 text-sm">
                <div className="rounded-2xl border border-stone-600/35 bg-white/[0.03] p-5">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-amber-400">Bewertungsdimensionen</h3>
                  <dl className="space-y-4 text-stone-300">
                    <div>
                      <dt className="font-medium text-stone-200">Match-Score</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-stone-400">Gewichtete Gesamtbewertung aller vier Dimensionen. Ab einem Wert von 3,5 ist eine Bewerbung in der Regel aussichtsreich.</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-200">CV-Match</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-stone-400">Abdeckungsgrad der im Inserat geforderten Qualifikationen durch die Inhalte des hinterlegten Lebenslaufs.</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-200">Rollenpassung</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-stone-400">Abgleich von Erfahrungsjahren, bisherigen Positionen und Verantwortungsbereichen mit dem Anforderungsniveau der Stelle.</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-200">Kulturscreening</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-stone-400">Analyse von Tonalität und Wertesprache des Stellentexts auf kulturelle Rahmenbedingungen und mögliche Passung.</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-200">CV-Formulierungen</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-stone-400">Konkrete Umschreibungen bestehender Lebenslaufeinträge, die relevante Suchbegriffe aus dem Inserat aufgreifen, ohne Fähigkeiten zu erfinden.</dd>
                    </div>
                  </dl>
                </div>
                <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-amber-950"
                  >
                    Erste Analyse starten
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </section>

      </main>
      <footer className="bg-[#0D0800] px-6 py-10 text-center text-xs text-stone-600">
        <p>© 2026 PrivatePrep. KI-gestützte Stellenanalyse.</p>
        <p className="mt-2 flex items-center justify-center gap-4">
          <a href="/impressum" className="transition-colors hover:text-stone-400">Impressum</a>
          <a href="/datenschutz" className="transition-colors hover:text-stone-400">Datenschutz</a>
        </p>
      </footer>
    </div>
  )
}
