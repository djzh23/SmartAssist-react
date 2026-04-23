import { Link, Outlet } from 'react-router-dom'

export default function CvStudioLayout() {
  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 text-stone-100 sm:px-4">
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
        <Link
          to="/cv-studio"
          className="text-sm font-medium text-primary-light transition-colors hover:text-white"
        >
          ← CV.Studio Übersicht
        </Link>
      </div>
      <Outlet />
    </div>
  )
}
