import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import '../styles/landing.css'

export default function DatenschutzPage() {
  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-24 text-stone-300 sm:pt-28">
        <h1 className="mb-8 text-2xl font-bold text-stone-100">Datenschutzerklärung</h1>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
