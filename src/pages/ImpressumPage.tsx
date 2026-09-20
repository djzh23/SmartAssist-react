import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

export default function ImpressumPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-8 text-stone-300 sm:pt-10">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Impressum</h1>
        <p className="text-sm text-stone-500">Angaben gemäß § 5 DDG.</p>

        <article className="legal-prose mt-8">
          <p>
            Diese Anwendung befindet sich in einer geschlossenen Beta-Phase.
            Die vollständige Anschrift wird vor dem öffentlichen Launch ergänzt.
            Für Rückfragen: <a href="mailto:zouh.ijd@gmail.com">zouh.ijd@gmail.com</a>
          </p>

          <h2>Anbieter</h2>
          <p>Zouhair Ijaad</p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:zouh.ijd@gmail.com">zouh.ijd@gmail.com</a>
          </p>

          <h2>Umsatzsteuer</h2>
          <p>Kleinunternehmer nach § 19 UStG. Es wird keine Umsatzsteuer ausgewiesen.</p>

          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>Zouhair Ijaad, Kontakt wie oben.</p>

          <p>
            <Link to="/datenschutz">Datenschutzerklärung</Link>
          </p>
        </article>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
