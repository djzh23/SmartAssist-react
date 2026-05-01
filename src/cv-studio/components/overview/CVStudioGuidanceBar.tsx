interface CVStudioGuidanceBarProps {
  onCreateResume: () => void
}

export default function CVStudioGuidanceBar({ onCreateResume }: CVStudioGuidanceBarProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#15100c]/75 px-4 py-3">
      <p className="text-sm text-stone-300">Organisiere deine Lebensläufe in Kategorien oder starte direkt neu.</p>
      <button
        type="button"
        onClick={onCreateResume}
        className="hidden rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400 sm:inline-flex"
      >
        Neuen Lebenslauf erstellen →
      </button>
    </div>
  )
}

