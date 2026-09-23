import { SpreadsheetFormat } from '@/application/ports/SpreadsheetWriter'
import { formatFieldValue } from '@/domain/receipt/Receipt'
import { FieldKind, RECEIPT_FIELDS } from '@/domain/receipt/ReceiptFields'
import {
  BASE_CURRENCY,
  convertAmount,
  moneyFormatParts,
} from '@/domain/shared/currency'
import { formatDocument } from '@/domain/shared/document'

import { toUtcDate } from './excelDate'

const MIN_WIDTH = 11
const MAX_WIDTH = 44

const HEADER_STYLE = {
  fontWeight: 'bold',
  backgroundColor: '#212529',
  color: '#F8F9FA',
  align: 'left',
  verticalAlign: 'center',
  height: 22,
  borderColor: '#343A40',
  borderStyle: 'thin',
}

const BODY_STYLE = {
  borderColor: '#DEE2E6',
  borderStyle: 'thin',
  verticalAlign: 'center',
  height: 18,
}

const ALIGNMENT = {
  [FieldKind.MONEY]: 'right',
  [FieldKind.DATE]: 'center',
  [FieldKind.TIME]: 'center',
}

function moneyFormat(currency, locale) {
  const { symbol, prefix } = moneyFormatParts(currency, locale)
  return prefix ? `"${symbol}" #,##0.00` : `#,##0.00 "${symbol}"`
}

function toCell(field, value, context, format) {
  const base = { ...BODY_STYLE, align: ALIGNMENT[field.kind] ?? 'left' }
  if (value === null || value === undefined || value === '') {
    return { ...base, value: null }
  }

  switch (field.kind) {
    case FieldKind.MONEY: {
      const converted = convertAmount(
        Number(value),
        context.currency ?? BASE_CURRENCY,
        context.rates,
      )
      return converted === null
        ? { ...base, value: null }
        : { ...base, type: Number, value: converted, format }
    }
    case FieldKind.DATE: {
      const date = toUtcDate(value)
      return date
        ? { ...base, type: Date, value: date, format: 'dd/mm/yyyy' }
        : { ...base, value: String(value) }
    }
    case FieldKind.DOCUMENT:
      return { ...base, value: formatDocument(value) }
    default:
      return { ...base, value: formatFieldValue(field.key, value, context) }
  }
}

function columnWidths(receipts, labels, context) {
  return RECEIPT_FIELDS.map((field) => {
    const longest = receipts.reduce(
      (max, receipt) =>
        Math.max(
          max,
          formatFieldValue(field.key, receipt[field.key], context).length,
        ),
      String(labels[field.key] ?? '').length,
    )
    return { width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, longest + 3)) }
  })
}

export function createXlsxWriter() {
  return {
    format: SpreadsheetFormat.XLSX,

    async build(receipts, { labels = {}, context = {} } = {}) {
      const { default: writeXlsxFile } =
        await import('write-excel-file/browser')

      const currency = context.currency ?? BASE_CURRENCY
      const format = moneyFormat(currency, context.locale)

      const header = RECEIPT_FIELDS.map((field) => ({
        ...HEADER_STYLE,
        value: String(labels[field.key] ?? field.key),
      }))

      const rows = receipts.map((receipt) =>
        RECEIPT_FIELDS.map((field) =>
          toCell(field, receipt[field.key], context, format),
        ),
      )

      return writeXlsxFile([header, ...rows], {
        sheet: 'sheetHelper',
        columns: columnWidths(receipts, labels, context),
        stickyRowsCount: 1,
        showGridLines: false,
      }).toBlob()
    },
  }
}
