import { createCsvWriter } from './CsvWriter'
import { createXlsxWriter } from './XlsxWriter'

export function createSpreadsheetWriters() {
  const writers = [createXlsxWriter(), createCsvWriter()]
  const byFormat = new Map(writers.map((writer) => [writer.format, writer]))

  return {
    supports: (format) => byFormat.has(format),
    get: (format) => byFormat.get(format) ?? null,
  }
}
