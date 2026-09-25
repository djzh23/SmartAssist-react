import { SignUpButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function BlogArticleCta() {
  const { isSignedIn } = useUser()

  return (
    <aside className="mt-12 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-[#1a120c] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">Nächster Schritt</p>
      <h2 className="mt-2 text-xl font-bold text-stone-50 sm:text-2xl">
        Nimm deine nächste Stellenanzeige und prüfe sie jetzt.
      </h2>
      <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-stone-400">
        1 Analyse pro Tag ist kostenlos. Du siehst den Match-Score, die Lücken und Formulierungen,
        bevor du Zeit in ein Anschreiben steckst.
      </p>
      <div className="mt-6">
        {isSignedIn ? (
          <Link
            to="/analyze"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 text-sm font-bold text-amber-950 sm:w-auto"
          >
            Zur Analyse
          </Link>
        ) : (
          <SignUpButton mode="modal" fallbackRedirectUrl="/analyze">
            <button
              type="button"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 text-sm font-bold text-amber-950 sm:w-auto"
            >
              Anzeige prüfen
            </button>
          </SignUpButton>
        )}
      </div>
    </aside>
  )
}
