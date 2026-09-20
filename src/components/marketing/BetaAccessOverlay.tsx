import { useEffect, useState } from 'react'
import { SignOutButton } from '@clerk/clerk-react'
import { subscribeBetaAccessDenied, BETA_ACCESS_MESSAGE } from '../../api/betaAccess'

export function BetaAccessOverlay() {
  const [open, setOpen] = useState(false)

  useEffect(() => subscribeBetaAccessDenied(() => setOpen(true)), [])

  if (!open)
    return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-5"
      role="alertdialog"
      aria-labelledby="beta-access-title"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl border border-stone-600/40 bg-[#14110e] p-6 text-stone-100 shadow-landing-lg">
        <h2 id="beta-access-title" className="font-serif text-xl font-bold text-stone-50">
          Geschlossene Beta
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">
          {BETA_ACCESS_MESSAGE}
        </p>
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-amber-400 px-5 text-sm font-semibold text-stone-950"
          >
            Zur Startseite
          </button>
        </SignOutButton>
      </div>
    </div>
  )
}
