export const SpreadsheetFormat = {
  XLSX: 'xlsx',
  CSV: 'csv',
}

const SPREADSHEET_FORMATS = [
  {
    id: SpreadsheetFormat.XLSX,
    label: 'Excel (.xlsx)',
    extension: 'xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    id: SpreadsheetFormat.CSV,
    label: 'CSV (.csv)',
    extension: 'csv',
    mimeType: 'text/csv;charset=utf-8',
  },
]

export function getFormat(id) {
  return SPREADSHEET_FORMATS.find((format) => format.id === id) ?? null
}
