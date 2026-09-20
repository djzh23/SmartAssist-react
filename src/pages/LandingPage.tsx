import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignUpButton, useUser } from '@clerk/clerk-react'
import {
  AppWindow,
  Check,
  ChevronDown,
  FileCheck,
  ListChecks,
  Mail,
  Pencil,
  Shield,
  ShieldCheck,
  ShieldOff,
  Target,
  TriangleAlert,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { NewsletterForm } from '../components/marketing/NewsletterForm'
import { PUBLIC_AFTER_AUTH, PUBLIC_SHELL, PublicSiteFooter, PublicSiteHeader, scrollToSection, LANDING_SCROLL_KEY } from '../components/marketing/PublicSiteChrome'
import { betaModeEnabled } from '../config/env'
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
    title: 'Match-Score',
    desc: 'Gewichtete Gesamtbewertung von 1,0 bis 5,0. Vier Dimensionen fließen ein: CV-Abdeckung, Rollenpassung, Kulturscreening und erkannte Risikofaktoren.',
    Icon: Target,
  },
  {
    title: 'Skill-Analyse',
    desc: 'Geforderte Qualifikationen werden mit dem Lebenslauf abgeglichen. Vorhandene und fehlende Skills stehen getrennt, damit Lücken gezielt adressiert werden können.',
    Icon: ListChecks,
  },
  {
    title: 'CV-Formulierungen',
    desc: 'Für bestehende Lebenslaufeinträge gibt es Umformulierungen, die Wörter aus der Stellenanzeige aufgreifen, ohne nicht vorhandene Fähigkeiten zu behaupten.',
    Icon: Pencil,
  },
  {
    title: 'Kulturscreening',
    desc: 'Sprache und Tonalität der Ausschreibung werden auf Hierarchie, Team und Arbeitsweise gelesen. Die Hinweise fließen in die Bewertung ein.',
    Icon: Shield,
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

const REPORT_METRICS = [
  { label: 'CV-Match', value: '4,2', Icon: FileCheck },
  { label: 'Rollenpassung', value: '3,9', Icon: UserRound },
  { label: 'Kultur', value: '3,5', Icon: Users },
  { label: 'Red Flags', value: '2,0', Icon: TriangleAlert },
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
    a: 'Während der geschlossenen Beta ist die Nutzung kostenfrei. Es gibt keinen Zahlungsschritt bei der Anmeldung, kein Abo, keine Karte. Nach dem öffentlichen Start planen wir einen kostenfreien Basis-Tarif und einen kostenpflichtigen Tarif für unbegrenzte Analysen. Die Preise werden vorher öffentlich kommuniziert.',
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
          <div key={item.q} className="border-b-[0.5px] border-[#3a342e]">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-white"
            >
              <span>{item.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#C4B8AA] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="pb-5 pt-3 text-[14px] leading-[1.7] text-[#C4B8AA]">{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const DIMENSIONS = [
  {
    title: 'CV-Match',
    desc: 'Abdeckung der im Inserat geforderten Qualifikationen durch den hinterlegten Lebenslauf.',
    Icon: FileCheck,
  },
  {
    title: 'Rollenpassung',
    desc: 'Abgleich von Erfahrungsjahren, Positionen und Verantwortung mit dem Anforderungsniveau der Stelle.',
    Icon: UserRound,
  },
  {
    title: 'Kulturscreening',
    desc: 'Tonalität und Wertesprache des Stellentexts auf Rahmenbedingungen und mögliche Passung.',
    Icon: Users,
  },
  {
    title: 'Red Flags',
    desc: 'Erkannte Risikofaktoren in der Ausschreibung, etwa unklare Erwartungen oder widersprüchliche Anforderungen.',
    Icon: TriangleAlert,
  },
]

function ExampleReport() {
  return (
    <div className="pp-card-report p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="pp-kicker">Beispielbericht</p>
        <span className="pp-badge-success">
          <Check className="h-3 w-3" strokeWidth={ICON_STROKE} aria-hidden />
          Gute Passung
        </span>
      </div>

      <p className="font-serif text-[48px] font-semibold leading-none text-[#F5F5F5]">
        3,8 <span className="text-lg font-normal text-[#737373]">von 5,0</span>
      </p>
      <p className="mt-3 text-sm text-[#A8A8A8]">Teamassistenz für Office Managerin</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {REPORT_METRICS.map(({ label, value, Icon }) => (
          <div key={label} className="pp-metric flex items-center gap-3 px-3 py-3">
            <Icon className="h-4 w-4 shrink-0 text-[#FBBF24]" strokeWidth={ICON_STROKE} aria-hidden />
            <div>
              <p className="text-lg font-semibold leading-none text-[#F5F5F5]">{value}</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#737373]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pp-divide">
        <p className="pp-kicker">Skill-Analyse</p>
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#34D399]">
          <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} aria-hidden />
          Nachgewiesen
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['MS Office', 'Terminplanung'].map(skill => (
            <span key={skill} className="pp-chip-pos">{skill}</span>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#FB7185]">
          <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} aria-hidden />
          Nicht vorhanden
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['Englisch C1', 'SAP'].map(skill => (
            <span key={skill} className="pp-chip-neg">{skill}</span>
          ))}
        </div>
      </div>

      <div className="pp-divide">
        <p className="pp-kicker">CV-Formulierungsvorschläge</p>
        <ul className="mt-4 space-y-3">
          <li className="pp-metric px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#737373]">Vorhandener Eintrag</p>
            <p className="mt-1 text-xs text-[#A8A8A8]">Termine für die Abteilungsleitung gemacht</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.08em] text-[#D99A16]">Formulierungsvorschlag</p>
            <p className="mt-1 text-xs text-[#F5F5F5]">Kalenderführung und Terminkoordination für die Abteilungsleitung übernommen.</p>
          </li>
          <li className="pp-metric px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#737373]">Vorhandener Eintrag</p>
            <p className="mt-1 text-xs text-[#A8A8A8]">Reisekosten abgerechnet</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.08em] text-[#D99A16]">Formulierungsvorschlag</p>
            <p className="mt-1 text-xs text-[#F5F5F5]">Reisekostenabrechnung für Außentermine eigenständig erstellt und nachgehalten.</p>
          </li>
        </ul>
      </div>
    </div>
  )
}

function scrollToId(id: string) {
  scrollToSection(id, 'smooth')
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
        <section id="hero" className="pp-band-hero pb-10 pt-12 sm:pb-12 sm:pt-16 lg:pt-20">
          <div className={`${PUBLIC_SHELL} text-center`}>
            <p className="pp-eyebrow">Stellenanalyse für Bewerbungen in Deutschland</p>
            <h1 className="font-serif mt-6 text-[clamp(34px,8vw,56px)] font-semibold leading-[1.12] text-[#F5F0E8]">
              Bewerbungen fundiert vorbereiten.
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-[#C4B8AA] sm:text-lg">
              PrivatePrep prüft eine Stellenanzeige gegen dein Karriereprofil und deinen Lebenslauf.
              Du bekommst einen Bericht mit Match-Score, fehlenden Skills und Formulierungen,
              die zur ausgeschriebenen Stelle passen.
            </p>
            {betaModeEnabled ? (
              <button
                type="button"
                onClick={() => scrollToId('zugang-anfragen')}
                className="pp-cta mx-auto mt-8 w-full sm:max-w-[280px]"
              >
                Beta-Zugang anfragen
              </button>
            ) : (
              <SignUpButton mode="modal" fallbackRedirectUrl={AFTER_AUTH}>
                <button type="button" className="pp-cta mx-auto mt-8 w-full sm:max-w-[280px]">
                  Kostenlos starten
                </button>
              </SignUpButton>
            )}
            <p className="mt-3 text-sm italic text-[#8A7F72]">
              {betaModeEnabled
                ? 'Kostenfrei während der Beta. Kein Zahlungsschritt.'
                : '1 Analyse pro Tag im kostenlosen Tarif. Keine Zahlungsdaten erforderlich.'}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {AUDIENCE_FIELDS.map(label => (
                <span key={label} className="pp-tag">{label}</span>
              ))}
            </div>
          </div>
        </section>

        <section id="funktionen" className="pp-section pp-band-a">
          <div className={`${PUBLIC_SHELL} text-center`}>
            <h2 className="pp-section-title">Was PrivatePrep leistet</h2>
            <p className="pp-section-lead">
              Jede Analyse basiert auf deinem Profil und der konkreten Anzeige. Keine Branchenvorlage, kein IT-only-Werkzeug.
            </p>
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 xl:grid-cols-4">
              {FEATURES.map(({ title, desc, Icon }) => (
                <article key={title} className="pp-card p-5 sm:p-6">
                  <Icon className="pp-icon-accent h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
                  <h3 className="mt-4 text-base font-semibold text-[#F5F0E8]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#C4B8AA]">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="bericht" className="pp-section pp-band-b">
          <div className={PUBLIC_SHELL}>
            <p className="text-[11px] font-medium uppercase tracking-[0.6px] text-[#FBBF24]">BEISPIEL</p>
            <h2 className="mt-2 text-[22px] font-medium text-white">So sieht dein Bericht aus.</h2>
            <p className="mt-2 max-w-[40rem] text-[14px] leading-[1.6] text-[#C4B8AA]">
              Ein anonymisiertes Beispiel aus der Kategorie Verwaltung. Deine echte Analyse basiert auf deinem eigenen Karriereprofil und deinem Lebenslauf.
            </p>
            <div className="mt-8 grid gap-6 text-left lg:grid-cols-2 lg:items-start lg:gap-8">
              <ExampleReport />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {DIMENSIONS.map(({ title, desc, Icon }) => (
                  <article key={title} className="pp-card flex gap-3 p-4 sm:p-5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#FBBF24]" strokeWidth={ICON_STROKE} aria-hidden />
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F0E8]">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#C4B8AA]">{desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ablauf" className="pp-section pp-band-c">
          <div className={`${PUBLIC_SHELL} text-center`}>
            <h2 className="pp-section-title">Ablauf in drei Schritten</h2>
            <p className="pp-section-lead">
              Das Karriereprofil wird einmalig angelegt. Jede Stellenanzeige wird danach in Sekunden analysiert.
            </p>
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              {STEPS.map(({ step, title, desc }) => (
                <article key={step} className="pp-card p-5 sm:p-6">
                  <span className="pp-step-num">{step}</span>
                  <h3 className="mt-4 text-base font-semibold text-[#F5F0E8]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#C4B8AA]">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ueber" className="pp-section pp-band-a pp-band-from-c py-20">
          <div className={`${PUBLIC_SHELL} text-center`}>
            <div className="mx-auto max-w-[640px]">
              <h2 className="text-[28px] font-medium text-white">Über PrivatePrep</h2>
              <p className="mt-8 text-[15px] leading-[1.75] text-[#C4B8AA]">
                PrivatePrep ist ein privates Projekt aus Hamburg. Entwickelt von einem Informatik-Absolventen, der die deutsche Bewerbungspraxis aus mehreren Jahren eigener Erfahrung kennt: Werkstudentenstellen, Anschreiben die niemand liest, Absagen ohne Feedback.
              </p>
              <p className="mt-6 text-[15px] leading-[1.75] text-[#C4B8AA]">
                Die Idee hinter PrivatePrep ist einfach. Eine gute Bewerbung ist nicht die, die am besten klingt. Sie ist die, bei der Lebenslauf und Ausschreibung wirklich zusammenpassen. Wo das nicht der Fall ist, soll das ehrlich sichtbar sein. Wo es passt, soll die Formulierung dazu beitragen, dass es auch beim Lesen erkannt wird.
              </p>
              <p className="mt-6 text-[15px] leading-[1.75] text-[#C4B8AA]">
                PrivatePrep prüft diesen Abgleich. Nicht mehr, nicht weniger.
              </p>
            </div>
          </div>
        </section>

        <section id="datenschutz-teaser" className="pp-section pp-band-b">
          <div className={`${PUBLIC_SHELL} text-center`}>
            <h2 className="text-[28px] font-medium text-white">Deine Daten bleiben deine Daten</h2>
            <p className="mx-auto mt-3 max-w-[36rem] text-[15px] leading-[1.75] text-[#C4B8AA]">
              Datenschutz ist bei PrivatePrep in die Grundstruktur eingebaut. Nicht als Feature, sondern als Ausgangspunkt.
            </p>
            <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
              {PRIVACY_CARDS.map(({ title, desc, Icon }) => (
                <article
                  key={title}
                  className="rounded-[12px] border-[0.5px] border-[#3a342e] bg-[#1a1512] p-6"
                >
                  <Icon className="h-6 w-6 text-[#FBBF24]" strokeWidth={ICON_STROKE} aria-hidden />
                  <h3 className="mt-4 text-base font-medium text-white">{title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.6] text-[#C4B8AA]">{desc}</p>
                </article>
              ))}
            </div>
            <Link
              to="/datenschutz"
              className="mt-8 inline-block text-[13px] text-[#D99A16] transition-colors hover:text-[#FBBF24]"
            >
              Vollständige Datenschutzerklärung lesen
            </Link>
          </div>
        </section>

        <section id="faq" className="pp-section pp-band-c">
          <div className={`${PUBLIC_SHELL}`}>
            <div className="mx-auto max-w-[720px] text-center">
              <h2 className="text-[28px] font-medium text-white">Häufige Fragen</h2>
              <p className="mt-3 text-[15px] leading-[1.75] text-[#C4B8AA]">
                Wenn deine Frage nicht dabei ist, schreib eine kurze Mail an{' '}
                <a href="mailto:ijd.zouh@yahoo.com" className="text-[#C4B8AA] underline-offset-2 hover:text-white hover:underline">
                  ijd.zouh@yahoo.com
                </a>.
              </p>
              <FaqList />
            </div>
          </div>
        </section>

        {betaModeEnabled ? (
          <section id="zugang-anfragen" className="pp-section pp-band-a pp-band-from-c pb-16 sm:pb-20">
            <div className={`${PUBLIC_SHELL} text-center`}>
              <h2 className="pp-section-title">Zugang anfragen</h2>
              <p className="pp-section-lead">
                Trag deine E-Mail ein. Wir melden uns, sobald ein Platz frei ist.
              </p>
              <div className="pp-card-beta mx-auto mt-8 max-w-[520px] p-6 text-left sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="pp-mail-badge" aria-hidden>
                    <Mail className="h-[18px] w-[18px]" strokeWidth={ICON_STROKE} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#F5F5F5]">Beta-Zugang anfragen</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#A8A8A8]">
                      Kostenfrei während der Beta. Kein Zahlungsschritt.
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <PublicSiteFooter />
    </div>
  )
}
