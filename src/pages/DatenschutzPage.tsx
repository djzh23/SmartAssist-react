import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

const CONTACT_EMAIL = 'zn.connec.team@gmail.com'
const RIGHTS_EMAIL = 'ijd.zouh@yahoo.com'

export default function DatenschutzPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-8 text-stone-300 sm:pt-10">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Datenschutzerklärung</h1>
        <p className="text-sm text-stone-500">Datenschutzerklärung gemäß DSGVO. Stand: September 2026</p>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm leading-relaxed text-amber-100">
          Auftragsverarbeitungsverträge (AVV) mit den unten genannten Diensten sind durch uns noch nicht
          bestätigt. Dieser Text beschreibt den tatsächlichen Datenfluss. Er ist kein Nachweis, dass alle
          gesetzlichen Verträge schon unterschrieben sind, und keine Aussage über vollständige Anonymität
          oder anwaltliche Prüfung.
        </div>

        <article className="legal-prose mt-8">
          <h2>Verantwortlicher</h2>
          <p>Verantwortlich im Sinne der Datenschutzgrundverordnung ist:</p>
          <p>
            Zouhair Ijaad
            <br />
            Langenhorn 22415 Hamburg
            <br />
            Deutschland
          </p>
          <p>
            E-Mail:
            {' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <br />
            Support-Anfragen:
            {' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>

          <h2>Zwecke der Verarbeitung</h2>
          <p>
            PrivatePrep ist eine Plattform zur KI-gestützten Analyse von Stellenanzeigen. Die Verarbeitung
            dient:
          </p>
          <ul>
            <li>der Authentifizierung von Nutzern und dem Betrieb der Nutzerkonten</li>
            <li>
              der Analyse von Lebensläufen und Stellenanzeigen, um eine Passung zu bewerten und
              Formulierungsvorschläge zu liefern
            </li>
            <li>der Bereitstellung einer Job-Inbox über die Web-App und die optionale Browser-Extension</li>
            <li>dem Schutz der Plattform vor Missbrauch</li>
            <li>dem Versand optionaler Update-Nachrichten, nur bei ausdrücklicher Anmeldung</li>
          </ul>

          <h2>Rechtsgrundlagen</h2>
          <p>
            Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) für die Bereitstellung der Plattform und die
            Analyse-Funktion.
          </p>
          <p>
            Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) für den Newsletter-Versand und die freiwillige
            Speicherung von Stellenanzeigen in der Inbox.
          </p>
          <p>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) für Sicherheits-Logs, Missbrauchsschutz
            und, soweit Pirsch eingeschaltet ist, eine cookielose Reichweitenmessung.
          </p>

          <h2>Welche Daten werden verarbeitet</h2>
          <p>Bei der Nutzung von PrivatePrep verarbeite ich folgende Kategorien personenbezogener Daten:</p>
          <ul>
            <li>
              <strong>Kontodaten:</strong>
              {' '}
              deine E-Mail-Adresse und ein von Clerk vergebener Nutzer-Identifier.
              Passwörter verwaltet ausschließlich Clerk. Sie sind für mich nicht einsehbar.
            </li>
            <li>
              <strong>Karriereprofil:</strong>
              {' '}
              Berufsfeld, Skills, Erfahrung, Ausbildung, Sprachen, optionale
              Story und eine optionale KI-Zusammenfassung.
            </li>
            <li>
              <strong>Lebenslauf-Text:</strong>
              {' '}
              bei Upload und Analyse wird der Text einmalig an Groq
              übermittelt. Auf unseren Servern speichern wir den Volltext nicht, nur einen SHA-256-Prüfwert
              und die Zeichenzahl. Auf diesem Gerät bleibt der Text im Browser (localStorage, alle Tabs),
              bis du die Website-Daten löschst.
            </li>
            <li>
              <strong>Job-Anzeigen in der Inbox:</strong>
              {' '}
              wenn du Stellen über die Browser-Extension oder
              manuell speicherst: Titel, Firma, Standort, Quell-URL und Anzeigentext, bis du sie löschst
              oder analysierst.
            </li>
            <li>
              <strong>Analyse-Reports:</strong>
              {' '}
              ein Bericht zu einer Inbox-Stelle liegt in deinem Konto. Eine
              Analyse ohne Inbox-Stelle bleibt in diesem Browser (sessionStorage), bis der Tab geschlossen
              wird.
            </li>
            <li>
              <strong>Nutzungszähler:</strong>
              {' '}
              Tageslimit und grobe Token-Zähler für den Betrieb.
            </li>
            <li>
              <strong>Zahlungsdaten:</strong>
              {' '}
              über Stripe, aktuell im Test-Modus. Keine echten Kartenzahlungen
              über uns.
            </li>
            <li>
              <strong>Nutzungs-Statistiken:</strong>
              {' '}
              anonyme Seitenaufrufe über Pirsch, nur wenn der
              Analytics-Code gesetzt ist. Keine Cookies, keine Lebenslauf-Analyse.
            </li>
          </ul>

          <h2>Eingesetzte Auftragsverarbeiter und Drittdienste</h2>
          <p>
            Für den Betrieb setze ich die folgenden Dienstleister ein. Google Analytics und Google Gemini
            werden nicht genutzt. Geeignete Garantien für US-Übermittlungen (Standardvertragsklauseln oder
            EU-US Data Privacy Framework) müssen über die Verträge der Anbieter bestätigt werden.
          </p>

          <details open>
            <summary>Clerk, Inc., USA</summary>
            <p>
              Nutzerauthentifizierung und Kontoverwaltung. Verarbeitet: E-Mail-Adresse, Login-Zeitpunkte,
              Nutzer-Identifier. Drittlandtransfer in die USA.
            </p>
          </details>
          <details>
            <summary>Supabase, Inc., USA</summary>
            <p>
              PostgreSQL-Datenbank für Profil, Prüfwert, Zeichenzahl, Inbox und Nutzungszähler. Kein
              Lebenslauf-Volltext. Server-Standort laut Anbieter: EU (Frankfurt). Drittlandtransfer in die
              USA möglich über den Unternehmenssitz.
            </p>
          </details>
          <details>
            <summary>Groq, Inc., USA</summary>
            <p>
              KI-Inferenz für Analyse, PDF-Erkennung und optionale Zusammenfassung. Verarbeitet: Text des
              Lebenslaufs und der Stellenanzeige während der Anfrage. Kein festes Modell-Label in dieser
              Erklärung, weil sich das Modell ändern kann. Drittlandtransfer in die USA.
            </p>
          </details>
          <details>
            <summary>Render Services, Inc., USA</summary>
            <p>Hosting der Programmierschnittstelle. Drittlandtransfer in die USA.</p>
          </details>
          <details>
            <summary>Vercel Inc., USA</summary>
            <p>Hosting der Website. Drittlandtransfer in die USA.</p>
          </details>
          <details>
            <summary>Stripe Payments Europe, Ltd., Irland, und Stripe, Inc., USA</summary>
            <p>Zahlungsabwicklung. Aktuell Test-Modus, keine echten Zahlungen.</p>
          </details>
          <details>
            <summary>Buttondown LLC, USA</summary>
            <p>
              E-Mail-Versand für die freiwillige Update-Anmeldung, nur wenn das Newsletter-Formular mit
              einem eingebetteten Dienst aktiv ist. Sonst öffnet sich nur eine Mailto-Nachricht an uns.
              Verarbeitet dann: E-Mail-Adresse und Anmeldezeitpunkt. Drittlandtransfer in die USA.
            </p>
          </details>
          <details>
            <summary>Pirsch Analytics UG (haftungsbeschränkt), Deutschland</summary>
            <p>
              Anonyme Nutzungsstatistiken ohne Cookies, nur wenn der Analytics-Code gesetzt ist.
              Server-Standort: Deutschland. Kein Drittlandtransfer.
            </p>
          </details>

          <h2>Browser-Extension</h2>
          <p>
            PrivatePrep bietet optional eine Browser-Extension für Chrome und andere Chromium-Browser an.
            Die Nutzung ist freiwillig und keine Voraussetzung für die Web-Plattform.
          </p>
          <h3>Was die Extension macht</h3>
          <p>
            Die Extension liest den Text einer aktiven Stellenanzeige (LinkedIn, StepStone oder eine andere
            Job-Seite), wenn du auf das Extension-Icon klickst. Der extrahierte Text wird an dein
            PrivatePrep-Konto gesendet und in deiner Inbox gespeichert.
          </p>
          <h3>Welche Berechtigungen die Extension anfordert</h3>
          <ul>
            <li>
              <strong>activeTab:</strong>
              {' '}
              Zugriff auf die aktuell geöffnete Seite, nur beim Klick auf das Icon
            </li>
            <li>
              <strong>storage:</strong>
              {' '}
              lokale Speicherung technischer Einstellungen
            </li>
            <li>
              <strong>cookies:</strong>
              {' '}
              Lesezugriff auf den Anmelde-Cookie deiner PrivatePrep-Sitzung, um die
              Übertragung an dein Konto zu authentifizieren
            </li>
            <li>
              <strong>host_permissions</strong>
              {' '}
              für betweenatna.de und LinkedIn: Kommunikation mit dem Backend
              und zuverlässigere Erkennung auf LinkedIn-Job-Seiten
            </li>
          </ul>
          <h3>Was die Extension nicht macht</h3>
          <ul>
            <li>kein Zugriff auf andere Browser-Tabs oder die Browser-History</li>
            <li>keine dauerhafte Speicherung personenbezogener Daten im Browser außer technischer Einstellungen</li>
            <li>keine Übertragung an Dritte außer dem PrivatePrep-Backend</li>
            <li>keine automatische Erfassung ohne dein Klicken auf das Icon</li>
          </ul>
          <p>
            Extrahierte Anzeigen liegen in deiner persönlichen Inbox. Zugriff hast nur du mit deinem
            angemeldeten Konto. Mehr zur Installation steht auf der
            {' '}
            <Link to="/erweiterung">Seite zur Browser-Erweiterung</Link>
            .
          </p>

          <h2>Cookies und lokaler Speicher</h2>
          <p>Die Website verwendet folgende technisch notwendige Cookies und ähnliche Techniken:</p>
          <ul>
            <li>
              <strong>Clerk-Session-Cookies:</strong>
              {' '}
              Anmeldung und Sitzung, von Clerk verwaltet, bis Logout
              oder Sitzungsende. Die Extension liest diesen Cookie, um dich beim Speichern von Jobs zu
              authentifizieren.
            </li>
            <li>
              <strong>localStorage:</strong>
              {' '}
              Lebenslauf-Text auf diesem Gerät und UI-Einstellungen (zum Beispiel
              Inbox-Filter). Bleibt, bis du die Website-Daten löschst.
            </li>
            <li>
              <strong>sessionStorage:</strong>
              {' '}
              Analysebericht ohne Inbox-Stelle, bis der Tab geschlossen wird.
            </li>
          </ul>
          <p>Es werden keine Tracking-Cookies oder Marketing-Cookies gesetzt.</p>

          <h2>Speicherdauer</h2>
          <ul>
            <li>Kontodaten: solange dein Konto aktiv ist. Bei Kontolöschung: Löschung der zugehörigen Daten.</li>
            <li>
              Lebenslauf-Volltext auf unseren Servern: nicht dauerhaft. Es bleiben Prüfwert und Zeichenzahl.
            </li>
            <li>Lebenslauf-Text im Browser: auf diesem Gerät, bis du die Website-Daten löschst.</li>
            <li>Inbox-Einträge: bis du sie löschst.</li>
            <li>Inbox-Reports: solange das Konto aktiv ist und du sie nicht löschst.</li>
            <li>Analysebericht ohne Inbox: bis der Tab geschlossen wird.</li>
            <li>Sicherheits-Logs: in der Regel wenige Wochen, soweit der Host sie vorhält.</li>
            <li>Newsletter-Anmeldungen: bis zum Widerruf.</li>
          </ul>

          <h2>Deine Rechte</h2>
          <p>Du hast folgende Rechte bezüglich deiner personenbezogenen Daten:</p>
          <ul>
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
          </ul>
          <p>
            Anfragen zur Ausübung deiner Rechte kannst du per E-Mail an
            {' '}
            <a href={`mailto:${RIGHTS_EMAIL}`}>{RIGHTS_EMAIL}</a>
            {' '}
            richten. Ich beantworte Anfragen innerhalb der gesetzlichen Frist.
          </p>
          <h3>Kontolöschung</h3>
          <p>
            Eine Konto-Löschen-Funktion in der App ist in Vorbereitung. Bis dahin: schreib eine kurze
            E-Mail an
            {' '}
            <a href={`mailto:${RIGHTS_EMAIL}`}>{RIGHTS_EMAIL}</a>
            {' '}
            mit deiner Konto-E-Mail-Adresse. Ich lösche
            Konto und zugehörige Daten und bestätige die Löschung per E-Mail.
          </p>

          <h2>Recht auf Beschwerde bei einer Aufsichtsbehörde</h2>
          <p>
            Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist:
          </p>
          <p>
            Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit
            <br />
            Ludwig-Erhard-Straße 22, 20459 Hamburg
            <br />
            Website:
            {' '}
            <a href="https://datenschutz-hamburg.de" rel="noopener noreferrer">
              https://datenschutz-hamburg.de
            </a>
          </p>

          <h2>Änderungen dieser Datenschutzerklärung</h2>
          <p>
            Diese Erklärung kann angepasst werden, wenn sich die Verarbeitung ändert oder neue
            Dienstleister hinzukommen. Die aktuelle Version ist unter
            {' '}
            <Link to="/datenschutz">betweenatna.de/datenschutz</Link>
            {' '}
            einsehbar. Bei wesentlichen Änderungen informiere ich aktive Nutzer per E-Mail, soweit eine
            Kontaktadresse vorliegt.
          </p>
          <p>
            Diese Seite behauptet nicht, dass Daten vollständig anonym, vollständig sicher oder
            anwaltsgeprüft sind.
          </p>

          <p>
            <Link to="/impressum">Impressum</Link>
          </p>
        </article>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
