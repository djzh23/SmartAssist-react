import { Link } from 'react-router-dom'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

export default function DatenschutzPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-24 text-stone-300 sm:pt-28">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Datenschutzerklärung</h1>
        <p className="text-sm text-stone-500">Stand: 20. September 2026. Entwurf, nicht von einer Kanzlei geprüft.</p>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm leading-relaxed text-amber-100">
          Auftragsverarbeitungsverträge (AVV) mit den unten genannten Diensten sind noch nicht durch uns
          bestätigt. Dieser Text beschreibt den tatsächlichen Datenfluss. Er ist kein Nachweis, dass alle
          gesetzlichen Verträge schon unterschrieben sind.
        </div>

        <article className="legal-prose mt-8">
          <h2>1. Verantwortlicher</h2>
          <p>
            Name, Anschrift und E-Mail stehen im <Link to="/impressum">Impressum</Link>. Solange dort
            Platzhalter stehen, ist diese Erklärung unvollständig.
          </p>

          <h2>2. Welche Daten wir verarbeiten</h2>
          <ul>
            <li>Konto über Clerk: Nutzer-ID und je nach Einstellung E-Mail-Adresse.</li>
            <li>Karriereprofil: Berufsfeld, Skills, Erfahrung, Ausbildung, Sprachen, optionale Story, KI-Zusammenfassung.</li>
            <li>Lebenslauf-Text: nur im Browser (dieser Tab). Auf dem Server: SHA-256-Prüfwert und Zeichenzahl, kein CV-Text.</li>
            <li>Stellenanzeigen, die du zur Analyse einfügst: nur für die laufende Anfrage, nicht als Bericht in der Datenbank.</li>
            <li>Analysebericht: in diesem Browser (sessionStorage), nicht im Konto auf dem Server.</li>
            <li>Nutzungszähler für das Tageslimit und grobe Token-Zähler.</li>
            <li>Zahlungen über Stripe. Keine vollständigen Kartendaten auf unseren Servern.</li>
            <li>Aufrufstatistik über Pirsch, wenn der Analytics-Code gesetzt ist. Ohne Marketing-Cookies.</li>
          </ul>

          <h2>3. Wofür die Daten genutzt werden</h2>
          <p>
            Betrieb des Kontos, Stellenanalyse, optionale Profil-Zusammenfassung, Abrechnung und
            Missbrauchsschutz (Tageslimit). Rechtsgrundlage für den Kernbetrieb ist die Vertragserfüllung
            (Art. 6 Abs. 1 lit. b DSGVO). Für Reichweitenmessung, soweit eingesetzt, berechtigtes Interesse
            an einer datensparsamen Nutzungstatistik (Art. 6 Abs. 1 lit. f DSGVO).
          </p>

          <h2>4. Lebenslauf und KI</h2>
          <p>
            Beim PDF-Upload und bei der Stellenanalyse wird der Lebenslauf-Text einmalig an Groq Inc. (USA)
            geschickt. Danach speichern wir den Text nicht. Bitte entferne Name, Adresse, Telefon und E-Mail
            selbst, bevor du hochlädst. Zusätzlich streichen wir automatisch erkannte E-Mail-Adressen,
            Telefonnummern und URLs. Das ist ein Sicherheitsnetz, keine vollständige Anonymisierung und kein
            Namensfilter.
          </p>

          <h2>5. Auftragsverarbeiter</h2>
          <p>Für den Betrieb setzen wir folgende Dienstleister ein. Google Gemini wird in V1 nicht genutzt.</p>

          <h3>Groq, Inc., 2700 Zanker Road, Suite 150, San Jose, CA 95134, USA</h3>
          <p>Zweck: KI-Inferenz (Analyse, PDF-Erkennung, optionale Zusammenfassung). Drittland: USA.</p>

          <h3>Clerk, Inc., 660 King Street, Unit 345, San Francisco, CA 94107, USA</h3>
          <p>Zweck: Anmeldung und Konto. Drittland: USA.</p>

          <h3>Stripe Payments Europe, Ltd. (Irland) und Stripe, Inc. (USA)</h3>
          <p>Zweck: Abonnement und Zahlung. Kartendaten verarbeitet Stripe, nicht unser Server.</p>

          <h3>Render Services, Inc., USA</h3>
          <p>Zweck: Hosting der Programmierschnittstelle.</p>

          <h3>Vercel Inc., USA</h3>
          <p>Zweck: Hosting der Website.</p>

          <h3>Supabase, Inc.</h3>
          <p>Zweck: PostgreSQL-Datenbank für Profil, Hash, Nutzungszähler. Kein Lebenslauf-Text.</p>

          <h3>Pirsch (Emvi Software GmbH, Deutschland)</h3>
          <p>Zweck: Seitenaufrufe, wenn Analytics eingeschaltet ist. Keine Analyse des Lebenslaufs.</p>

          <p>
            Geeignete Garantien für US-Übermittlungen (Standardvertragsklauseln oder EU-US Data Privacy
            Framework) müssen über die Verträge der Anbieter bestätigt werden. TODO: AVVs/DPAs ablegen und
            hier verlinken.
          </p>

          <h2>6. Speicherdauer</h2>
          <ul>
            <li>Lebenslauf-Text auf dem Server: nicht. Hash und Zeichenzahl: bis du das Profil überschreibst oder das Konto gelöscht wird.</li>
            <li>Lebenslauf-Text im Browser: bis der Tab geschlossen wird.</li>
            <li>Analysebericht im Browser: bis der Tab geschlossen wird oder du ihn ausblendest.</li>
            <li>Profil und Konto: bis zur Löschung des Kontos.</li>
            <li>Zahlungsbelege: soweit gesetzlich vorgeschrieben.</li>
          </ul>

          <h2>7. Deine Rechte</h2>
          <p>
            Du kannst Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
            und Widerspruch verlangen. Kontaktweg: E-Mail aus dem Impressum, sobald eingetragen. Du kannst
            dich bei einer Aufsichtsbehörde beschweren, in der Regel am Wohnsitz. Für Hamburg: Hamburgische
            Beauftragte für Datenschutz und Informationsfreiheit, Ludwig-Erhard-Str. 22, 20459 Hamburg.
          </p>

          <h2>8. Keine Werbeversprechen</h2>
          <p>
            Diese Seite behauptet nicht, dass Daten vollständig anonym, vollständig sicher oder
            anwaltsgeprüft sind. Was oben steht, ist der aktuelle Stand der Anwendung.
          </p>
        </article>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
