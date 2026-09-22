import { createExtractReceiptFromFile } from '@/application/use-cases/extractReceiptFromFile'
import {
  createExportSpreadsheet,
  createRebuildSpreadsheet,
} from '@/application/use-cases/exportSpreadsheet'
import { createExchangeRateApi } from '@/infrastructure/exchange/ExchangeRateApi'
import { createReceiptTextExtractor } from '@/infrastructure/extraction'
import { createSpreadsheetWriters } from '@/infrastructure/spreadsheet'
import { createLocalHistoryStore } from '@/infrastructure/storage/LocalHistoryStore'

const textExtractor = createReceiptTextExtractor()
const writers = createSpreadsheetWriters()
const historyStore = createLocalHistoryStore()
const exchangeRates = createExchangeRateApi()

export const container = {
  textExtractor,
  historyStore,
  exchangeRates,
  extractReceiptFromFile: createExtractReceiptFromFile({ textExtractor }),
  exportSpreadsheet: createExportSpreadsheet({ writers, historyStore }),
  rebuildSpreadsheet: createRebuildSpreadsheet({ writers }),
}
