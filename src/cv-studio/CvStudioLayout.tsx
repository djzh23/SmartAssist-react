import { Link, Outlet } from 'react-router-dom'
import StandardPageContainer from '../components/layout/StandardPageContainer'

export default function CvStudioLayout() {
  return (
    <StandardPageContainer className="py-4 text-stone-100">
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
        <Link
          to="/cv-studio"
          className="text-sm font-medium text-primary-light transition-colors hover:text-white"
        >
          ← CV.Studio Übersicht
        </Link>
      </div>
      <Outlet />
    </StandardPageContainer>
  )
}
