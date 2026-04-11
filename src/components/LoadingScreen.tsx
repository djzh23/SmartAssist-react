import { Loader2 } from 'lucide-react'
import { IconHubIcon } from './ui/IconHubIcon'

export default function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f5f6fb]">
      <div className="flex items-center gap-2">
        <IconHubIcon name="lightning" className="h-7 w-7 shrink-0" />
        <span className="text-xl font-bold text-slate-800">PrivatePrep</span>
      </div>
      <Loader2 size={24} className="animate-spin text-primary" />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  )
}
