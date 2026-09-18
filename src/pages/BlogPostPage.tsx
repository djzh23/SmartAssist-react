import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BlogArticleCta from '../components/blog/BlogArticleCta'
import { PublicSiteFooter, PublicSiteHeader } from '../components/marketing/PublicSiteChrome'
import { getBlogPost } from '../content/blog/posts'
import '../styles/landing.css'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getBlogPost(slug) : undefined

  if (!post) return <Navigate to="/blog" replace />

  return (
    <div className="landing-page-root min-h-screen text-stone-100">
      <PublicSiteHeader variant="page" />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-16 pt-24 sm:pt-28">
        <Link to="/blog" className="text-sm text-stone-500 transition hover:text-stone-300">
          Alle Artikel
        </Link>
        <p className="mt-6 text-[11px] text-stone-500">
          {formatDate(post.date)} · {post.readingMinutes} Min. Lesezeit
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-stone-50 sm:text-4xl">
          {post.title}
        </h1>
        <article className="blog-prose mt-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>
        <BlogArticleCta />
      </main>
      <PublicSiteFooter />
    </div>
  )
}
