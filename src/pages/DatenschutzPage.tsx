import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#120c08] px-6 py-12 text-stone-300">
      <div className="mx-auto max-w-[720px]">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-300"
        >
          <ArrowLeft size={16} aria-hidden />
          Zurück
        </Link>
        <h1 className="mb-8 text-2xl font-bold text-stone-100">Datenschutzerklärung</h1>
      </div>
    </div>
  )
}
