interface Props {
  active: boolean
  label: string
  /** Tooltip / vollständiger Text bei gekürzter Anzeige */
  title?: string
  onClick: () => void
}

export default function TogglePill({ active, label, title, onClick }: Props) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={[
        'max-w-[min(100%,220px)] truncate rounded-full border px-2.5 py-1 text-left text-[10px] font-medium leading-none transition-colors',
        active
          ? 'border-amber-600/50 bg-amber-950/45 text-amber-100/95'
          : 'border-white/10 bg-stone-900/65 text-stone-400 hover:border-white/20 hover:bg-stone-800/80 hover:text-stone-200',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
