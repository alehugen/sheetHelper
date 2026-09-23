import {
  BASE_CURRENCY,
  convertAmount,
  formatMoney,
} from '../shared/currency.js'
import { formatDate } from '../shared/datetime.js'
import { formatDocument } from '../shared/document.js'

import {
  FieldKind,
  RECEIPT_FIELDS,
  REQUIRED_GROUPS,
  getField,
} from './ReceiptFields.js'
import { ReceiptType } from './ReceiptType.js'

export function createReceipt(values = {}) {
  const receipt = {}
  for (const field of RECEIPT_FIELDS) {
    const value = values[field.key]
    receipt[field.key] = value === undefined || value === '' ? null : value
  }
  if (!receipt.type) receipt.type = ReceiptType.UNKNOWN
  return receipt
}

export function withField(receipt, key, value) {
  if (!getField(key)) return receipt
  return { ...receipt, [key]: value === '' ? null : value }
}

export function isEmpty(value) {
  return value === null || value === undefined || value === ''
}

export function missingRequiredFields(receipt) {
  return REQUIRED_GROUPS.filter((group) =>
    group.every((key) => isEmpty(receipt?.[key])),
  ).map((group) => group[0])
}

export function filledFieldCount(receipt) {
  return RECEIPT_FIELDS.reduce(
    (total, field) =>
      receipt?.[field.key] !== null && receipt?.[field.key] !== undefined
        ? total + 1
        : total,
    0,
  )
}

export function formatFieldValue(key, value, context = {}) {
  if (value === null || value === undefined || value === '') return ''

  const field = getField(key)
  if (!field) return String(value)

  const { locale, currency = BASE_CURRENCY, rates, translateType } = context

  switch (field.kind) {
    case FieldKind.MONEY: {
      const converted = convertAmount(Number(value), currency, rates)
      return converted === null
        ? ''
        : formatMoney(converted, { currency, locale })
    }
    case FieldKind.DATE:
      return formatDate(value)
    case FieldKind.DOCUMENT:
      return formatDocument(value)
    case FieldKind.ENUM:
      return translateType ? translateType(value) : String(value)
    default:
      return String(value)
  }
}
