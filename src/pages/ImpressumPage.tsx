import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

export default function ImpressumPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-8 text-stone-300 sm:pt-10">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Impressum</h1>
        <p className="text-sm text-stone-500">Angaben gemäß § 5 DDG. Geschlossene Beta.</p>

        <article className="legal-prose mt-8">
          <h2>Anbieter</h2>
          <p>
            Zouhair Ijaad<br />
            [STRASSE UND HAUSNUMMER]<br />
            [PLZ] Hamburg-Langenhorn<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:ijd.zouh@yahoo.com">ijd.zouh@yahoo.com</a>
          </p>

          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>Zouhair Ijaad (Anschrift wie oben)</p>

          <h2>Umsatzsteuer</h2>
          <p>Als Kleinunternehmer gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.</p>

          <h2>Status</h2>
          <p>
            Diese Anwendung befindet sich aktuell in einer geschlossenen Beta-Phase.
            Es werden keine kommerziellen Zahlungen abgewickelt.
          </p>

          <p>
            <Link to="/datenschutz">Datenschutzerklärung</Link>
          </p>
        </article>
      </main>
      <PublicSiteFooter />
    </div>
  )
}

/*
Anleitung für Zouhair:
1. STRASSE UND HAUSNUMMER durch deine echte Adresse ersetzen
2. PLZ durch deine echte PLZ ersetzen
3. Diesen Kommentar entfernen
4. Erst DANN committen und pushen (dieser Entwurf darf lokal committet werden)

Kleinunternehmer-Status: du hast bestätigt, dass du unter 22.000 Euro Jahresumsatz erwartest.
Falls du doch eine USt-IdNr. haben solltest, tausche den Umsatzsteuer-Absatz aus.
*/
