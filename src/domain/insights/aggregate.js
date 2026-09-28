import { bankLabel, identifyBank } from '../shared/banks.js'
import { Direction } from '../shared/direction.js'
import { normalizeName } from '../shared/text.js'

const DAY_MS = 86400000
const MONTH_THRESHOLD_DAYS = 31
const MAX_PERIODS = 400
const UNKNOWN = '__unknown__'
const OTHER = '__other__'

function amountOf(entry) {
  const value = Number(entry.receipt?.amount)
  return Number.isFinite(value) ? value : 0
}

function resolved(entries) {
  return entries.filter(
    (entry) =>
      entry.direction === Direction.CREDIT ||
      entry.direction === Direction.DEBIT,
  )
}

function ownSide(entry) {
  return entry.direction === Direction.DEBIT ? 'payer' : 'payee'
}

function counterSide(entry) {
  return entry.direction === Direction.DEBIT ? 'payee' : 'payer'
}

export function summarize(entries) {
  const usable = resolved(entries)
  const credit = usable
    .filter((entry) => entry.direction === Direction.CREDIT)
    .reduce((sum, entry) => sum + amountOf(entry), 0)
  const debit = usable
    .filter((entry) => entry.direction === Direction.DEBIT)
    .reduce((sum, entry) => sum + amountOf(entry), 0)

  return {
    credit,
    debit,
    net: credit - debit,
    count: usable.length,
    average: usable.length ? (credit + debit) / usable.length : 0,
    skipped: entries.length - usable.length,
  }
}

export function suggestUnit(entries) {
  const dates = entries
    .map((entry) => entry.receipt?.date)
    .filter(Boolean)
    .sort()
  if (dates.length < 2) return 'day'
  const span = (Date.parse(dates.at(-1)) - Date.parse(dates[0])) / DAY_MS
  return span > MONTH_THRESHOLD_DAYS ? 'month' : 'day'
}

function periodKey(date, unit) {
  const iso = date.toISOString().slice(0, 10)
  return unit === 'month' ? iso.slice(0, 7) : iso
}

function periodRange(keys, unit) {
  const sorted = [...keys].sort()
  const first = sorted[0]
  const last = sorted.at(-1)
  if (!first) return []

  const cursor = new Date(
    `${unit === 'month' ? `${first}-01` : first}T12:00:00Z`,
  )
  const end = new Date(`${unit === 'month' ? `${last}-01` : last}T12:00:00Z`)
  const range = []

  while (cursor <= end && range.length < MAX_PERIODS) {
    range.push(periodKey(cursor, unit))
    if (unit === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    else cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return range
}

export function byPeriod(entries, unit = 'day') {
  const buckets = new Map()

  for (const entry of resolved(entries)) {
    const date = entry.receipt?.date
    if (!date) continue
    const key = unit === 'month' ? date.slice(0, 7) : date

    if (!buckets.has(key))
      buckets.set(key, { key, credit: 0, debit: 0, net: 0, count: 0 })
    const bucket = buckets.get(key)
    const amount = amountOf(entry)
    if (entry.direction === Direction.CREDIT) bucket.credit += amount
    else bucket.debit += amount
    bucket.net = bucket.credit - bucket.debit
    bucket.count += 1
  }

  for (const key of periodRange([...buckets.keys()], unit)) {
    if (!buckets.has(key)) {
      buckets.set(key, { key, credit: 0, debit: 0, net: 0, count: 0 })
    }
  }

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key))
}

function group(entries, keyOf, labelOf = (key) => key) {
  const buckets = new Map()

  for (const entry of resolved(entries)) {
    const key = keyOf(entry) || UNKNOWN
    if (!buckets.has(key)) {
      const label = key === UNKNOWN ? null : labelOf(key, entry)
      buckets.set(key, { key, label, total: 0, credit: 0, debit: 0, count: 0 })
    }
    const bucket = buckets.get(key)
    const amount = amountOf(entry)
    bucket.total += amount
    bucket[entry.direction === Direction.CREDIT ? 'credit' : 'debit'] += amount
    bucket.count += 1
  }

  return [...buckets.values()].sort((a, b) => b.total - a.total)
}

function counterpartyOf(entry) {
  return entry.receipt?.[`${counterSide(entry)}Name`] ?? null
}

function rankCounterparties(entries) {
  return group(
    entries,
    (entry) => normalizeName(counterpartyOf(entry)),
    (_, entry) => counterpartyOf(entry),
  )
}

export function topCounterparties(entries, { limit = 8 } = {}) {
  const ranked = rankCounterparties(entries)
  if (ranked.length <= limit) return ranked

  const tail = ranked.slice(limit)
  return [
    ...ranked.slice(0, limit),
    {
      key: OTHER,
      label: null,
      isOther: true,
      total: tail.reduce((sum, item) => sum + item.total, 0),
      credit: tail.reduce((sum, item) => sum + item.credit, 0),
      debit: tail.reduce((sum, item) => sum + item.debit, 0),
      count: tail.reduce((sum, item) => sum + item.count, 0),
    },
  ]
}

export function byType(entries) {
  return group(entries, (entry) => entry.receipt?.type)
}

export function byOwnAccount(entries) {
  return group(
    entries,
    (entry) => {
      const receipt = entry.receipt ?? {}
      const side = ownSide(entry)
      const bank =
        identifyBank(receipt[`${side}Bank`]) ??
        normalizeName(receipt[`${side}Bank`])
      const account = normalizeName(receipt[`${side}Account`])
      return [bank, account].filter(Boolean).join('|') || null
    },
    (_, entry) => {
      const receipt = entry.receipt ?? {}
      const side = ownSide(entry)
      return {
        bank: bankLabel(receipt[`${side}Bank`]),
        account: receipt[`${side}Account`] ?? null,
      }
    },
  )
}

export function concentration(entries, { top = 5 } = {}) {
  const ranked = rankCounterparties(entries)
  const named = ranked.filter((item) => item.key !== UNKNOWN)
  const total = ranked.reduce((sum, item) => sum + item.total, 0)
  const head = named.slice(0, top).reduce((sum, item) => sum + item.total, 0)

  return {
    top,
    parties: named.length,
    unnamed: ranked.length - named.length,
    total,
    share: total ? head / total : 0,
  }
}
