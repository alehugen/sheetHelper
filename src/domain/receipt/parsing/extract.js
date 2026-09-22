import { parseDate, parseTime } from '../../shared/datetime.js'
import { formatDocument, isValidDocument } from '../../shared/document.js'
import { parseAmount } from '../../shared/money.js'
import { fold, upperCase } from '../../shared/text.js'
import { ReceiptType } from '../ReceiptType.js'
import { ReceiptWarning } from '../ReceiptWarning.js'
import { codeAgreesWithAmount, describeBoletoCode } from '../boletoCode.js'

import {
  PATTERNS,
  findFirst,
  findLabeled,
  findLabeledDigits,
  guessName,
  scoreKeywords,
  sectionHeaderValue,
  sliceSection,
} from './labels.js'
import {
  FIELD_LABELS,
  SECTION_BREAKS,
  SECTIONS,
  TYPE_KEYWORDS,
} from './vocabulary.js'

const BREAK_SPEC = { labels: SECTION_BREAKS }

export function classify(text) {
  const ranked = TYPE_KEYWORDS.map(([type, keywords]) => ({
    type,
    score: scoreKeywords(text, keywords),
  })).sort((a, b) => b.score - a.score)

  return ranked[0].score > 0
    ? ranked[0]
    : { type: ReceiptType.UNKNOWN, score: 0 }
}

function hasExactHeader(lines, spec) {
  return lines.some((line) =>
    spec.exact.some((word) => fold(line) === fold(word)),
  )
}

function specFor(lines, role) {
  const spec = SECTIONS[role]
  const other = SECTIONS[role === 'payer' ? 'payee' : 'payer']
  const paired = hasExactHeader(lines, spec) && hasExactHeader(lines, other)
  return paired ? spec : { labels: spec.labels, exact: [] }
}

function extractParty(lines, role) {
  const spec = specFor(lines, role)
  const other = specFor(lines, role === 'payer' ? 'payee' : 'payer')
  const section = sliceSection(lines, spec, [other, BREAK_SPEC])
  if (!section.length) return { name: null, document: null, bank: null }

  const header = sectionHeaderValue(section[0], spec)

  const name =
    findLabeled(section, FIELD_LABELS.name) ||
    header ||
    guessName(section.slice(1))

  const labeled = findLabeled(section, FIELD_LABELS.document, {
    pattern: PATTERNS.document,
  })
  const loose = findFirst(section, PATTERNS.document)
  const document = labeled ?? (isValidDocument(loose) ? loose : null)

  const bank = findLabeled(section, FIELD_LABELS.bank)

  return {
    name: name ? upperCase(name) : null,
    document: document ? formatDocument(document) : null,
    bank: bank ? upperCase(bank) : null,
  }
}

function extractMoment(lines) {
  const rawDate =
    findLabeled(lines, FIELD_LABELS.date, { pattern: PATTERNS.date }) ??
    findFirst(lines, PATTERNS.date)

  const dateLine = rawDate ? lines.find((line) => line.includes(rawDate)) : null

  const rawTime =
    findLabeled(lines, FIELD_LABELS.time, { pattern: PATTERNS.time }) ??
    dateLine?.match(PATTERNS.time)?.[0] ??
    findFirst(lines, PATTERNS.time)

  return { date: parseDate(rawDate), time: parseTime(rawTime) }
}

function extractAmount(lines) {
  const patterned =
    findLabeled(lines, FIELD_LABELS.amount, { pattern: PATTERNS.amount }) ??
    findFirst(lines, PATTERNS.amount)
  if (patterned) return parseAmount(patterned)

  return parseAmount(findLabeled(lines, FIELD_LABELS.amount))
}

function extractTransactionId(body, footer, code) {
  return (
    findFirst(body, PATTERNS.endToEndId) ??
    code ??
    findLabeled(body, FIELD_LABELS.transactionId) ??
    findFirst(footer, PATTERNS.endToEndId) ??
    findLabeled(footer, FIELD_LABELS.transactionId) ??
    findFirst(body, PATTERNS.authCode)
  )
}

export function extractReceipt({ body, footer }) {
  const { type, score } = classify(body.join('\n'))

  const payer = extractParty(body, 'payer')
  const payee = extractParty(body, 'payee')
  const { date, time } = extractMoment(body)
  const amount = extractAmount(body)

  const code = findLabeledDigits(body, FIELD_LABELS.barcode, { minDigits: 30 })
  const decoded = describeBoletoCode(code)
  const agrees = codeAgreesWithAmount(decoded, amount)

  const warnings = []
  if (decoded && amount !== null && !agrees) {
    warnings.push(ReceiptWarning.BARCODE_MISMATCH)
  } else if (code && !decoded) {
    warnings.push(ReceiptWarning.BARCODE_UNVERIFIED)
  }

  const labelledDueDate = parseDate(
    findLabeled(body, FIELD_LABELS.dueDate, { pattern: PATTERNS.date }),
  )

  return {
    score,
    warnings,
    values: {
      type,
      date,
      time,
      dueDate: labelledDueDate ?? (agrees ? decoded.dueDate : null),
      amount,
      payerName: payer.name,
      payerDocument: payer.document,
      payerBank: payer.bank,
      payeeName: payee.name,
      payeeDocument: payee.document,
      payeeBank: payee.bank,
      transactionId: extractTransactionId(body, footer, code),
      description: findLabeled(body, FIELD_LABELS.description),
    },
  }
}
