import { parseDate, parseTime } from '../../shared/datetime.js'
import { formatDocument } from '../../shared/document.js'
import { parseAmount } from '../../shared/money.js'
import { onlyDigits, upperCase } from '../../shared/text.js'
import { createReceipt } from '../Receipt.js'
import { ReceiptType } from '../ReceiptType.js'
import { scoreKeywords } from '../parsing/labels.js'

const KEYWORDS = [
  ['extrato de conta corrente', 4],
  ['lancamentos', 2],
  ['dt. balancete', 3],
  ['saldo anterior', 2],
  ['ag. origem', 2],
]

const BANK = 'BANCO DO BRASIL'

const ENTRY = /^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/
const COLUMNS = /^\d{4}\s+\d{5}\s+\d{3}\s+/
const AMOUNT = /([\d.]+,\d{2})\s+([CD])(?=\s|$)/
const DETAIL = /^(\d{2}\/\d{2})\s+(\d{1,2}:\d{2})\s*(.*)$/
const TRAILING_DOCUMENT = /\s([\d][\d.]*)$/
const SKIP = /^(saldo anterior|s\s*a\s*l\s*d\s*o)$/i
const DETAIL_LOOKAHEAD = 4

function normalizeDocument(digits) {
  if (!digits) return null
  const clean = onlyDigits(digits)
  if (clean.length === 14 && clean.startsWith('000')) return clean.slice(3)
  if (clean.length === 11 || clean.length === 14) return clean
  return null
}

function receiptTypeFor(historico) {
  const text = historico.toLowerCase()
  if (text.includes('tarifa')) return ReceiptType.UNKNOWN
  if (text.includes('pix')) return ReceiptType.PIX
  if (text.includes('transfer')) return ReceiptType.TED
  return ReceiptType.UNKNOWN
}

function accountHolder(lines) {
  for (const line of lines) {
    const match = line.match(/conta corrente\s+[\d-]+\s+(.+)$/i)
    if (match) return upperCase(match[1])
  }
  return null
}

function readEntry(line) {
  const entry = line.match(ENTRY)
  if (!entry) return null

  const rest = entry[2].replace(COLUMNS, '')
  const amount = rest.match(AMOUNT)
  if (!amount) return null

  let historico = rest.slice(0, amount.index).trim()
  let document = null

  const trailing = historico.match(TRAILING_DOCUMENT)
  if (trailing) {
    document = trailing[1]
    historico = historico.slice(0, trailing.index).trim()
  }

  if (SKIP.test(historico)) return null

  return {
    date: parseDate(entry[1]),
    historico,
    document,
    amount: parseAmount(amount[1]),
    credit: amount[2] === 'C',
  }
}

function readDetail(line, year) {
  const detail = line?.match(DETAIL)
  if (!detail) return null

  const rest = detail[3].trim()
  const leading = rest.match(/^(\d{6,})\s*(.*)$/)
  const name = upperCase(leading ? leading[2] : rest)

  return {
    date: parseDate(`${detail[1]}/${year}`),
    time: parseTime(detail[2]),
    document: normalizeDocument(leading?.[1]),
    name: /\p{L}/u.test(name) ? name : null,
  }
}

function findDetail(lines, start, year) {
  for (
    let i = start;
    i < Math.min(lines.length, start + DETAIL_LOOKAHEAD);
    i += 1
  ) {
    if (ENTRY.test(lines[i])) return null
    const detail = readDetail(lines[i], year)
    if (detail) return detail
  }
  return null
}

export const bbStatementParser = {
  id: 'bb-extrato',

  score(text) {
    return scoreKeywords(text, KEYWORDS)
  },

  parse(lines, context = {}) {
    const holder = accountHolder(lines)
    const receipts = []

    for (let i = 0; i < lines.length; i += 1) {
      const entry = readEntry(lines[i])
      if (!entry) continue

      const year = entry.date?.slice(0, 4) ?? ''
      const detail = findDetail(lines, i + 1, year)

      const counterparty = {
        name: detail?.name ?? null,
        document: detail?.document ? formatDocument(detail.document) : null,
        bank: null,
      }
      const owner = { name: holder, document: null, bank: BANK }
      const [payer, payee] = entry.credit
        ? [counterparty, owner]
        : [owner, counterparty]

      receipts.push(
        createReceipt({
          type: receiptTypeFor(entry.historico),
          date: detail?.date ?? entry.date,
          time: detail?.time ?? null,
          amount: entry.amount,
          payerName: payer.name,
          payerDocument: payer.document,
          payerBank: payer.bank,
          payeeName: payee.name,
          payeeDocument: payee.document,
          payeeBank: payee.bank,
          transactionId: entry.document,
          description: upperCase(entry.historico),
          sourceFile: context.sourceFile ?? null,
        }),
      )
    }

    return receipts
  },
}
