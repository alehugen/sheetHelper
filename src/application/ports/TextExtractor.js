export const SourceKind = {
  PDF_TEXT: 'pdf-text',
  PDF_SCAN: 'pdf-scan',
  IMAGE: 'image',
}

export class UnsupportedFileError extends Error {
  constructor(file) {
    super(`Formato não suportado: ${file?.name ?? 'arquivo'}`)
    this.name = 'UnsupportedFileError'
  }
}

export class ExtractionError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'ExtractionError'
    this.cause = cause
  }
}
