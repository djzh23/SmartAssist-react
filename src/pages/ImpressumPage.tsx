import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ImpressumPage() {
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
        <h1 className="mb-8 text-2xl font-bold text-stone-100">Impressum</h1>

        {/* TODO: Fill in legal contact details before going live */}
        <section className="space-y-4 text-sm leading-relaxed">
          <div>
            <p className="font-semibold text-stone-200">Angaben gemäß § 5 TMG</p>
            <p className="mt-2 text-stone-500 italic">
              [Name und Anschrift des Betreibers bitte hier eintragen.]
            </p>
          </div>

          <div>
            <p className="font-semibold text-stone-200">Kontakt</p>
            <p className="mt-1 text-stone-500 italic">
              [E-Mail-Adresse bitte hier eintragen.]
            </p>
          </div>

          <div>
            <p className="font-semibold text-stone-200">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</p>
            <p className="mt-1 text-stone-500 italic">
              [Verantwortliche Person bitte hier eintragen.]
            </p>
          </div>

          <div>
            <p className="font-semibold text-stone-200">Haftungsausschluss</p>
            <p className="mt-1 text-stone-400">
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
