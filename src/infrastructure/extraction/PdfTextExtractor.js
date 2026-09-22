import { ExtractionError, SourceKind } from '@/application/ports/TextExtractor'

import { loadPdfjs } from './pdfjs'

const MIN_CHARS_PER_PAGE = 40

function joinTextContent(items) {
  const lines = []
  let current = []
  let lastY = null

  for (const item of items) {
    if (!('str' in item)) continue
    const y = Math.round(item.transform[5])
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      lines.push(current.join(' ').trim())
      current = []
    }
    if (item.str) current.push(item.str)
    lastY = y
  }
  if (current.length) lines.push(current.join(' ').trim())

  return lines.filter(Boolean).join('\n')
}

export function createPdfTextExtractor() {
  return {
    supports: (file) => file.type === 'application/pdf',

    async extract(file, { onProgress } = {}) {
      const pdfjs = await loadPdfjs()
      const data = new Uint8Array(await file.arrayBuffer())

      let doc
      try {
        doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise
      } catch (error) {
        throw new ExtractionError('Não foi possível abrir o PDF.', error)
      }

      try {
        const pages = []
        for (let index = 1; index <= doc.numPages; index += 1) {
          const page = await doc.getPage(index)
          const content = await page.getTextContent()
          pages.push(joinTextContent(content.items))
          page.cleanup()
          onProgress?.(index / doc.numPages)
        }

        const text = pages.join('\n\n').trim()
        const density = text.replace(/\s/g, '').length / doc.numPages

        return {
          text,
          kind:
            density < MIN_CHARS_PER_PAGE
              ? SourceKind.PDF_SCAN
              : SourceKind.PDF_TEXT,
        }
      } finally {
        await doc.destroy()
      }
    },
  }
}
