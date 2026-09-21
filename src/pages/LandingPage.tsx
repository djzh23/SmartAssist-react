import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignUpButton, useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCheck,
  ShieldCheck,
  ShieldOff,
  TriangleAlert,
  UserRound,
  Users,
  AppWindow,
} from 'lucide-react'
import { NewsletterForm } from '../components/marketing/NewsletterForm'
import { PUBLIC_AFTER_AUTH, PUBLIC_SHELL, PublicSiteFooter, PublicSiteHeader, LANDING_SCROLL_KEY, scrollToSection } from '../components/marketing/PublicSiteChrome'
import ScoreRing from '../components/report/ScoreRing'
import '../styles/landing.css'

const AFTER_AUTH = PUBLIC_AFTER_AUTH
const ICON_STROKE = 1.75

const AUDIENCE_FIELDS = [
  'Pflege',
  'Verwaltung',
  'Vertrieb',
  'Handwerk',
  'Bildung',
  'IT',
  'und andere',
]

const FEATURES = [
  {
    title: 'CV-Match',
    desc: 'Prüft jede geforderte Qualifikation gegen deinen Lebenslauf und markiert, was fehlt.',
    Icon: FileCheck,
  },
  {
    title: 'Rollenpassung',
    desc: 'Gleicht Erfahrungsjahre, Positionen und Verantwortung mit dem Anforderungsniveau ab.',
    Icon: UserRound,
  },
  {
    title: 'Kulturscreening',
    desc: 'Liest Tonalität und Wertesprache des Textes. Passt der Rahmen zu dir?',
    Icon: Users,
  },
  {
    title: 'Red Flags',
    desc: 'Zeigt Warnzeichen: unklare Aufgaben, fehlende Gehaltsangabe, Familie statt Team.',
    Icon: TriangleAlert,
  },
]

const STEPS = [
  {
    step: '1',
    title: 'Karriereprofil anlegen',
    desc: 'Berufsfeld, Erfahrungsstand und Ziele einmal hinterlegen. Der Lebenslauf kommt als PDF oder Text dazu. Dieses Profil ist die Vergleichsbasis für jede folgende Analyse.',
  },
  {
    step: '2',
    title: 'Stellenanzeige übergeben',
    desc: 'Den vollständigen Text einer Stellenausschreibung einfügen. Das System wertet geforderte Qualifikationen, Sprache und implizite Erwartungen so aus, wie sie in der Anzeige stehen.',
  },
  {
    step: '3',
    title: 'Analysebericht abrufen',
    desc: 'Innerhalb weniger Sekunden steht der Bericht bereit: Match-Score, Skill-Aufschlüsselung, Kulturscreening und CV-Formulierungen zum Prüfen und Übernehmen.',
  },
]

const PRIVACY_CARDS = [
  {
    title: 'Kein Speichern deines Lebenslaufs',
    desc: 'Dein Lebenslauf wird für die Analyse einmal an unser KI-Modell übermittelt und danach nicht auf unseren Servern gespeichert. Wir behalten nur eine technische Kennung, damit du die gleiche Analyse nicht doppelt startest.',
    Icon: ShieldOff,
  },
  {
    title: 'Kein Erfinden von Skills',
    desc: 'Die KI darf keine Qualifikationen behaupten, die nicht in deinem Lebenslauf stehen. Eine automatische Prüfung filtert erfundene Angaben heraus, bevor der Bericht bei dir angezeigt wird.',
    Icon: ShieldCheck,
  },
  {
    title: 'Dein Bericht bleibt bei dir',
    desc: 'Der fertige Analysebericht wird ausschließlich in deinem Browser gespeichert. Er ist uns nicht zugänglich und verschwindet, wenn du den Tab schließt.',
    Icon: AppWindow,
  },
]

const FAQ_ITEMS = [
  {
    q: 'Was passiert mit meinem Lebenslauf?',
    a: 'Dein Lebenslauf wird für die Analyse einmal an unser KI-Modell übermittelt und danach nicht auf unseren Servern gespeichert. Wir behalten nur eine technische Kennung. Der fertige Bericht wird ausschließlich in deinem Browser gespeichert und verschwindet, wenn du den Tab schließt.',
  },
  {
    q: 'Was kostet PrivatePrep?',
    a: 'Free: 1 Analyse pro Tag, ohne Kreditkarte. Premium: 6,99 € im Monat für unbegrenzte Analysen, jederzeit kündbar. Die genaue Aufstellung steht unter Preise.',
  },
  {
    q: 'Was ist der Unterschied zu ChatGPT oder anderen KI-Tools?',
    a: 'Allgemeine KI-Tools beantworten einzelne Fragen. Sie kennen weder deinen Lebenslauf noch die deutsche Bewerbungspraxis. PrivatePrep vergleicht deine Angaben systematisch mit der konkreten Ausschreibung, prüft was fehlt und schlägt Umformulierungen aus deinem eigenen Lebenslauf vor. Automatische Prüfungen verhindern, dass Skills oder Zahlen behauptet werden, die nicht in deinen Angaben stehen.',
  },
  {
    q: 'Für welche Branchen ist PrivatePrep geeignet?',
    a: 'PrivatePrep ist branchenoffen. Die Analyse nutzt Kategorien, die in praktisch jeder Ausschreibung vorkommen: geforderte Qualifikationen, Rollenzuschnitt, Kulturhinweise und mögliche Risiken. Getestet wird derzeit in Pflege, Verwaltung, Vertrieb, Handwerk, Bildung und IT. Andere Berufsfelder funktionieren nach der gleichen Logik.',
  },
  {
    q: 'Wie lange dauert eine Analyse?',
    a: 'In der Regel unter einer Minute. Das System liest die Ausschreibung, vergleicht sie mit deinem Karriereprofil und deinem Lebenslauf und stellt den Bericht zusammen. Bei sehr langen Ausschreibungen kann die Verarbeitung etwas mehr Zeit brauchen.',
  },
]

function FaqList() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="mt-8 text-left">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = open === index
        return (
          <div key={item.q} className="border-b border-[#e8e0d0]">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-[#1a1613]"
            >
              <span>{item.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#8a7f70] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="pb-5 pt-1 text-[14px] leading-[1.7] text-[#4a4238]">{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HeroScoreCard() {
  return (
    <div className="rounded-[18px] border border-[#3a332d] bg-[#232019] p-[26px]">
      <p className="pp-caps text-[#a89e91]">Ein Beispiel</p>
      <div className="mt-3.5 flex items-baseline gap-1.5">
        <span className="pp-display text-[64px] leading-none text-[#f5f1eb]">3,8</span>
        <span className="text-lg text-[#a89e91]">/ 5,0</span>
      </div>
      <p className="mt-1.5 text-sm text-[#c4b8a8]">Teamassistenz für Office Managerin</p>
      <div className="mt-[18px] h-1.5 overflow-hidden rounded-full bg-[#1a1613]">
        <div className="h-full w-[76%] rounded-full bg-[#d97757]" />
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <span className="rounded-full bg-[rgba(111,143,109,0.15)] px-2.5 py-1 text-[11px] text-[#8dae8b]">
          4 Skills gedeckt
        </span>
        <span className="rounded-full bg-[rgba(217,119,87,0.12)] px-2.5 py-1 text-[11px] text-[#e89372]">
          2 Red Flags
        </span>
      </div>
    </div>
  )
}

function ExampleReport() {
  return (
    <div className="pp-card-report px-6 py-8 sm:px-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="pp-caps text-[#8a7f70]">Beispielbericht</p>
        <span className="pp-badge-success">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Starke Passung
        </span>
      </div>

      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
        <ScoreRing score={3.8} size={150} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="pp-display text-2xl leading-snug text-[#1a1613]">
            Teamassistenz für Office Managerin
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6e665e]">
            4 von 5 Kernanforderungen gedeckt · 2 Skills nachzureichen · 2 Red Flags in der Ausschreibung
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          { label: 'CV-Match', value: '4,2' },
          { label: 'Rolle', value: '3,9' },
          { label: 'Kultur', value: '3,5' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-[#ebe3d3] bg-[#faf7f0] p-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[#8a7f70]">{item.label}</p>
            <p className="pp-display text-[26px] leading-none text-[#1a1613]">{item.value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-[rgba(217,119,87,0.25)] bg-[rgba(217,119,87,0.06)] p-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[#b45539]">Red Flags</p>
          <p className="pp-display text-[26px] leading-none text-[#b45539]">2</p>
        </div>
      </div>
    </div>
  )
}

function SignUpCta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
      <button type="button" className={className ?? 'pp-cta'}>
        {children}
      </button>
    </SignUpButton>
  )
}

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    const prevRestore = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      html.style.scrollBehavior = previous
      window.history.scrollRestoration = prevRestore
    }
  }, [])

  useEffect(() => {
    const save = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(LANDING_SCROLL_KEY, String(window.scrollY))
      }
    }
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        sessionStorage.setItem(LANDING_SCROLL_KEY, String(window.scrollY))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      save()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate(AFTER_AUTH, { replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  return (
    <div className="landing-page-root min-h-screen">
      <PublicSiteHeader variant="landing" />
      <main id="main-content">
        <section id="hero" className="pp-band-hero pb-20 pt-12 sm:pb-24 sm:pt-16 lg:min-h-[720px] lg:pt-8">
          <div className={`${PUBLIC_SHELL} relative`}>
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-16">
              <div className="max-w-[780px] pt-4 lg:pt-16">
                <p className="pp-eyebrow">1 Analyse pro Tag kostenlos · für alle Branchen</p>
                <h1 className="pp-display mt-9 text-[clamp(2.5rem,7vw,5.125rem)] leading-[0.98] text-[#f5f1eb]">
                  Passt du zur Stelle?
                  <br />
                  <span className="pp-italic text-[#d97757]">In unter einer Minute.</span>
                </h1>
                <p className="mt-7 max-w-[640px] text-[18px] leading-[1.55] text-[#c4b8a8] sm:text-[20px]">
                  Wir prüfen die Stellenanzeige und deinen Lebenslauf. Du bekommst Passungs-Score,
                  geforderte Skills, Red Flags und konkrete Formulierungsvorschläge mit Begründung.
                </p>
                <div className="mt-11 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <SignUpCta className="pp-cta min-h-[56px] px-8 text-base">
                    Stellenanzeige einfügen
                    <ArrowRight className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
                  </SignUpCta>
                  <button
                    type="button"
                    onClick={() => scrollToSection('bericht')}
                    className="pp-text-link bg-transparent"
                  >
                    Beispielbericht ansehen
                  </button>
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  {AUDIENCE_FIELDS.map(label => (
                    <span key={label} className="pp-tag">{label}</span>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block lg:pt-[88px]">
                <HeroScoreCard />
              </div>
            </div>
            <div className="mt-10 lg:hidden">
              <HeroScoreCard />
            </div>
          </div>
          <div className="pp-hero-overlap" aria-hidden />
        </section>

        <section id="bericht" className="pp-section pp-band-light pt-16">
          <div className={PUBLIC_SHELL}>
            <p className="pp-caps text-[#b45539]">Der Bericht</p>
            <h2 className="pp-section-title mt-3.5 max-w-[680px]">
              Vier Analysen, <span className="pp-italic text-[#b45539]">ein Verdikt.</span>
            </h2>
            <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-[#4a4238]">
              Kein Score-Nebel, keine Buzzwords. Jede Zahl gehört zu einem Modul mit klarer Logik,
              und du siehst, worauf sie beruht.
            </p>
            <div className="mt-11">
              <ExampleReport />
            </div>
          </div>
        </section>

        <section id="funktionen" className="pp-section pp-band-dark">
          <div className={PUBLIC_SHELL}>
            <p className="pp-caps text-[#d97757]">Was der Bericht prüft</p>
            <h2 className="pp-section-title mt-3.5 max-w-[640px] text-[#f5f1eb]">
              Vier Module. <span className="pp-italic text-[#d97757]">Jedes mit klarer Logik.</span>
            </h2>
            <div className="mt-11 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {FEATURES.map(({ title, desc, Icon }) => (
                <article key={title} className="pp-card p-[26px]">
                  <Icon className="h-7 w-7 text-[#d97757]" strokeWidth={1.5} aria-hidden />
                  <h3 className="pp-display mt-4 text-[22px] text-[#f5f1eb]">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#a89e91]">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cv-vorschlag" className="pp-section pp-band-light">
          <div className={PUBLIC_SHELL}>
            <p className="pp-caps text-[#b45539]">CV-Optimierung</p>
            <h2 className="pp-section-title mt-4 max-w-[680px]">
              Von Aufgabe zu <span className="pp-italic text-[#b45539]">Wirkung.</span>
            </h2>
            <p className="mt-4 max-w-[680px] text-[17px] leading-relaxed text-[#4a4238]">
              Jeder Vorschlag zeigt die verbesserte Version und erklärt, warum sie stärker ist.
            </p>
            <div className="mt-11 grid gap-6 lg:grid-cols-2">
              <article className="pp-card-light p-[26px] shadow-none">
                <p className="pp-caps text-[#8a7f70]">Vorhandener Eintrag</p>
                <p className="mt-3.5 rounded-lg bg-[#faf7f0] px-3.5 py-3 text-[15px] leading-relaxed text-[#6e665e]">
                  Termine für die Abteilungsleitung gemacht
                </p>
                <p className="pp-caps mt-5 text-[#b45539]">Formulierungsvorschlag</p>
                <p className="mt-3.5 rounded-lg border-l-[3px] border-[#d97757] bg-[rgba(217,119,87,0.06)] px-3.5 py-3 text-[15px] leading-relaxed text-[#1a1613]">
                  <span className="pp-hl">Kalenderführung und Terminkoordination</span> für die Abteilungsleitung{' '}
                  <span className="pp-hl">eigenständig übernommen</span>.
                </p>
                <p className="mt-4 border-l-2 border-[#ebe3d3] pl-3 text-[13px] leading-relaxed text-[#8a7f70]">
                  <span className="font-semibold text-[#b45539]">Warum:</span> Vom Tätigkeitswort zum Wirkungssatz.
                  ATS-Systeme gewichten spezifische Verben höher als Alltagssprache.
                </p>
              </article>
              <article className="pp-card-light p-[26px] shadow-none">
                <p className="pp-caps text-[#8a7f70]">Vorhandener Eintrag</p>
                <p className="mt-3.5 rounded-lg bg-[#faf7f0] px-3.5 py-3 text-[15px] leading-relaxed text-[#6e665e]">
                  Reisekosten abgerechnet
                </p>
                <p className="pp-caps mt-5 text-[#b45539]">Formulierungsvorschlag</p>
                <p className="mt-3.5 rounded-lg border-l-[3px] border-[#d97757] bg-[rgba(217,119,87,0.06)] px-3.5 py-3 text-[15px] leading-relaxed text-[#1a1613]">
                  <span className="pp-hl">Reisekostenabrechnung</span> für Außentermine{' '}
                  <span className="pp-hl">eigenständig erstellt und nachgehalten</span>.
                </p>
                <p className="mt-4 border-l-2 border-[#ebe3d3] pl-3 text-[13px] leading-relaxed text-[#8a7f70]">
                  <span className="font-semibold text-[#b45539]">Warum:</span> Substantivierung als Fachvokabel plus zwei aktive Verben zeigen Verantwortung, nicht Ausführung.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="preise" className="pp-section pp-band-dark py-16">
          <div className={PUBLIC_SHELL}>
            <p className="pp-caps text-[#d97757]">Preise</p>
            <h2 className="pp-section-title mt-3 text-[#f5f1eb]">Zwei Wege, dein Tempo.</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <article className="flex flex-col justify-between gap-4 rounded-2xl border border-[#3a332d] bg-[#232019] p-[26px] sm:flex-row sm:items-center">
                <div>
                  <p className="pp-display text-2xl text-[#f5f1eb]">Kostenlos</p>
                  <p className="mt-1.5 text-sm text-[#a89e91]">1 Analyse pro Tag · voller Bericht · ohne Kreditkarte</p>
                </div>
                <p className="pp-display text-4xl text-[#f5f1eb]">0 €</p>
              </article>
              <article className="relative flex flex-col justify-between gap-4 rounded-2xl border border-[#d97757] bg-gradient-to-br from-[#2a2420] to-[#232019] p-[26px] sm:flex-row sm:items-center">
                <span className="absolute -top-2.5 left-[26px] rounded-full bg-[#d97757] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#1a1613]">
                  Empfohlen
                </span>
                <div>
                  <p className="pp-display text-2xl text-[#f5f1eb]">Premium</p>
                  <p className="mt-1.5 text-sm text-[#a89e91]">Unbegrenzte Analysen · jederzeit kündbar</p>
                </div>
                <p className="whitespace-nowrap">
                  <span className="pp-display text-4xl text-[#f5f1eb]">6,99 €</span>
                  <span className="text-[13px] text-[#a89e91]"> / Monat</span>
                </p>
              </article>
            </div>
            <div className="mt-6">
              <Link to="/pricing" className="pp-text-link">
                Alle Tarifdetails ansehen
              </Link>
            </div>
          </div>
        </section>

        <section id="starten" className="pp-section pp-band-light">
          <div className={PUBLIC_SHELL}>
            <div className="pp-card-beta flex flex-col items-start justify-between gap-6 px-8 py-9 sm:flex-row sm:items-center sm:px-11">
              <div>
                <h2 className="pp-display text-[clamp(1.75rem,3vw,2.125rem)] leading-tight text-[#1a1613]">
                  Bereit? <span className="pp-italic text-[#b45539]">Analyse in unter einer Minute.</span>
                </h2>
                <p className="mt-2 text-[15px] text-[#6e665e]">
                  Konto erstellen, dann analysieren. 1 Analyse pro Tag kostenlos, keine Kreditkarte.
                </p>
              </div>
              <SignUpCta className="pp-cta min-h-[56px] shrink-0 px-8 text-base">
                Jetzt kostenlos starten
                <ArrowRight className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
              </SignUpCta>
            </div>
          </div>
        </section>

        <section id="ablauf" className="pp-section pp-band-dark">
          <div className={PUBLIC_SHELL}>
            <p className="pp-caps text-[#d97757]">Ablauf</p>
            <h2 className="pp-section-title mt-3.5 text-[#f5f1eb]">
              Drei Schritte. <span className="pp-italic text-[#d97757]">Profil einmal, Anzeige oft.</span>
            </h2>
            <p className="mt-4 max-w-[40rem] text-[17px] leading-relaxed text-[#a89e91]">
              Das Karriereprofil wird einmalig angelegt. Jede Stellenanzeige wird danach in Sekunden analysiert.
            </p>
            <div className="mt-10 grid gap-5 text-left sm:grid-cols-3">
              {STEPS.map(({ step, title, desc }) => (
                <article key={step} className="pp-card p-[26px]">
                  <span className="pp-step-num">{step}</span>
                  <h3 className="pp-display mt-4 text-[22px] text-[#f5f1eb]">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#a89e91]">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ueber" className="pp-section pp-band-light">
          <div className={`${PUBLIC_SHELL} max-w-[760px]`}>
            <p className="pp-caps text-[#b45539]">Warum PrivatePrep</p>
            <h2 className="pp-section-title mt-3.5">
              Der Abgleich entscheidet. <span className="pp-italic text-[#b45539]">Nicht das Bauchgefühl.</span>
            </h2>
            <p className="mt-8 text-[15px] leading-[1.75] text-[#4a4238]">
              Die meisten Bewerbungen scheitern nicht am Kandidaten. Sie scheitern am Abgleich. Zwischen dem was die Stellenausschreibung fordert und dem was der Lebenslauf zeigt. Zwischen den geforderten Qualifikationen und ihrer Formulierung im Profil.
            </p>
            <p className="mt-6 text-[15px] leading-[1.75] text-[#4a4238]">
              PrivatePrep prüft diesen Abgleich. Systematisch, nachvollziehbar, ohne Erfindung. Der Bericht zeigt was passt, was fehlt und welche vorhandenen Erfahrungen sich anders formulieren lassen, damit sie zur konkreten Stelle passen.
            </p>
            <p className="mt-6 text-[15px] leading-[1.75] text-[#4a4238]">
              Der Bericht bewertet nicht dich. Er bewertet die Passung zu einer konkreten Stelle. Das ist ein Unterschied, den wir wichtig finden.
            </p>
          </div>
        </section>

        <section id="datenschutz-teaser" className="pp-section pp-band-dark">
          <div className={PUBLIC_SHELL}>
            <p className="pp-caps text-[#d97757]">Daten</p>
            <h2 className="pp-section-title mt-3.5 text-[#f5f1eb]">
              Deine Daten bleiben <span className="pp-italic text-[#d97757]">deine Daten.</span>
            </h2>
            <p className="mt-4 max-w-[36rem] text-[15px] leading-[1.75] text-[#a89e91]">
              Datenschutz ist bei PrivatePrep in die Grundstruktur eingebaut. Nicht als Extra, sondern als Ausgangspunkt.
            </p>
            <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
              {PRIVACY_CARDS.map(({ title, desc, Icon }) => (
                <article key={title} className="pp-card p-6">
                  <Icon className="h-6 w-6 text-[#d97757]" strokeWidth={ICON_STROKE} aria-hidden />
                  <h3 className="mt-4 text-base font-medium text-[#f5f1eb]">{title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.6] text-[#a89e91]">{desc}</p>
                </article>
              ))}
            </div>
            <Link to="/datenschutz" className="pp-text-link mt-8 inline-block">
              Vollständige Datenschutzerklärung lesen
            </Link>
          </div>
        </section>

        <section id="faq" className="pp-section pp-band-light pb-20">
          <div className={PUBLIC_SHELL}>
            <div className="mx-auto max-w-[720px]">
              <p className="pp-caps text-[#b45539]">FAQ</p>
              <h2 className="pp-section-title mt-3.5">Häufige Fragen</h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#4a4238]">
                Wenn deine Frage nicht dabei ist, schreib eine kurze Mail an{' '}
                <a href="mailto:zn.connec.team@gmail.com" className="text-[#b45539] underline-offset-2 hover:underline">
                  zn.connec.team@gmail.com
                </a>
                .
              </p>
              <FaqList />
              <div className="mt-12 border-t border-[#e8e0d0] pt-8">
                <p className="text-sm font-medium text-[#1a1613]">Noch nicht bereit?</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#8a7f70]">
                  Trag dich in unsere Update-Liste ein und erhalte Nachrichten zu neuen Funktionen.
                </p>
                <div className="mt-5 max-w-[420px]">
                  <NewsletterForm compact />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
