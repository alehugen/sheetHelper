import { createHistoryEntry } from '../ports/HistoryStore'
import { getFormat } from '../ports/SpreadsheetWriter'

function pad(value) {
  return String(value).padStart(2, '0')
}

function buildFileName(date, extension) {
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-')
  const time = [pad(date.getHours()), pad(date.getMinutes())].join('')
  return `comprovantes-${stamp}-${time}.${extension}`
}

export function createExportSpreadsheet({
  writers,
  historyStore,
  clock = () => new Date(),
  idFactory = () => crypto.randomUUID(),
}) {
  return async function exportSpreadsheet(
    receipts,
    { format, labels, context },
  ) {
    const spec = getFormat(format)
    const writer = writers.get(format)
    if (!spec || !writer) throw new Error(`Formato inválido: ${format}`)
    if (!receipts.length) throw new Error('Nenhum comprovante para exportar.')

    const createdAt = clock()
    const fileName = buildFileName(createdAt, spec.extension)
    const blob = await writer.build(receipts, { labels, context })

    const entry = createHistoryEntry({
      id: idFactory(),
      createdAt: createdAt.toISOString(),
      fileName,
      format,
      receipts,
    })
    historyStore.save(entry)

    return { blob, fileName, entry }
  }
}

export function createRebuildSpreadsheet({ writers }) {
  return async function rebuildSpreadsheet(
    entry,
    { format, labels, context } = {},
  ) {
    const target = format ?? entry.format
    const spec = getFormat(target)
    const writer = writers.get(target)
    if (!spec || !writer) throw new Error(`Formato inválido: ${target}`)

    const blob = await writer.build(entry.receipts, { labels, context })
    const fileName = entry.fileName.replace(/\.\w+$/, `.${spec.extension}`)
    return { blob, fileName }
  }
}
