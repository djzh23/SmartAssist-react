import { Link } from 'react-router-dom'

/** Factual privacy note under CV upload. No anonymization claims. */
export default function CvPrivacyNotice() {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-stone-400/30 bg-app-parchmentDeep/80 px-3 py-2.5 text-[12px] leading-relaxed text-stone-700">
      <p className="font-semibold text-stone-900">Datenschutz-Hinweis</p>
      <p>
        Beim PDF-Upload und bei der Stellenanalyse wird der Lebenslauf-Text einmalig an unser KI-Modell
        übermittelt (Groq Inc., USA). Auf unseren Servern speichern wir den Text nicht, nur einen Prüfwert
        (Hash) und die Zeichenzahl. In diesem Browser bleibt der Text, bis du den Tab schließt. Der
        Analysebericht liegt ebenfalls nur in diesem Browser, nicht in deinem Konto auf dem Server.
      </p>
      <p>
        Bitte entferne vor dem Upload persönliche Kontaktdaten (Name, Adresse, Telefon, E-Mail) aus dem
        Lebenslauf. Für die Analyse reichen berufliche Fakten: Positionen, Zeiträume, Skills und Projekte.
      </p>
      <p>
        Zusätzlich entfernen wir vor der Übermittlung automatisch erkannte E-Mail-Adressen, Telefonnummern
        und URLs. Das ist ein Sicherheitsnetz, keine vollständige Anonymisierung.
      </p>
      <p>
        <Link to="/datenschutz" className="font-medium text-stone-900 underline decoration-stone-400 underline-offset-2">
          Datenschutzerklärung
        </Link>
      </p>
    </div>
  )
}
