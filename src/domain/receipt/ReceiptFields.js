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
  {
    key: 'type',
    kind: FieldKind.ENUM,
    width: 14,
    required: false,
    options: Object.values(ReceiptType),
  },
  { key: 'date', kind: FieldKind.DATE, width: 12, required: true },
  { key: 'time', kind: FieldKind.TIME, width: 10, required: false },
  { key: 'amount', kind: FieldKind.MONEY, width: 14, required: true },
  { key: 'payerName', kind: FieldKind.TEXT, width: 28, required: false },
  {
    key: 'payerDocument',
    kind: FieldKind.DOCUMENT,
    width: 22,
    required: false,
  },
  { key: 'payerBank', kind: FieldKind.TEXT, width: 22, required: false },
  { key: 'payeeName', kind: FieldKind.TEXT, width: 28, required: true },
  {
    key: 'payeeDocument',
    kind: FieldKind.DOCUMENT,
    width: 22,
    required: false,
  },
  { key: 'payeeBank', kind: FieldKind.TEXT, width: 22, required: false },
  { key: 'transactionId', kind: FieldKind.TEXT, width: 34, required: false },
  { key: 'dueDate', kind: FieldKind.DATE, width: 12, required: false },
  { key: 'description', kind: FieldKind.TEXT, width: 28, required: false },
  { key: 'sourceFile', kind: FieldKind.TEXT, width: 26, required: false },
]

export const REQUIRED_FIELD_KEYS = RECEIPT_FIELDS.filter((f) => f.required).map(
  (f) => f.key,
)

export function getField(key) {
  return RECEIPT_FIELDS.find((field) => field.key === key) ?? null
}
