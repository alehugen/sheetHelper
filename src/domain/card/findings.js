import { normalizeName } from '../shared/text.js'

import { EntryKind, amountOf } from './CardEntry.js'

export const FindingKind = {
  DUPLICATE: 'duplicate',
  FEE: 'fee',
  INTEREST: 'interest',
  INTERNATIONAL: 'international',
  IOF: 'iof',
}

function keyOf(entry) {
  return `${entry.date}|${normalizeName(entry.merchant)}|${amountOf(entry)}`
}

function duplicates(entries) {
  const seen = new Map()
  for (const entry of entries) {
    if (entry.kind !== EntryKind.PURCHASE) continue
    const key = keyOf(entry)
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key).push(entry)
  }

  return [...seen.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      kind: FindingKind.DUPLICATE,
      merchant: group[0].merchant,
      date: group[0].date,
      amount: amountOf(group[0]),
      count: group.length,
      total: amountOf(group[0]) * group.length,
    }))
}

function totalOf(entries, predicate) {
  return entries
    .filter(predicate)
    .reduce((sum, entry) => sum + amountOf(entry), 0)
}

export function findings(entries) {
  const found = duplicates(entries)

  const fees = totalOf(entries, (entry) => entry.kind === EntryKind.FEE)
  if (fees > 0) found.push({ kind: FindingKind.FEE, total: fees })

  const interest = totalOf(
    entries,
    (entry) => entry.kind === EntryKind.INTEREST,
  )
  if (interest > 0) found.push({ kind: FindingKind.INTEREST, total: interest })

  const iof = totalOf(entries, (entry) => entry.kind === EntryKind.IOF)
  if (iof > 0) found.push({ kind: FindingKind.IOF, total: iof })

  const abroad = entries.filter((entry) => entry.foreign)
  if (abroad.length) {
    found.push({
      kind: FindingKind.INTERNATIONAL,
      count: abroad.length,
      total: abroad.reduce((sum, entry) => sum + amountOf(entry), 0),
    })
  }

  return found
}
