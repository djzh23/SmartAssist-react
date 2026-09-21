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
    <article>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">
          CV-Formulierungsvorschlag
        </p>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e0d0] bg-white px-2 py-1 text-[11px] font-medium text-[#4a4238] hover:border-[#d97757] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97757]/50"
          aria-label={copied ? 'Kopiert' : 'Vorschlag kopieren'}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#5e7a5c]" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
      <div className="rounded-xl bg-[#faf7f0] px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">Vorher</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#6e665e]">{bullet.originalBullet}</p>
      </div>
      <div className="mt-3 rounded-lg border-l-[3px] border-[#d97757] bg-[rgba(217,119,87,0.06)] px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#b45539]">Nachher</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#1a1613]">{bullet.rewrittenBullet}</p>
      </div>
      {bullet.reasoning ? (
        <div className="mt-3.5 flex gap-3 rounded-[10px] bg-[#f5f1eb] px-4 py-3.5">
          <p className="text-[13px] leading-relaxed text-[#4a4238]">
            <strong className="font-semibold text-[#b45539]">Warum das stärker ist:</strong>{' '}
            {bullet.reasoning}
          </p>
        </div>
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
      <div className="mt-6 lg:hidden">
        <AnalyzeAccordion
          title="Formulierungen"
          subtitle={count === 1 ? '1 Bullet-Vorschlag bereit' : `${count} Bullet-Vorschläge bereit`}
          icon={<PenLine className="h-4 w-4" />}
        >
          <ul className="space-y-6">
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
      <section className="mt-8 hidden lg:block" aria-label="Formulierungs-Vorschläge">
        <ul className="space-y-8">
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
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#e8e0d0] bg-[#faf7f0] px-4 py-3 text-sm text-[#4a4238] hover:border-[#d97757] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97757]/50"
          >
            <span>{remaining === 1 ? '1 weiteren Vorschlag anzeigen' : `${remaining} weitere Vorschläge anzeigen`}</span>
            <ChevronDown className="h-4 w-4 text-[#8a7f70]" aria-hidden />
          </button>
        ) : null}
      </section>
    </>
  )
}
