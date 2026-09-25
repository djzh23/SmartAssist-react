import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

const CONTACT_EMAIL = 'zn.connec.team@gmail.com'

export default function ImpressumPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-8 text-stone-300 sm:pt-10">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Impressum</h1>
        <p className="text-sm text-stone-500">Angaben gemäß § 5 DDG</p>

        <article className="legal-prose mt-8">
          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            Zouhair Ijaad<br />
            Langenhorn<br />
            <span className="legal-address-placeholder">Langenhorn </span>
            <br />
            <span className="legal-address-placeholder">22415</span>
            {' '}
            Hamburg
            <br />
            Deutschland
          </p>
          <p>
            E-Mail:
            {' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p className="legal-address-note">
            Straße und Postleitzahl trägt der Betreiber selbst ein. Hier stehen bewusst Platzhalter.
          </p>

          <h2>Über dieses Angebot</h2>
          <p>
            PrivatePrep ist ein privates Projekt zur KI-gestützten Analyse von Stellenanzeigen für
            Bewerberinnen und Bewerber im deutschen Arbeitsmarkt. Das Angebot befindet sich in einer
            geschlossenen Beta. Den Free-Plan kannst du ohne Zahlung nutzen (1 Analyse pro Tag).
            Ein optionales Premium-Abo ist vorgesehen.
          </p>
          <p>
            Betreiber-Website:
            {' '}
            <a href="https://betweenatna.de" rel="noopener noreferrer">
              https://betweenatna.de
            </a>
          </p>

          <h2>Umsatzsteuer</h2>
          <p>
            Kleinunternehmer nach § 19 UStG. Es wird keine Umsatzsteuer ausgewiesen. Eine
            Umsatzsteuer-Identifikationsnummer nach § 27 a UStG liegt nicht vor.
          </p>

          <h2>Streitbeilegung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            {' '}
            <a href="https://ec.europa.eu/consumers/odr" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Ich bin nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach
            den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG bin ich als Diensteanbieter
            jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
            allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst
            ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
            von entsprechenden Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen
            Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für
            die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
            verantwortlich.
          </p>
          <p>
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
            überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine
            permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
            Anhaltspunkte einer Rechtsverletzung nicht zumutbar.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
            deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
            Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung
            des jeweiligen Autors.
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
