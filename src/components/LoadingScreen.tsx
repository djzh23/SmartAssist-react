import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f5f6fb]">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        <span className="text-xl font-bold text-slate-800">PrivatePrep</span>
      </div>
      <Loader2 size={24} className="animate-spin text-primary" />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  )
}
