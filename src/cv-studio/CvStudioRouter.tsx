import { Route, Routes } from 'react-router-dom'
import CvStudioLayout from './CvStudioLayout'
import CvStudioOverviewPage from './CvStudioOverviewPage'
import CvStudioEditorPage from './CvStudioEditorPage'
import CvStudioApplicationBasisPage from './CvStudioApplicationBasisPage'

export default function CvStudioRouter() {
  return (
    <Routes>
      <Route element={<CvStudioLayout />}>
        <Route index element={<CvStudioOverviewPage />} />
        <Route path="basis/:applicationId" element={<CvStudioApplicationBasisPage />} />
        <Route path="edit/:resumeId" element={<CvStudioEditorPage />} />
      </Route>
    </Routes>
  )
}
