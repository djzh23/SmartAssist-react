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
        'max-w-[min(100%,260px)] truncate rounded-full px-3 py-1 text-left text-xs font-medium transition-colors',
        active
          ? 'bg-teal-600 text-white hover:bg-teal-700'
          : 'bg-stone-800/90 text-stone-400 hover:bg-stone-700/90 hover:text-stone-200',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
