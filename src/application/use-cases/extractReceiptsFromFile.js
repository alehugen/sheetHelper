import { parseDocument } from '@/domain/receipt/parsing'

import { UnsupportedFileError } from '../ports/TextExtractor'

export function createExtractReceiptsFromFile({ textExtractor }) {
  return async function extractReceiptsFromFile(file, { onProgress } = {}) {
    if (!textExtractor.supports(file)) throw new UnsupportedFileError(file)

    const { text } = await textExtractor.extract(file, { onProgress })
    const { entries, statement } = parseDocument(text, {
      sourceFile: file.name,
    })

    return { entries, statement, rawText: text }
  }
}
