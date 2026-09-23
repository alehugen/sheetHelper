import { isEmpty } from '../receipt/Receipt.js'
import { REQUIRED_GROUPS } from '../receipt/ReceiptFields.js'
import { fold } from '../shared/text.js'

import { detectMapping } from './headers.js'

export const Direction = {
  CREDIT: 'credit',
  DEBIT: 'debit',
}

export function fingerprintHeaders(columns) {
  return columns
    .map(
      (column) => `${column.letter}:${fold(column.title).replace(/\s+/g, ' ')}`,
    )
    .sort()
    .join('|')
}

export function autoMapping(columns) {
  const { mapping, ambiguous, unmapped } = detectMapping(columns)

  return {
    mapping: Object.fromEntries(
      Object.entries(mapping).map(([field, column]) => [
        field,
        { column: column.letter },
      ]),
    ),
    ambiguous: Object.fromEntries(
      Object.entries(ambiguous).map(([field, candidates]) => [
        field,
        candidates.map((candidate) => candidate.letter),
      ]),
    ),
    unmapped: unmapped.map((column) => column.letter),
  }
}

export function mergeMapping(auto, saved = {}) {
  return { ...auto, ...saved }
}

export function targetColumn(target, direction = Direction.CREDIT) {
  if (!target) return null
  if (target.column) return target.column
  return target.byDirection?.[direction] ?? null
}

export function mappedFields(mapping) {
  return Object.keys(mapping).filter((field) => {
    const target = mapping[field]
    return Boolean(target?.column || target?.byDirection)
  })
}

export function requiredFieldsFor(mapping) {
  const available = new Set(mappedFields(mapping))
  return REQUIRED_GROUPS.filter((group) =>
    group.some((field) => available.has(field)),
  ).map((group) => group.filter((field) => available.has(field)))
}

export function missingRequiredValues(receipt, mapping) {
  return requiredFieldsFor(mapping)
    .filter((group) => group.every((field) => isEmpty(receipt?.[field])))
    .map((group) => group[0])
}

export function unresolvedFields(mapping, ambiguous) {
  const available = new Set(mappedFields(mapping))
  return Object.keys(ambiguous).filter((field) => !available.has(field))
}
