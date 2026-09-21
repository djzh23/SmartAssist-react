import { scoreLabel } from '../analyze/analyzeFormat'

interface Props {
  score: number
  size?: 150 | 190
  caption?: string
}

export default function ScoreRing({ score, size = 190, caption = 'von 5,0' }: Props) {
  const r = size === 190 ? 80 : 64
  const stroke = size === 190 ? 14 : 12
  const c = 2 * Math.PI * r
  const pct = Number.isFinite(score) ? Math.max(0, Math.min(1, score / 5)) : 0
  const offset = c * (1 - pct)
  const fontSize = size === 190 ? 60 : 44
  const value = scoreLabel(score)

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Gesamt-Match ${value} von 5,0`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f0e8d5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#d97757"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display leading-none text-[#1a1613]"
          style={{ fontSize }}
        >
          {value}
        </span>
        <span className={`mt-1 text-[12px] text-[#8a7f70] ${size === 190 ? 'tracking-[0.06em] uppercase' : ''}`}>
          {caption}
        </span>
      </div>
    </div>
  )
}
