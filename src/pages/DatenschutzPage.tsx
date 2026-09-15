import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#120c08] px-6 py-12 text-stone-300">
      <div className="mx-auto max-w-[720px]">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-300"
        >
          <ArrowLeft size={16} aria-hidden />
          Zurück
        </Link>
        <h1 className="mb-8 text-2xl font-bold text-stone-100">Datenschutzerklarung</h1>

        {/* TODO: Complete with full DSGVO-compliant privacy policy before going live */}
        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-2 font-semibold text-stone-200">1. Verantwortlicher</h2>
            <p className="text-stone-500 italic">
              [Vollstandige Kontaktdaten des Verantwortlichen bitte hier eintragen.]
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-stone-200">2. Erhobene Daten</h2>
            <p className="text-stone-400">
              PrivatePrep verarbeitet folgende personenbezogene Daten:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-400">
              <li>Anmeldedaten (E-Mail-Adresse) über Clerk</li>
              <li>Karriereprofil und Lebenslaufinformationen (freiwillig eingegeben)</li>
              <li>Stellenanzeigen, die Sie zur Analyse einreichen</li>
              <li>Nutzungsdaten (Anzahl der Analysen pro Tag)</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-stone-200">3. Zweck der Datenverarbeitung</h2>
            <p className="text-stone-400">
              Die Daten werden ausschliesslich zur Bereitstellung des Dienstes (Stellenanalyse, Profilabgleich)
              und zur Nutzerauthentifizierung verwendet.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-stone-200">4. Drittanbieter</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-stone-400">
              <li>Clerk (Authentifizierung) - USA/EU</li>
              <li>Supabase (Datenbank) - EU</li>
              <li>Groq (KI-Verarbeitung) - USA</li>
              <li>Stripe (Zahlungen) - USA</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-stone-200">5. Ihre Rechte</h2>
            <p className="text-stone-400">
              Sie haben das Recht auf Auskunft, Berichtigung, Loschung und Einschränkung der Verarbeitung
              Ihrer personenbezogenen Daten sowie das Recht auf Datenübertragbarkeit.
            </p>
            <p className="mt-2 text-stone-500 italic">
              [Kontaktadresse fur Datenschutzanfragen bitte hier eintragen.]
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
