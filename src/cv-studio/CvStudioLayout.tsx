import { Link, Outlet, useLocation } from 'react-router-dom'
import StandardPageContainer from '../components/layout/StandardPageContainer'

export default function CvStudioLayout() {
  const { pathname } = useLocation()
  const showBackLink = pathname !== '/cv-studio'

  return (
    <StandardPageContainer className="py-4 text-stone-100">
      {showBackLink ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
          <Link
            to="/cv-studio"
            className="text-sm font-medium text-primary-light transition-colors hover:text-white"
          >
            ← CV.Studio Übersicht
          </Link>
        </div>
      ) : null}
      <Outlet />
    </StandardPageContainer>
  )
}
