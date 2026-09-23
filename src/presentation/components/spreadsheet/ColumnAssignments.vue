<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { AMOUNT_IN, AMOUNT_OUT } from '@/domain/spreadsheet/ColumnMapping'
import { RECEIPT_FIELDS } from '@/domain/receipt/ReceiptFields'

import AppSelect from '../ui/AppSelect.vue'
import { useTemplateStore } from '../../stores/template'

const props = defineProps({
  receipts: { type: Array, required: true },
})

const { t } = useI18n()
const template = useTemplateStore()
const { columns, assignments, usedFields } = storeToRefs(template)

const available = computed(() => {
  const withData = RECEIPT_FIELDS.filter((field) =>
    props.receipts.some((receipt) => {
      const value = receipt[field.key]
      return value !== null && value !== undefined && value !== ''
    }),
  )

  return withData.flatMap((field) =>
    field.key === 'amount'
      ? [
          { value: AMOUNT_IN, label: t('fill.amountIn') },
          { value: AMOUNT_OUT, label: t('fill.amountOut') },
        ]
      : [{ value: field.key, label: t(`fields.${field.key}`) }],
  )
})

function optionsFor(column) {
  const current = assignments.value[column.letter]
  return [
    { value: '', label: t('fill.none') },
    ...available.value.filter(
      (option) =>
        option.value === current || !usedFields.value.has(option.value),
    ),
  ]
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <div
      v-for="column in columns"
      :key="column.letter"
      class="border-ink-200 bg-ink-100/40 rounded-control flex flex-col gap-1.5 border p-3 transition-colors duration-200"
      :class="assignments[column.letter] && 'border-ink-400 bg-ink-100'"
    >
      <div class="flex items-baseline gap-1.5">
        <span class="text-subtle text-numeric text-[11px] font-semibold">
          {{ column.letter }}
        </span>
        <span class="text-title truncate text-xs font-semibold">
          {{ column.title }}
        </span>
      </div>

      <p v-if="column.hasFormula" class="text-subtle text-[11px]">
        {{ t('fill.formulaColumn') }}
      </p>

      <AppSelect
        v-else
        size="sm"
        :label="column.title"
        :options="optionsFor(column)"
        :model-value="assignments[column.letter] ?? ''"
        @update:model-value="template.assign(column.letter, $event)"
      />
    </div>
  </div>
</template>
