import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

export default function ImpressumPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-24 text-stone-300 sm:pt-28">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Impressum</h1>
        <p className="text-sm text-stone-500">Angaben gemäß § 5 DDG. Platzhalter, bitte selbst ausfüllen.</p>

        <article className="legal-prose mt-8">
          <h2>Anbieter</h2>
          <p>
            <strong>TODO: voller Name</strong><br />
            TODO: Straße und Hausnummer<br />
            TODO: PLZ Ort (Hamburg-Langenhorn)<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>E-Mail: TODO: Kontakt-E-Mail</p>

          <h2>Umsatzsteuer</h2>
          <p>
            TODO: Kleinunternehmer nach § 19 UStG, oder USt-IdNr. eintragen.
          </p>

          <h2>Verantwortlich für den Inhalt</h2>
          <p>TODO: gleicher Name wie oben, soweit einschlägig.</p>

          <h2>Offene Punkte vor dem Launch</h2>
          <ul>
            <li>Name, Anschrift und E-Mail ersetzen.</li>
            <li>Umsatzsteuerregelung festlegen.</li>
            <li>AVVs mit Groq, Clerk, Stripe, Render, Vercel, Supabase und ggf. Pirsch bestätigen.</li>
            <li>Datenschutzerklärung nach dem Ausfüllen dieses Impressums noch einmal lesen.</li>
          </ul>

          <p>
            <Link to="/datenschutz">Datenschutzerklärung</Link>
          </p>
        </article>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
