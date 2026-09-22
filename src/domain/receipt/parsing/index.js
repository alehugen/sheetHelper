import {
  createReceipt,
  filledFieldCount,
  missingRequiredFields,
} from '../Receipt.js'
import { RECEIPT_FIELDS } from '../ReceiptFields.js'
import { ReceiptType } from '../ReceiptType.js'
import { ReceiptWarning } from '../ReceiptWarning.js'
import { detectStatement } from '../statements/index.js'

import { extractReceipt } from './extract.js'
import { splitBody, toLines } from './labels.js'

function confidenceOf(receipt, score) {
  const fillable = RECEIPT_FIELDS.length - 1
  const filled = Math.max(0, filledFieldCount(receipt) - 1)
  const coverage = filled / fillable
  const detection = Math.min(1, score / 5)
  return Math.round((coverage * 0.7 + detection * 0.3) * 100) / 100
}

function warningsFor(receipt, confidence, extra = []) {
  const warnings = [...extra]
  if (confidence < 0.4) warnings.push(ReceiptWarning.LOW_CONFIDENCE)
  if (missingRequiredFields(receipt).length) {
    warnings.push(ReceiptWarning.MISSING_REQUIRED)
  }
  return warnings
}

export function parseReceipt(rawText, context = {}) {
  const lines = toLines(String(rawText ?? ''))

  if (!lines.length) {
    const receipt = createReceipt({ sourceFile: context.sourceFile ?? null })
    return {
      receipt,
      type: ReceiptType.UNKNOWN,
      confidence: 0,
      warnings: [ReceiptWarning.LOW_CONFIDENCE],
    }
  }

  const { values, warnings, score } = extractReceipt(splitBody(lines))
  const receipt = createReceipt({
    ...values,
    sourceFile: context.sourceFile ?? null,
  })
  const confidence = confidenceOf(receipt, score)

  return {
    receipt,
    type: receipt.type,
    confidence,
    warnings: warningsFor(receipt, confidence, warnings),
  }
}

export function parseDocument(rawText, context = {}) {
  const text = String(rawText ?? '')
  const lines = toLines(text)
  if (!lines.length) return { entries: [], statement: null }

  const statement = detectStatement(text)
  if (statement) {
    const receipts = statement.parser.parse(lines, context)
    if (receipts.length) {
      return {
        statement: statement.parser.id,
        entries: receipts.map((receipt) => {
          const confidence = confidenceOf(receipt, statement.score)
          return {
            receipt,
            confidence,
            warnings: warningsFor(receipt, confidence),
          }
        }),
      }
    }
  }

  const { receipt, confidence, warnings } = parseReceipt(text, context)
  return { statement: null, entries: [{ receipt, confidence, warnings }] }
}
