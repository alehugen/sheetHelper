import { isEmpty } from '../receipt/Receipt.js'
import { REQUIRED_GROUPS } from '../receipt/ReceiptFields.js'
import { fold } from '../shared/text.js'

import { detectMapping } from './headers.js'

export const Direction = {
  CREDIT: 'credit',
  DEBIT: 'debit',
}

export const AMOUNT_IN = 'amountIn'
export const AMOUNT_OUT = 'amountOut'

export function fingerprintHeaders(columns) {
  return columns
    .map(
      (column) => `${column.letter}:${fold(column.title).replace(/\s+/g, ' ')}`,
    )
    .sort()
    .join('|')
}

export function suggestAssignments(columns) {
  const { mapping } = detectMapping(columns)
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([field]) => field !== 'amount')
      .map(([field, column]) => [column.letter, field]),
  )
}

export function mappingFromAssignments(assignments) {
  const mapping = {}
  const byDirection = {}

  for (const [column, field] of Object.entries(assignments)) {
    if (!field) continue
    if (field === AMOUNT_IN) byDirection.credit = column
    else if (field === AMOUNT_OUT) byDirection.debit = column
    else mapping[field] = { column }
  }

  if (byDirection.credit || byDirection.debit) {
    mapping.amount = { byDirection }
  }
  return mapping
}

export function targetColumn(target, direction = Direction.CREDIT) {
  if (!target) return null
  if (target.column) return target.column

  const other =
    direction === Direction.CREDIT ? Direction.DEBIT : Direction.CREDIT
  return target.byDirection?.[direction] ?? target.byDirection?.[other] ?? null
}

export function mappedFields(mapping) {
  return Object.keys(mapping).filter((field) => {
    const target = mapping[field]
    return Boolean(target?.column || target?.byDirection)
  })
}

function requiredFieldsFor(mapping) {
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
