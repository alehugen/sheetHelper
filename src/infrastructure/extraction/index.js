import {
  SourceKind,
  UnsupportedFileError,
} from '@/application/ports/TextExtractor'

import { createOcrTextExtractor, extractScannedPdf } from './OcrTextExtractor'
import { createPdfTextExtractor } from './PdfTextExtractor'

export const ACCEPTED_TYPES = 'application/pdf,image/png,image/jpeg,image/webp'

export function createReceiptTextExtractor() {
  const pdf = createPdfTextExtractor()
  const ocr = createOcrTextExtractor()

  return {
    supports: (file) => pdf.supports(file) || ocr.supports(file),

    async extract(file, { onProgress } = {}) {
      if (pdf.supports(file)) {
        const result = await pdf.extract(file, {
          onProgress: (ratio) => onProgress?.(ratio * 0.4),
        })

        if (result.kind !== SourceKind.PDF_SCAN) {
          onProgress?.(1)
          return result
        }

        return extractScannedPdf(file, {
          onProgress: (ratio) => onProgress?.(0.4 + ratio * 0.6),
        })
      }

      if (ocr.supports(file)) {
        return ocr.extract(file, { onProgress })
      }

      throw new UnsupportedFileError(file)
    },

    dispose: () => ocr.dispose(),
  }
}
