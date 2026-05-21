// pdfjs-dist is a ~300 KB dependency. Loading it eagerly bloats the main bundle for
// every user, even though the PDF upload code path is only used inside the Interview
// Setup modal. Defer the import (and the matching worker URL) until the user actually
// triggers a PDF parse.

type PdfjsLib = typeof import('pdfjs-dist')

let cached: Promise<PdfjsLib> | null = null

function loadPdfjs(): Promise<PdfjsLib> {
  if (cached) return cached
  cached = import('pdfjs-dist').then(async (mod) => {
    const workerUrl = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).href
    mod.GlobalWorkerOptions.workerSrc = workerUrl
    return mod
  })
  return cached
}

/**
 * Extract plain text from a PDF file entirely in the browser.
 * No data ever leaves the user's machine.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // TextItem has .str; TextMarkedContent does not - filter with type guard
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
      .join(' ')

    pages.push(pageText)
  }

  return pages
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')   // collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n')   // max 2 consecutive newlines
    .trim()
}
