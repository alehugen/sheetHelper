import { parseReceipt } from '@/domain/receipt/parsers'

import { UnsupportedFileError } from '../ports/TextExtractor'

export function createExtractReceiptFromFile({ textExtractor }) {
  return async function extractReceiptFromFile(file, { onProgress } = {}) {
    if (!textExtractor.supports(file)) throw new UnsupportedFileError(file)

    const { text } = await textExtractor.extract(file, { onProgress })

    const { receipt, confidence, warnings } = parseReceipt(text, {
      sourceFile: file.name,
    })

    return { receipt, confidence, warnings, rawText: text }
  }
}
