import { useState } from 'react'
import { Copy, Check, PenLine, ChevronDown } from 'lucide-react'
import type { BulletRewriteSuggestion } from '../../api/analyzeClient'
import AnalyzeAccordion from './AnalyzeAccordion'

interface Props {
  bullets: BulletRewriteSuggestion[]
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function BulletCard({
  bullet,
  index,
  copied,
  onCopy,
}: {
  bullet: BulletRewriteSuggestion
  index: number
  copied: boolean
  onCopy: () => void
}) {
  return (
    <article className="rounded-2xl border border-stone-600/40 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Ursprünglich</p>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-600/50 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-stone-300 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/50"
          aria-label={copied ? 'Kopiert' : 'Vorschlag kopieren'}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
      <p className="mt-1 text-sm text-stone-400">{bullet.originalBullet}</p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-400/90">Umformuliert</p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-stone-50">{bullet.rewrittenBullet}</p>
      {bullet.reasoning ? (
        <p className="mt-2 text-xs leading-relaxed text-stone-500">{bullet.reasoning}</p>
      ) : null}
      <span className="sr-only">Vorschlag {index + 1}</span>
    </article>
  )
}

export default function AnalyzeBulletRewrites({ bullets }: Props) {
  const [copied, setCopied] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const count = bullets.length
  const desktopVisible = showAll ? bullets : bullets.slice(0, 1)
  const remaining = Math.max(0, count - 1)

  const handleCopy = async (index: number, text: string) => {
    const ok = await copyText(text)
    if (!ok) return
    setCopied(index)
    window.setTimeout(() => setCopied(current => (current === index ? null : current)), 1600)
  }

  if (count === 0) return null

  return (
    <>
      <div className="mt-3 lg:hidden">
        <AnalyzeAccordion
          title="Formulierungen"
          subtitle={count === 1 ? '1 Bullet-Vorschlag bereit' : `${count} Bullet-Vorschläge bereit`}
          icon={<PenLine className="h-4 w-4" />}
        >
          <ul className="space-y-3">
            {bullets.map((b, i) => (
              <li key={`${b.rewrittenBullet}-${i}`}>
                <BulletCard
                  bullet={b}
                  index={i}
                  copied={copied === i}
                  onCopy={() => void handleCopy(i, b.rewrittenBullet)}
                />
              </li>
            ))}
          </ul>
        </AnalyzeAccordion>
      </div>
      <section className="mt-5 hidden lg:block" aria-label="Formulierungs-Vorschläge">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-50">Formulierungs-Vorschläge</h2>
          <p className="text-xs text-stone-500">
            {count === 1
              ? '1 Bullet basierend auf deinem Lebenslauf'
              : `${count} Bullets basierend auf deinem Lebenslauf`}
          </p>
        </div>
        <ul className="space-y-3">
          {desktopVisible.map((b, i) => (
            <li key={`${b.rewrittenBullet}-${i}`}>
              <BulletCard
                bullet={b}
                index={i}
                copied={copied === i}
                onCopy={() => void handleCopy(i, b.rewrittenBullet)}
              />
            </li>
          ))}
        </ul>
        {remaining > 0 && !showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-stone-600/40 bg-app-surface/90 px-4 py-3 text-sm text-stone-300 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/50"
          >
            <span>{remaining === 1 ? '1 weiteren Vorschlag anzeigen' : `${remaining} weitere Vorschläge anzeigen`}</span>
            <ChevronDown className="h-4 w-4 text-stone-500" aria-hidden />
          </button>
        ) : null}
      </section>
    </>
  )
}
