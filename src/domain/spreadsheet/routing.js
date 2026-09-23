import { identifyBank } from '../shared/banks.js'
import { fold } from '../shared/text.js'

import { Direction } from './ColumnMapping.js'

const MIN_TOKEN = 3
const NOISE = new Set(['conta', 'banco', 'bco', 'ltda', 'sa', 'me', 'epp'])

export function nameTokens(value) {
  return fold(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_TOKEN && !NOISE.has(token))
}

function sharesToken(a, b) {
  const set = new Set(nameTokens(a))
  return nameTokens(b).some((token) => set.has(token))
}

export function inferSheetIndex(receipt, sheets) {
  const receiptBanks = [receipt?.payeeBank, receipt?.payerBank]
    .map(identifyBank)
    .filter(Boolean)
  if (!receiptBanks.length) return null

  const index = sheets.findIndex((sheet) => {
    const sheetBank = identifyBank(sheet.name)
    return sheetBank && receiptBanks.includes(sheetBank)
  })

  return index === -1 ? null : index
}

export function inferDirection(receipt, sheetName) {
  if (sharesToken(receipt?.payeeName, sheetName)) return Direction.CREDIT
  if (sharesToken(receipt?.payerName, sheetName)) return Direction.DEBIT
  return Direction.CREDIT
}
