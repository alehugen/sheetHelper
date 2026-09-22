import { ReceiptType } from './ReceiptType.js'

export const FieldKind = {
  TEXT: 'text',
  MONEY: 'money',
  DATE: 'date',
  TIME: 'time',
  DOCUMENT: 'document',
  ENUM: 'enum',
}

export const RECEIPT_FIELDS = [
  { key: 'date', kind: FieldKind.DATE, width: 12 },
  { key: 'amount', kind: FieldKind.MONEY, width: 14 },
  { key: 'payerName', kind: FieldKind.TEXT, width: 28 },
  { key: 'payerDocument', kind: FieldKind.DOCUMENT, width: 22 },
  { key: 'payerBank', kind: FieldKind.TEXT, width: 22 },
  { key: 'time', kind: FieldKind.TIME, width: 10 },
  {
    key: 'type',
    kind: FieldKind.ENUM,
    width: 14,
    options: Object.values(ReceiptType),
  },
  { key: 'payeeName', kind: FieldKind.TEXT, width: 28 },
  { key: 'payeeDocument', kind: FieldKind.DOCUMENT, width: 22 },
  { key: 'payeeBank', kind: FieldKind.TEXT, width: 22 },
  { key: 'transactionId', kind: FieldKind.TEXT, width: 34 },
  { key: 'dueDate', kind: FieldKind.DATE, width: 12 },
  { key: 'description', kind: FieldKind.TEXT, width: 28 },
  { key: 'sourceFile', kind: FieldKind.TEXT, width: 26 },
]

export const REQUIRED_GROUPS = [
  ['date'],
  ['amount'],
  ['payerName', 'payerDocument'],
]

export function getField(key) {
  return RECEIPT_FIELDS.find((field) => field.key === key) ?? null
}
