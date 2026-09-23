import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { container } from '@/container'
import { downloadBlob } from '@/infrastructure/download'

import { useTemplateStore } from '../stores/template'
import { useFillRows } from './useFillRows'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function useSpreadsheetFill() {
  const { t } = useI18n()
  const template = useTemplateStore()
  const { fillRows, blocked, canFill } = useFillRows()

  const isFilling = ref(false)
  const error = ref(null)
  const done = ref(null)

  async function fill() {
    if (!canFill.value) return null

    isFilling.value = true
    error.value = null
    done.value = null

    try {
      const bytes = container.fillSpreadsheet.fill(template.bytes, {
        rows: fillRows.value,
        mapping: template.mapping,
        sheets: template.sheets,
        translateType: (value) => t(`receiptType.${value}`),
      })

      downloadBlob(new Blob([bytes], { type: XLSX_MIME }), template.fileName)
      done.value = fillRows.value.length
      return template.fileName
    } catch (cause) {
      error.value = cause?.message ?? 'Não foi possível preencher a planilha.'
      return null
    } finally {
      isFilling.value = false
    }
  }

  return { fillRows, blocked, canFill, isFilling, error, done, fill }
}
