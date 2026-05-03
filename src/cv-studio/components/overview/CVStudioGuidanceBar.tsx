import AppCtaButton from '../../../components/ui/AppCtaButton'

interface CVStudioGuidanceBarProps {
  onCreateResume: () => void
}

export default function CVStudioGuidanceBar({ onCreateResume }: CVStudioGuidanceBarProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#15100c]/75 px-4 py-3">
      <p className="text-sm text-stone-300">Organisiere deine Lebensläufe in Kategorien oder starte direkt neu.</p>
      <AppCtaButton
        type="button"
        size="sm"
        onClick={onCreateResume}
        className="hidden sm:inline-flex"
      >
        Neuen Lebenslauf erstellen →
      </AppCtaButton>
    </div>
  )
}

