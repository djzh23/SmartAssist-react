import { Link } from 'react-router-dom'
import { Download, FileText, Inbox, LogIn, MousePointerClick } from 'lucide-react'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import { appCtaButtonClasses } from '../components/ui/AppCtaButton'
import '../styles/landing.css'

const EXTENSION_ZIP_URL = '/downloads/privateprep-extension.zip'

const USE_STEPS = [
  { step: '1', title: 'Einloggen', desc: 'Bei PrivatePrep im selben Browser angemeldet sein.', Icon: LogIn },
  { step: '2', title: 'Anzeige öffnen', desc: 'LinkedIn, StepStone oder ein anderes Job-Portal.', Icon: FileText },
  { step: '3', title: 'Icon klicken', desc: 'PrivatePrep-Icon oben rechts in der Symbolleiste.', Icon: MousePointerClick },
  { step: '4', title: 'Speichern', desc: 'Die Stelle erscheint danach in deiner Inbox.', Icon: Inbox },
] as const

const INSTALL_STEPS = [
  { step: '1', title: 'ZIP laden', desc: 'Oben auf „ZIP laden“ klicken.' },
  { step: '2', title: 'Entpacken', desc: 'Rechtsklick auf die Datei, dann „Alle extrahieren“.' },
  { step: '3', title: 'Seite öffnen', desc: 'In Chrome chrome://extensions, in Edge edge://extensions.' },
  { step: '4', title: 'Entwicklermodus', desc: 'Schalter oben rechts einschalten.' },
  { step: '5', title: 'Ordner laden', desc: '„Entpackte Erweiterung laden“ und den Ordner mit manifest.json wählen.' },
] as const

export default function ExtensionPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[880px] px-5 pb-16 pt-8 text-stone-300 sm:pt-10">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Browser-Erweiterung</h1>
        <p className="max-w-[36rem] text-sm leading-relaxed text-stone-400">
          Stelle offen, Icon klicken, fertig. Titel, Firma und Anzeigentext liegen danach in deiner Inbox.
        </p>

        <div className="mt-6 flex flex-col items-stretch gap-3 rounded-2xl border border-[#3a332d] bg-[#232019] p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <a href={EXTENSION_ZIP_URL} download className={appCtaButtonClasses({ size: 'lg', className: 'w-full sm:w-auto' })}>
            <Download size={16} aria-hidden />
            ZIP laden
          </a>
          <p className="text-xs text-stone-500">
            Version 0.1.4 · Beta, noch nicht im Chrome Web Store
          </p>
        </div>

        <section className="mt-10">
          <p className="pp-caps text-[#d97757]">Nutzung</p>
          <h2 className="mt-2 text-xl font-semibold text-stone-100">Vier Klicks, dann liegt die Stelle in der Inbox</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {USE_STEPS.map(({ step, title, desc, Icon }) => (
              <article key={step} className="pp-card flex gap-3 p-4">
                <span className="pp-step-num shrink-0">{step}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#d97757]" strokeWidth={1.75} aria-hidden />
                    <h3 className="text-base font-semibold text-stone-100">{title}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#a89e91]">{desc}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-[#a89e91]">
            Danach prüfst du die Stelle in der
            {' '}
            <Link to="/inbox" className="text-stone-100 underline underline-offset-2">Inbox</Link>
            {' '}
            und startest die Analyse, wann du willst.
          </p>
        </section>

        <section className="mt-10">
          <p className="pp-caps text-[#d97757]">Installation</p>
          <h2 className="mt-2 text-xl font-semibold text-stone-100">Einmal einrichten, dauert etwa eine Minute</h2>
          <ol className="mt-5 space-y-2">
            {INSTALL_STEPS.map(({ step, title, desc }) => (
              <li key={step} className="pp-card flex items-start gap-3 px-4 py-3">
                <span className="pp-step-num mt-0.5 shrink-0">{step}</span>
                <div>
                  <p className="font-semibold text-stone-100">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[#a89e91]">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-[#a89e91]">
            Der Hinweis „Erweiterungen im Entwicklermodus“ ist normal. Die Erweiterung kommt noch nicht aus dem Store.
          </p>
        </section>

        <section className="mt-10">
          <p className="pp-caps text-[#d97757]">Kurzgefasst</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#a89e91]">
            <li className="pp-card px-4 py-3">Chrome oder Edge auf dem Desktop. Auf dem Handy nutzt du die Website und fügst den Text in <Link to="/analyze" className="text-stone-100 underline underline-offset-2">Analyse</Link> oder die <Link to="/inbox" className="text-stone-100 underline underline-offset-2">Inbox</Link> ein.</li>
            <li className="pp-card px-4 py-3">LinkedIn wird am zuverlässigsten erkannt. Auf anderen Portalen kannst du Titel, Firma und Text danach in der Inbox nachbearbeiten.</li>
            <li className="pp-card px-4 py-3">Liest nur den aktiven Tab, und nur wenn du auf das Icon klickst. Keine anderen Tabs, kein Tracking. Mehr in der <Link to="/datenschutz" className="text-stone-100 underline underline-offset-2">Datenschutzerklärung</Link>.</li>
          </ul>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
