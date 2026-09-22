export const ReceiptWarning = {
  BARCODE_MISMATCH: 'barcode-mismatch',
  DATE_MISMATCH: 'date-mismatch',
  BARCODE_UNVERIFIED: 'barcode-unverified',
  LOW_CONFIDENCE: 'low-confidence',
  MISSING_REQUIRED: 'missing-required',
}

export function warningMessage(code, translate) {
  return translate ? translate(`warnings.${code}`) : code
}
