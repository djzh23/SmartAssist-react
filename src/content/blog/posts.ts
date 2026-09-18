import wieManEineStellenanzeige from './wie-man-eine-stellenanzeige-mit-ki-analysiert.md?raw'

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readingMinutes: number
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'wie-man-eine-stellenanzeige-mit-ki-analysiert',
    title: 'Wie man eine Stellenanzeige mit KI in 2 Minuten analysiert',
    description:
      'Stellenanzeige gegen den Lebenslauf halten: Match-Score, fehlende Skills und CV-Formulierungen mit PrivatePrep. Für jede Branche.',
    date: '2026-09-18',
    readingMinutes: 5,
    content: wieManEineStellenanzeige,
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug)
}
