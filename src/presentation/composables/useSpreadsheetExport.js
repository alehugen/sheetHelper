import { ref } from 'vue'

import { SpreadsheetFormat } from '@/application/ports/SpreadsheetWriter'
import { container } from '@/container'
import { downloadBlob } from '@/infrastructure/download'

import { useHistoryStore } from '../stores/history'
import { useReceiptFormat } from './useReceiptFormat'

export function useSpreadsheetExport() {
  const history = useHistoryStore()
  const { labels, context } = useReceiptFormat()

  const isExporting = ref(false)
  const pendingFormat = ref(null)
  const error = ref(null)

  async function run(format, task) {
    isExporting.value = true
    pendingFormat.value = format
    error.value = null
    try {
      const { blob, fileName } = await task({
        labels: labels.value,
        context: context.value,
      })
      downloadBlob(blob, fileName)
      return fileName
    } catch (cause) {
      error.value = cause?.message ?? 'Erro ao gerar a planilha.'
      return null
    } finally {
      isExporting.value = false
      pendingFormat.value = null
    }
  }

  function exportReceipts(receipts, format = SpreadsheetFormat.XLSX) {
    return run(format, async (options) => {
      const result = await container.exportSpreadsheet(receipts, {
        format,
        ...options,
      })
      history.refresh()
      return result
    })
  }

  function downloadEntry(entry, format) {
    return run(format ?? entry.format, (options) =>
      container.rebuildSpreadsheet(entry, { format, ...options }),
    )
  }

  return { isExporting, pendingFormat, error, exportReceipts, downloadEntry }
}
