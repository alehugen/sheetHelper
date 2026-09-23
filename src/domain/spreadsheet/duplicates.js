import { fold } from '../shared/text.js'

import { Direction, targetColumn } from './ColumnMapping.js'

const MIN_NAME_PREFIX = 4

export const DuplicateLevel = {
  NONE: 'none',
  POSSIBLE: 'possible',
  CERTAIN: 'certain',
}

function normalizeName(value) {
  return fold(value)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function namesMatch(a, b) {
  const left = normalizeName(a)
  const right = normalizeName(b)
  if (!left || !right) return false
  if (left === right) return true

  const [short, long] =
    left.length <= right.length ? [left, right] : [right, left]
  return short.length >= MIN_NAME_PREFIX && long.startsWith(short)
}

function cents(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number * 100) : null
}

function normalizeId(value) {
  return fold(value).replace(/[^a-z0-9]/g, '') || null
}

export function toRecord(
  { date, amount, payerName, transactionId },
  reference,
) {
  return {
    reference,
    date: date || null,
    amount: cents(amount),
    name: payerName || null,
    id: normalizeId(transactionId),
  }
}

export function recordsFromSheet(rows, mapping) {
  const dateColumn = targetColumn(mapping.date)
  const nameColumn = targetColumn(mapping.payerName)
  const idColumn = targetColumn(mapping.transactionId)
  const creditColumn = targetColumn(mapping.amount, Direction.CREDIT)
  const debitColumn = targetColumn(mapping.amount, Direction.DEBIT)

  return rows.map(({ row, values }) =>
    toRecord(
      {
        date: dateColumn ? values[dateColumn] : null,
        amount: values[creditColumn] ?? values[debitColumn] ?? null,
        payerName: nameColumn ? values[nameColumn] : null,
        transactionId: idColumn ? values[idColumn] : null,
      },
      row,
    ),
  )
}

export function addToIndex(index, record) {
  if (record.id) {
    if (!index.byId.has(record.id)) index.byId.set(record.id, [])
    index.byId.get(record.id).push(record)
  }
  if (record.date && record.amount !== null) {
    const key = `${record.date}|${record.amount}`
    if (!index.byDateAmount.has(key)) index.byDateAmount.set(key, [])
    index.byDateAmount.get(key).push(record)
  }
  return index
}

export function buildIndex(records = []) {
  const index = { byId: new Map(), byDateAmount: new Map() }
  for (const record of records) addToIndex(index, record)
  return index
}

export function findDuplicate(record, index) {
  if (record.id && index.byId.has(record.id)) {
    return { level: DuplicateLevel.CERTAIN, matches: index.byId.get(record.id) }
  }

  if (!record.date || record.amount === null) {
    return { level: DuplicateLevel.NONE, matches: [] }
  }

  const matches =
    index.byDateAmount.get(`${record.date}|${record.amount}`) ?? []
  if (!matches.length) return { level: DuplicateLevel.NONE, matches: [] }

  const named = matches.filter((match) => namesMatch(match.name, record.name))
  return named.length
    ? { level: DuplicateLevel.CERTAIN, matches: named }
    : { level: DuplicateLevel.POSSIBLE, matches }
}
