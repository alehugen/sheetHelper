import { SpreadsheetFormat } from '@/application/ports/SpreadsheetWriter'
import { formatFieldValue } from '@/domain/receipt/Receipt'
import { RECEIPT_FIELDS } from '@/domain/receipt/ReceiptFields'

const DELIMITER = ';'
const BOM = '﻿'

function escapeCell(value) {
  const text = String(value ?? '')
  return /["\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function createCsvWriter() {
  return {
    format: SpreadsheetFormat.CSV,

    async build(receipts, { labels = {}, context = {} } = {}) {
      const header = RECEIPT_FIELDS.map((field) =>
        escapeCell(labels[field.key] ?? field.key),
      )

      const rows = receipts.map((receipt) =>
        RECEIPT_FIELDS.map((field) =>
          escapeCell(formatFieldValue(field.key, receipt[field.key], context)),
        ),
      )

      const content = [header, ...rows]
        .map((cells) => cells.join(DELIMITER))
        .join('\r\n')

      return new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
    },
  }
}
