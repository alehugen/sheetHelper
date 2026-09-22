import {
  createReceipt,
  filledFieldCount,
  missingRequiredFields,
} from '../Receipt.js'
import { RECEIPT_FIELDS } from '../ReceiptFields.js'
import { ReceiptType } from '../ReceiptType.js'
import { ReceiptWarning } from '../ReceiptWarning.js'
import { boletoParser } from './boleto.js'
import { genericParser } from './generic.js'
import { pixParser } from './pix.js'
import { splitBody, toLines } from './support.js'
import { tedParser } from './ted.js'

const PARSERS = [pixParser, tedParser, boletoParser]

function detectParser(text) {
  const ranked = PARSERS.map((parser) => ({
    parser,
    score: parser.score(text),
  })).sort((a, b) => b.score - a.score)

  const best = ranked[0]
  return best && best.score > 0
    ? { parser: best.parser, score: best.score }
    : { parser: genericParser, score: 0 }
}

export function parseReceipt(rawText, context = {}) {
  const text = String(rawText ?? '')
  const lines = toLines(text)

  if (!lines.length) {
    return {
      receipt: createReceipt({ sourceFile: context.sourceFile ?? null }),
      type: ReceiptType.UNKNOWN,
      confidence: 0,
      warnings: [ReceiptWarning.LOW_CONFIDENCE],
    }
  }

  const sections = splitBody(lines)
  const { parser, score } = detectParser(sections.body.join('\n'))
  const { values, warnings = [] } = parser.parse(sections)
  const receipt = createReceipt({
    ...values,
    sourceFile: context.sourceFile ?? null,
  })
  const confidence = confidenceOf(receipt, score)

  const allWarnings = [...warnings]
  if (confidence < 0.4) allWarnings.push(ReceiptWarning.LOW_CONFIDENCE)
  if (missingRequiredFields(receipt).length) {
    allWarnings.push(ReceiptWarning.MISSING_REQUIRED)
  }

  return { receipt, type: receipt.type, confidence, warnings: allWarnings }
}

function confidenceOf(receipt, score) {
  const fillable = RECEIPT_FIELDS.length - 1
  const filled = Math.max(0, filledFieldCount(receipt) - 1)
  const coverage = filled / fillable
  const detection = Math.min(1, score / 5)
  return Math.round((coverage * 0.7 + detection * 0.3) * 100) / 100
}
