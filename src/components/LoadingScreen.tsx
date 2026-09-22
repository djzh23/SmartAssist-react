import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#1a1613]">
      <div className="flex items-end gap-2">
        <img src="/logo-mark.svg" alt="" className="pp-brand-mark h-7 w-7 translate-y-[2px]" width={28} height={28} />
        <span className="pp-wordmark text-xl">Private<span>Prep</span></span>
      </div>
      <Loader2 size={24} className="animate-spin text-[#d97757]" />
      <p className="text-sm text-zinc-400">Laden...</p>
    </div>
  )
}
