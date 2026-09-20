import { newsletterEmbedUrl } from '../../config/env'

const FALLBACK_MAIL = 'mailto:zouh.ijd@gmail.com?subject=Beta-Zugang%20PrivatePrep'

export function NewsletterForm() {
  const embedUrl = newsletterEmbedUrl

  if (!embedUrl) {
    return (
      <div className="rounded-2xl border border-stone-600/35 bg-white/[0.03] p-5 text-left">
        <p className="text-sm text-stone-400">
          Das Anmeldeformular ist noch nicht verbunden. Schreib uns direkt:
        </p>
        <a
          href={FALLBACK_MAIL}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-amber-400 px-5 text-sm font-semibold text-stone-950"
        >
          Beta-Zugang per E-Mail anfragen
        </a>
      </div>
    )
  }

  return (
    <form
      action={embedUrl}
      method="post"
      target="popupwindow"
      onSubmit={() => {
        window.open('about:blank', 'popupwindow', 'scrollbars=yes,width=600,height=620')
      }}
      className="rounded-2xl border border-stone-600/35 bg-white/[0.03] p-5 text-left"
    >
      <label htmlFor="bd-email" className="block text-sm font-medium text-stone-200">
        E-Mail für Beta-Zugang
      </label>
      <input
        type="email"
        name="email"
        id="bd-email"
        required
        autoComplete="email"
        placeholder="deine@email.de"
        className="mt-2 w-full rounded-xl border border-stone-600/50 bg-black/30 px-3 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-400/70 focus:outline-none"
      />
      <label className="mt-4 flex items-start gap-2 text-sm text-stone-400">
        <input
          type="checkbox"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-amber-400"
        />
        <span>
          Ich willige ein, dass meine E-Mail für die Beta-Ankündigung gespeichert wird. Widerruf jederzeit möglich.
        </span>
      </label>
      <button
        type="submit"
        className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-amber-400 px-5 text-sm font-semibold text-stone-950"
      >
        Beta-Zugang anfragen
      </button>
    </form>
  )
}
