import { createExtractReceiptsFromFile } from '@/application/use-cases/extractReceiptsFromFile'
import {
  createExportSpreadsheet,
  createRebuildSpreadsheet,
} from '@/application/use-cases/exportSpreadsheet'
import { createExchangeRateApi } from '@/infrastructure/exchange/ExchangeRateApi'
import { createReceiptTextExtractor } from '@/infrastructure/extraction'
import { downloadBlob } from '@/infrastructure/download'
import { createFillSpreadsheet } from '@/application/use-cases/fillSpreadsheet'
import {
  createSpreadsheetFiller,
  createSpreadsheetReader,
  createSpreadsheetWriters,
} from '@/infrastructure/spreadsheet'
import { createLocalMappingStore } from '@/infrastructure/spreadsheet/LocalMappingStore'
import { createLocalHistoryStore } from '@/infrastructure/storage/LocalHistoryStore'

const textExtractor = createReceiptTextExtractor()
const writers = createSpreadsheetWriters()
const historyStore = createLocalHistoryStore()
const exchangeRates = createExchangeRateApi()
const spreadsheetReader = createSpreadsheetReader()
const spreadsheetFiller = createSpreadsheetFiller()
const mappingStore = createLocalMappingStore()

export const container = {
  textExtractor,
  download: downloadBlob,
  historyStore,
  exchangeRates,
  extractReceiptsFromFile: createExtractReceiptsFromFile({ textExtractor }),
  exportSpreadsheet: createExportSpreadsheet({ writers, historyStore }),
  rebuildSpreadsheet: createRebuildSpreadsheet({ writers }),
  fillSpreadsheet: createFillSpreadsheet({
    reader: spreadsheetReader,
    filler: spreadsheetFiller,
    mappingStore,
    historyStore,
  }),
}
