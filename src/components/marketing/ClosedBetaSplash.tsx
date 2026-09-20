import { SignInButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { ClosedBetaBanner, PUBLIC_AFTER_AUTH } from './PublicSiteChrome'
import '../../styles/landing.css'

export const isBetaGateEnabled = import.meta.env.VITE_BETA_MODE === 'true'

export function ClosedBetaSplash() {
  return (
    <div className="landing-page-root flex min-h-screen flex-col text-stone-100">
      <ClosedBetaBanner />
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-5 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">PrivatePrep</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-stone-50">Geschlossene Beta</h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-400">
          Die Anwendung ist derzeit nur für eingeladene Tester offen. Wenn du Zugang hast, melde dich an.
          Anfragen an{' '}
          <a href="mailto:ijd.zouh@yahoo.com" className="text-amber-200 underline decoration-amber-200/40 underline-offset-2">
            ijd.zouh@yahoo.com
          </a>
          .
        </p>
        <SignInButton mode="modal" fallbackRedirectUrl={PUBLIC_AFTER_AUTH}>
          <button
            type="button"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-amber-400 px-5 text-sm font-semibold text-stone-950"
          >
            Anmelden
          </button>
        </SignInButton>
        <p className="mt-8 flex gap-4 text-xs text-stone-500">
          <Link to="/impressum" className="hover:text-stone-300">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-stone-300">Datenschutz</Link>
        </p>
      </main>
    </div>
  )
}
