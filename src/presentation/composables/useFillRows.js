import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { ReceiptWarning } from '@/domain/receipt/ReceiptWarning'
import { Direction } from '@/domain/spreadsheet/ColumnMapping'
import { missingRequiredValues } from '@/domain/spreadsheet/ColumnMapping'
import {
  DuplicateLevel,
  addToIndex,
  buildIndex,
  findDuplicate,
  recordsFromSheet,
  toRecord,
} from '@/domain/spreadsheet/duplicates'
import { assignTargetRows } from '@/domain/spreadsheet/placement'
import { inferDirection, inferSheetIndex } from '@/domain/spreadsheet/routing'

import { useReceiptsStore } from '../stores/receipts'
import { useTemplateStore } from '../stores/template'

const LEVEL_WARNING = {
  [DuplicateLevel.CERTAIN]: ReceiptWarning.DUPLICATE,
  [DuplicateLevel.POSSIBLE]: ReceiptWarning.POSSIBLE_DUPLICATE,
}

export function useFillRows() {
  const receipts = useReceiptsStore()
  const template = useTemplateStore()
  const { rows } = storeToRefs(receipts)
  const { sheets, mapping } = storeToRefs(template)

  const existingIndex = computed(() =>
    buildIndex(
      sheets.value.flatMap((sheet) =>
        recordsFromSheet(sheet.data, mapping.value),
      ),
    ),
  )

  const fillRows = computed(() => {
    const batchIndex = buildIndex()

    const placed = rows.value.map((row) => {
      const inferred = inferSheetIndex(row.receipt, sheets.value)
      return {
        ...row,
        sheetIndex: row.sheetOverride ?? inferred ?? 0,
        sheetInferred: inferred !== null,
      }
    })

    return assignTargetRows(placed, sheets.value).map((row) => {
      const sheet = sheets.value[row.sheetIndex]
      const record = toRecord(row.receipt, row.key)
      const againstSheet = findDuplicate(record, existingIndex.value)
      const againstBatch = findDuplicate(record, batchIndex)
      addToIndex(batchIndex, record)

      const level =
        againstSheet.level !== DuplicateLevel.NONE
          ? againstSheet.level
          : againstBatch.level

      const missing = missingRequiredValues(row.receipt, mapping.value)

      return {
        ...row,
        direction: sheet
          ? inferDirection(row.receipt, sheet.name)
          : Direction.CREDIT,
        duplicateLevel: level,
        duplicateMatches: againstSheet.matches,
        missing,
        warnings: [
          ...row.warnings,
          ...(LEVEL_WARNING[level] ? [LEVEL_WARNING[level]] : []),
        ],
      }
    })
  })

  const blocked = computed(() =>
    fillRows.value.filter((row) => row.missing.length),
  )

  const canFill = computed(
    () =>
      template.isReady &&
      fillRows.value.length > 0 &&
      blocked.value.length === 0,
  )

  return { fillRows, blocked, canFill }
}
