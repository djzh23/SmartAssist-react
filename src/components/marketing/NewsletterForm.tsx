import { ArrowRight, Mail } from 'lucide-react'
import { newsletterEmbedUrl } from '../../config/env'

const FALLBACK_MAIL = 'mailto:zn.connec.team@gmail.com?subject=Updates%20PrivatePrep'
const ICON_STROKE = 1.75

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const embedUrl = newsletterEmbedUrl
  const ctaClass = compact ? 'pp-cta mt-4 w-full min-h-11 text-sm' : 'pp-cta mt-6 w-full'

  if (!embedUrl) {
    return (
      <a href={FALLBACK_MAIL} className={ctaClass}>
        <Mail className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
        Anmelden für Updates
        <ArrowRight className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
      </a>
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
      className="text-left"
    >
      <label htmlFor="bd-email" className="sr-only">E-Mail für Updates</label>
      <div className="relative">
        <Mail
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]"
          strokeWidth={ICON_STROKE}
          aria-hidden
        />
        <input
          type="email"
          name="email"
          id="bd-email"
          required
          autoComplete="email"
          placeholder="deine@email.de"
          className="pp-input"
        />
      </div>
      <label className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-[#A8A8A8]">
        <input
          type="checkbox"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-[#FBBF24]"
        />
        <span>
          Ich willige ein, dass meine E-Mail für die Beta-Ankündigung gespeichert wird. Widerruf jederzeit möglich.
        </span>
      </label>
      <button type="submit" className={ctaClass}>
        <Mail className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
        Anmelden für Updates
        <ArrowRight className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
      </button>
    </form>
  )
}
