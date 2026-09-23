import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { container } from '@/container'
import {
  fingerprintHeaders,
  mappingFromAssignments,
  suggestAssignments,
} from '@/domain/spreadsheet/ColumnMapping'

export const useTemplateStore = defineStore('template', () => {
  const fileName = ref(null)
  const bytes = ref(null)
  const sheets = ref([])
  const fingerprint = ref(null)
  const assignments = ref({})
  const error = ref(null)

  const isLoaded = computed(() => sheets.value.length > 0)
  const columns = computed(() => sheets.value[0]?.columns ?? [])
  const mapping = computed(() => mappingFromAssignments(assignments.value))

  const usedFields = computed(
    () => new Set(Object.values(assignments.value).filter(Boolean)),
  )

  const totalRows = computed(() =>
    sheets.value.reduce((sum, sheet) => sum + sheet.data.length, 0),
  )

  async function load(file) {
    error.value = null
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      const result = container.fillSpreadsheet.analyze(buffer)
      if (!result.sheets.length) {
        throw new Error('Não encontrei uma linha de cabeçalho nesta planilha.')
      }

      bytes.value = buffer
      fileName.value = file.name
      sheets.value = result.sheets
      fingerprint.value = fingerprintHeaders(result.sheets[0].columns)

      assignments.value =
        container.fillSpreadsheet.savedMapping(fingerprint.value) ??
        suggestAssignments(result.sheets[0].columns)
    } catch (cause) {
      error.value = cause?.message ?? 'Não foi possível ler a planilha.'
      reset()
    }
  }

  function assign(column, field) {
    const next = { ...assignments.value }

    for (const [key, value] of Object.entries(next)) {
      if (value === field && key !== column) delete next[key]
    }

    if (field) next[column] = field
    else delete next[column]

    assignments.value = next
    if (fingerprint.value) {
      container.fillSpreadsheet.rememberMapping(fingerprint.value, next)
    }
  }

  function reset() {
    fileName.value = null
    bytes.value = null
    sheets.value = []
    fingerprint.value = null
    assignments.value = {}
  }

  return {
    fileName,
    bytes,
    sheets,
    columns,
    fingerprint,
    assignments,
    usedFields,
    mapping,
    totalRows,
    isLoaded,
    error,
    load,
    assign,
    reset,
  }
})
