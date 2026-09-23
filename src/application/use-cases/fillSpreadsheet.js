import { Direction, targetColumn } from '@/domain/spreadsheet/ColumnMapping'
import {
  assertCapacity,
  assignTargetRows,
} from '@/domain/spreadsheet/placement'
import { FieldKind, getField } from '@/domain/receipt/ReceiptFields'

import { createHistoryEntry } from '../ports/HistoryStore'

function payloadFor(field, value, translateType) {
  if (value === null || value === undefined || value === '') return null

  switch (field.kind) {
    case FieldKind.MONEY:
      return { kind: 'number', value: Number(value) }
    case FieldKind.DATE:
      return { kind: 'date', value }
    case FieldKind.ENUM:
      return {
        kind: 'text',
        value: translateType ? translateType(value) : value,
      }
    default:
      return { kind: 'text', value: String(value) }
  }
}

export function buildEntries(
  rows,
  mapping,
  { sheets = [], translateType } = {},
) {
  assertCapacity(rows, sheets)

  const bySheet = new Map()

  for (const row of assignTargetRows(rows, sheets)) {
    const values = {}

    for (const [fieldKey, target] of Object.entries(mapping)) {
      const column = targetColumn(target, row.direction ?? Direction.CREDIT)
      if (!column) continue

      const field = getField(fieldKey)
      if (!field) continue

      const payload = payloadFor(field, row.receipt[fieldKey], translateType)
      if (payload) values[column] = payload
    }

    if (!Object.keys(values).length) continue

    if (!bySheet.has(row.sheetIndex)) bySheet.set(row.sheetIndex, [])
    bySheet.get(row.sheetIndex).push({ row: row.targetRow, values })
  }

  return [...bySheet.entries()].map(([sheetIndex, entries]) => ({
    sheetIndex,
    entries,
  }))
}

export function createFillSpreadsheet({
  reader,
  filler,
  mappingStore,
  historyStore,
  clock = () => new Date(),
  idFactory = () => crypto.randomUUID(),
}) {
  return {
    analyze(bytes) {
      return reader.read(bytes)
    },

    savedMapping(fingerprint) {
      return mappingStore.get(fingerprint)
    },

    rememberMapping(fingerprint, mapping) {
      return mappingStore.save(fingerprint, mapping)
    },

    fill(bytes, { rows, mapping, sheets, translateType, fileName }) {
      const plan = buildEntries(rows, mapping, { sheets, translateType })
      if (!plan.length) {
        throw new Error('Nenhuma linha para preencher.')
      }

      const filled = filler.fill(bytes, { sheets: plan })

      historyStore?.save(
        createHistoryEntry({
          id: idFactory(),
          createdAt: clock().toISOString(),
          fileName,
          format: 'xlsx',
          receipts: rows.map((row) => row.receipt),
          target: {
            fileName,
            sheets: [
              ...new Set(
                plan.map((sheet) => sheets[sheet.sheetIndex]?.name ?? ''),
              ),
            ],
          },
        }),
      )

      return filled
    },
  }
}
