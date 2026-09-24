import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

export default function DatenschutzPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-8 text-stone-300 sm:pt-10">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Datenschutzerklärung</h1>
        <p className="text-sm text-stone-500">Stand: 2026-09-20. Status: Beta-Version, wird vor Public Launch überarbeitet.</p>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm leading-relaxed text-amber-100">
          Auftragsverarbeitungsverträge (AVV) mit den unten genannten Diensten sind noch nicht durch uns
          bestätigt. Dieser Text beschreibt den tatsächlichen Datenfluss. Er ist kein Nachweis, dass alle
          gesetzlichen Verträge schon unterschrieben sind.
        </div>

        <article className="legal-prose mt-8">
          <h2>Verantwortlicher</h2>
          <p>
            Zouhair Ijaad<br />
            Deutschland<br />
            E-Mail: <a href="mailto:zn.connec.team@gmail.com">zn.connec.team@gmail.com</a>
          </p>
          <p>
            Die ladungsfähige Anschrift wird in Kürze ergänzt und an dieser Stelle veröffentlicht.
          </p>

          <h2>Zweck und Rechtsgrundlage der Datenverarbeitung</h2>
          <p>
            PrivatePrep verarbeitet Daten zur Bewerbungsanalyse. Rechtsgrundlage für den Kernbetrieb ist
            Artikel 6 Absatz 1 lit. b DSGVO (Vertragserfüllung). Für Reichweitenmessung, soweit Pirsch
            eingeschaltet ist, berechtigtes Interesse an einer datensparsamen Nutzungsstatistik
            (Art. 6 Abs. 1 lit. f DSGVO).
          </p>

          <h2>Verarbeitete Daten</h2>
          <ul>
            <li>Konto-Daten über Clerk (Nutzer-ID, je nach Einstellung E-Mail-Adresse)</li>
            <li>Karriereprofil: Berufsfeld, Skills, Erfahrung, Ausbildung, Sprachen, optionale Story, KI-Zusammenfassung</li>
            <li>Lebenslauf-Text bei Upload und Analyse: auf diesem Gerät in diesem Browser (alle Tabs). Auf dem Server: SHA-256-Prüfwert und Zeichenzahl</li>
            <li>Stellenausschreibungen, die du zur Analyse einfügst: nur für die laufende Anfrage</li>
            <li>Analysebericht: in diesem Browser (sessionStorage), nicht im Konto auf dem Server</li>
            <li>Nutzungszähler für das Tageslimit und grobe Token-Zähler</li>
            <li>Zahlungsdaten über Stripe, aktuell im Test-Modus, keine echten Kartenzahlungen über uns</li>
            <li>Aufrufstatistik über Pirsch, wenn der Analytics-Code gesetzt ist</li>
          </ul>

          <h2>Speicherdauer</h2>
          <ul>
            <li>Lebenslauf-Text auf unseren Servern: nicht dauerhaft. Es bleibt ein SHA-256-Hash zur Wiedererkennung sowie die Zeichenzahl.</li>
            <li>Lebenslauf-Text im Browser: auf diesem Gerät, bis du die Website-Daten löschst.</li>
            <li>Analysebericht im Browser: bis der Tab geschlossen wird oder du ihn ausblendest.</li>
            <li>Konto-Daten, Story und Profil-Angaben: bis zur Löschung deines Kontos.</li>
          </ul>

          <h2>Auftragsverarbeiter</h2>
          <p>
            Für den Betrieb setzen wir folgende Dienste ein. Google Gemini wird in dieser Version nicht genutzt.
          </p>

          <h3>Groq, Inc., 2700 Zanker Road, Suite 150, San Jose, CA 95134, USA</h3>
          <p>Zweck: KI-Inferenz für Analyse, PDF-Erkennung und optionale Zusammenfassung. Datenübermittlung: USA.</p>

          <h3>Clerk, Inc., 660 King Street, Unit 345, San Francisco, CA 94107, USA</h3>
          <p>Zweck: Anmeldung und Konto. Datenübermittlung: USA.</p>

          <h3>Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland, und Stripe, Inc., USA</h3>
          <p>Zweck: Zahlungsabwicklung. Aktuell Test-Modus, keine echten Zahlungen.</p>

          <h3>Render Services, Inc., USA</h3>
          <p>Zweck: Hosting der Programmierschnittstelle. Datenübermittlung: USA.</p>

          <h3>Vercel Inc., USA</h3>
          <p>Zweck: Hosting der Website. Datenübermittlung: USA.</p>

          <h3>Supabase, Inc.</h3>
          <p>Zweck: PostgreSQL-Datenbank für Profil, Hash und Nutzungszähler. Kein Lebenslauf-Text.</p>

          <h3>Pirsch (Emvi Software GmbH, Deutschland)</h3>
          <p>Zweck: Seitenaufrufe, wenn Analytics eingeschaltet ist. Keine Analyse des Lebenslaufs.</p>

          <p>
            Geeignete Garantien für US-Übermittlungen (Standardvertragsklauseln oder EU-US Data Privacy
            Framework) müssen über die Verträge der Anbieter bestätigt werden. AVVs/DPAs sind durch uns
            noch nicht abgelegt.
          </p>

          <h2>Deine Rechte</h2>
          <p>Du hast nach der DSGVO folgende Rechte:</p>
          <ul>
            <li>Auskunft über deine gespeicherten Daten (Art. 15)</li>
            <li>Berichtigung falscher Daten (Art. 16)</li>
            <li>Löschung deiner Daten (Art. 17)</li>
            <li>Einschränkung der Verarbeitung (Art. 18)</li>
            <li>Datenübertragbarkeit (Art. 20)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
            <li>Beschwerde bei einer Aufsichtsbehörde</li>
          </ul>
          <p>
            Für Deutschland zuständige Aufsichtsbehörde in Hamburg: Der Hamburgische Beauftragte für
            Datenschutz und Informationsfreiheit, Ludwig-Erhard-Str. 22, 20459 Hamburg.
          </p>

          <h2>Kontakt bei Datenschutz-Fragen</h2>
          <p>
            E-Mail: <a href="mailto:zn.connec.team@gmail.com">zn.connec.team@gmail.com</a>
          </p>

          <h2>Hinweis zur Beta-Phase</h2>
          <p>
            Diese Datenschutzerklärung ist eine Beta-Version. Vor dem Public Launch wird sie überarbeitet,
            unter anderem durch Prüfung mit einem Datenschutzgenerator wie e-recht24.de oder durch
            juristische Beratung. Diese Seite behauptet nicht, dass Daten vollständig anonym, vollständig
            sicher oder anwaltsgeprüft sind.
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
