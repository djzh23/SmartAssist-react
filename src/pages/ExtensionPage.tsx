import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import { appCtaButtonClasses } from '../components/ui/AppCtaButton'
import '../styles/landing.css'

const EXTENSION_ZIP_URL = '/downloads/privateprep-extension.zip'

export default function ExtensionPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-8 text-stone-300 sm:pt-10">
        <h1 className="mb-3 text-2xl font-bold text-stone-100">Browser-Erweiterung</h1>
        <p className="text-sm text-stone-500">
          Speichere Stellenanzeigen mit einem Klick direkt in deine PrivatePrep-Inbox, ohne Copy-Paste.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#3a332d] bg-[#232019] p-4">
          <a href={EXTENSION_ZIP_URL} download className={appCtaButtonClasses({ size: 'lg' })}>
            <Download size={16} aria-hidden />
            Erweiterung herunterladen (.zip)
          </a>
          <p className="text-xs text-stone-500">
            Version 0.1.4 · Beta, noch nicht im Chrome Web Store
          </p>
        </div>

        <article className="legal-prose mt-8">
          <h2>Was macht die Erweiterung?</h2>
          <p>
            Wenn du eine Stellenanzeige offen hast, speichert dir die Erweiterung Titel, Firma und den
            vollständigen Text der Anzeige mit einem Klick in deine PrivatePrep-Inbox. Du musst nichts
            markieren oder kopieren. Von dort aus kannst du die Stelle in Ruhe prüfen und analysieren
            lassen, wann immer du willst. Auf LinkedIn ist die Erkennung am zuverlässigsten. Auf anderen
            Job-Portalen (StepStone, Indeed und den meisten anderen) funktioniert es meistens ebenfalls
            gut, weil dort oft die gleichen standardisierten Auszeichnungen im Seitencode stecken, die
            die Erweiterung ausliest. Die Qualität kann dort aber schwanken, du kannst Titel, Firma und
            Text danach jederzeit in deiner Inbox nachbearbeiten.
          </p>

          <h2>Aktueller Stand: Beta</h2>
          <p>
            Die Erweiterung ist fertig nutzbar, steht aber noch nicht im Chrome Web Store. Die Installation
            läuft deshalb aktuell über den Entwicklermodus deines Browsers, siehe Anleitung unten. Das sieht
            technischer aus, als es ist, dauert aber nur eine Minute. Sobald die Erweiterung im Web Store
            gelistet ist, reicht ein einziger Klick, und diese Seite wird entsprechend aktualisiert.
          </p>

          <h2>Voraussetzungen</h2>
          <ul>
            <li>Chrome oder Edge auf dem Desktop (Windows, Mac oder Linux)</li>
            <li>Ein PrivatePrep-Konto, in das du im selben Browser eingeloggt bist</li>
          </ul>
          <p>
            Auf dem Handy funktioniert die Erweiterung nicht. Weder Android noch iOS unterstützen diese Art
            von Browser-Erweiterung in einer für echte Nutzer verfügbaren Form. Auf dem Handy nutzt du
            PrivatePrep einfach direkt über die Webseite und fügst den Anzeigentext manuell in{' '}
            <Link to="/analyze">Analyse</Link> oder deine <Link to="/inbox">Inbox</Link> ein. Das funktioniert
            genauso gut, nur eben ohne die automatische Übernahme von der Seite.
          </p>

          <h2>Installation, Schritt für Schritt</h2>
          <ol>
            <li>Oben auf dieser Seite auf "Erweiterung herunterladen" klicken. Die Datei landet als ZIP in deinem Download-Ordner.</li>
            <li>Die ZIP-Datei entpacken (Rechtsklick darauf, dann "Alle extrahieren" oder "Entpacken", je nach Betriebssystem).</li>
            <li>
              In Chrome oder Edge die Adresse <code>chrome://extensions</code> aufrufen (bei Edge:{' '}
              <code>edge://extensions</code>).
            </li>
            <li>Oben rechts den Schalter "Entwicklermodus" aktivieren.</li>
            <li>Auf "Entpackte Erweiterung laden" klicken.</li>
            <li>Den entpackten Ordner auswählen (den mit der Datei <code>manifest.json</code> darin).</li>
            <li>Fertig. Das PrivatePrep-Icon erscheint jetzt oben rechts in der Symbolleiste des Browsers.</li>
          </ol>
          <p>
            Der Browser zeigt bei so geladenen Erweiterungen manchmal einen Hinweis wie "Erweiterungen im
            Entwicklermodus". Das ist normal und kein Fehler, es weist nur darauf hin, dass die Erweiterung
            nicht aus dem offiziellen Store stammt.
          </p>

          <h2>So nutzt du sie</h2>
          <ol>
            <li>Bei PrivatePrep eingeloggt sein, im selben Browser.</li>
            <li>Eine Stellenanzeige öffnen, egal ob auf LinkedIn oder einem anderen Job-Portal.</li>
            <li>Auf das PrivatePrep-Icon in der Symbolleiste klicken.</li>
            <li>Auf "In PrivatePrep speichern" klicken.</li>
          </ol>
          <p>
            Die Stelle erscheint direkt danach in deiner <Link to="/inbox">Inbox</Link>, mit Status "Neu".
          </p>

          <h2>Was die Erweiterung liest, und was nicht</h2>
          <p>
            Die Erweiterung liest deine bestehende, eingeloggte PrivatePrep-Sitzung, um dich gegenüber
            dem Server zu authentifizieren. Den Inhalt einer Webseite liest sie ausschließlich in dem
            Moment, in dem du auf ihr Icon klickst, und nur auf der gerade aktiven Seite in diesem Tab,
            egal welches Portal das ist. Sie läuft nicht dauerhaft im Hintergrund mit und liest keine
            anderen Tabs. Auf LinkedIns Job-Seiten ist sie zusätzlich passiv aktiv, damit die Erkennung
            dort zuverlässiger klappt. Sie liest keine Passwörter, verfolgt dein Surfverhalten nicht und
            schickt die ausgelesenen Daten ausschließlich an PrivatePrep, nie an Dritte. Mehr dazu in der{' '}
            <Link to="/datenschutz">Datenschutzerklärung</Link>.
          </p>

          <h2>Bekannte Einschränkungen</h2>
          <ul>
            <li>
              LinkedIn wird am zuverlässigsten erkannt. Auf anderen Portalen funktioniert eine
              allgemeinere Erkennung, die Qualität kann dort schwanken.
            </li>
            <li>Noch nicht im Chrome Web Store, daher der Umweg über den Entwicklermodus.</li>
            <li>Kein Mobile-Support (siehe oben).</li>
          </ul>
        </article>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
