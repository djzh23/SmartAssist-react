import * as pdfjsLib from 'pdfjs-dist'

// Point to the bundled worker - Vite handles the URL correctly
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

/**
 * Extract plain text from a PDF file entirely in the browser.
 * No data ever leaves the user's machine.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
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
