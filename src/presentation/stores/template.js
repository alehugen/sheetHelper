import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { container } from '@/container'
import {
  autoMapping,
  fingerprintHeaders,
  mergeMapping,
  unresolvedFields,
} from '@/domain/spreadsheet/ColumnMapping'

export const FlowMode = {
  NEW: 'new',
  FILL: 'fill',
}

export const useTemplateStore = defineStore('template', () => {
  const mode = ref(FlowMode.NEW)
  const fileName = ref(null)
  const bytes = ref(null)
  const sheets = ref([])
  const fingerprint = ref(null)
  const auto = ref({ mapping: {}, ambiguous: {}, unmapped: [] })
  const overrides = ref({})
  const error = ref(null)

  const isLoaded = computed(() => sheets.value.length > 0)

  const mapping = computed(() =>
    mergeMapping(auto.value.mapping, overrides.value),
  )

  const pendingFields = computed(() =>
    unresolvedFields(mapping.value, auto.value.ambiguous),
  )

  const isReady = computed(
    () => isLoaded.value && pendingFields.value.length === 0,
  )

  const columns = computed(() => sheets.value[0]?.columns ?? [])

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
      auto.value = autoMapping(result.sheets[0].columns)
      overrides.value =
        container.fillSpreadsheet.savedMapping(fingerprint.value) ?? {}
    } catch (cause) {
      error.value = cause?.message ?? 'Não foi possível ler a planilha.'
      reset()
    }
  }

  function setTarget(field, target) {
    overrides.value = target
      ? { ...overrides.value, [field]: target }
      : Object.fromEntries(
          Object.entries(overrides.value).filter(([key]) => key !== field),
        )
  }

  function remember() {
    if (fingerprint.value) {
      container.fillSpreadsheet.rememberMapping(
        fingerprint.value,
        overrides.value,
      )
    }
  }

  function reset() {
    fileName.value = null
    bytes.value = null
    sheets.value = []
    fingerprint.value = null
    auto.value = { mapping: {}, ambiguous: {}, unmapped: [] }
    overrides.value = {}
  }

  return {
    mode,
    fileName,
    bytes,
    sheets,
    columns,
    fingerprint,
    auto,
    overrides,
    mapping,
    pendingFields,
    isLoaded,
    isReady,
    error,
    load,
    setTarget,
    remember,
    reset,
  }
})
