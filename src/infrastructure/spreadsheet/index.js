import { createCsvWriter } from './CsvWriter'
import { createXlsxWriter } from './XlsxWriter'
import { fillXlsx } from './XlsxFiller'
import { readXlsx } from './XlsxReader'

export function createSpreadsheetWriters() {
  const writers = [createXlsxWriter(), createCsvWriter()]
  const byFormat = new Map(writers.map((writer) => [writer.format, writer]))

  return {
    supports: (format) => byFormat.has(format),
    get: (format) => byFormat.get(format) ?? null,
  }
}

export function createSpreadsheetReader() {
  return { read: (bytes) => readXlsx(bytes) }
}

export function createSpreadsheetFiller() {
  return { fill: (bytes, options) => fillXlsx(bytes, options) }
}
