interface Props {
  active: boolean
  label: string
  onClick: () => void
}

export default function TogglePill({ active, label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-teal-600 text-white hover:bg-teal-700'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
