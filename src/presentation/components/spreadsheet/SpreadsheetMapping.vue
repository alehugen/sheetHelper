<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { Direction, targetColumn } from '@/domain/spreadsheet/ColumnMapping'

import AppBadge from '../ui/AppBadge.vue'
import AppButton from '../ui/AppButton.vue'
import AppIcon from '../ui/AppIcon.vue'
import AppSelect from '../ui/AppSelect.vue'
import { useTemplateStore } from '../../stores/template'

const { t } = useI18n()
const template = useTemplateStore()
const { columns, mapping, pendingFields, sheets, fileName } =
  storeToRefs(template)

const FIELDS = [
  'date',
  'amount',
  'payerName',
  'payerDocument',
  'payeeName',
  'type',
  'transactionId',
  'description',
]

const expanded = ref(false)
const open = computed(() => expanded.value || pendingFields.value.length > 0)

const columnOptions = computed(() => [
  { value: '', label: t('fill.none') },
  ...columns.value.map((column) => ({
    value: column.letter,
    label: `${column.letter} · ${column.title}`,
  })),
])

const summary = computed(() =>
  FIELDS.map((field) => ({
    field,
    label: t(`fields.${field}`),
    column: targetColumn(mapping.value[field]),
  })).filter((item) => item.column),
)

const untouched = computed(() => {
  const used = new Set(
    FIELDS.flatMap((field) => [
      targetColumn(mapping.value[field], Direction.CREDIT),
      targetColumn(mapping.value[field], Direction.DEBIT),
    ]).filter(Boolean),
  )
  return columns.value.filter((column) => !used.has(column.letter)).length
})

const totalRows = computed(() =>
  sheets.value.reduce((sum, sheet) => sum + sheet.data.length, 0),
)

function currentValue(field, direction) {
  return targetColumn(mapping.value[field], direction) ?? ''
}

function update(field, direction, letter) {
  if (field !== 'amount') {
    template.setTarget(field, letter ? { column: letter } : null)
  } else {
    const credit =
      direction === Direction.CREDIT
        ? letter
        : currentValue('amount', Direction.CREDIT)
    const debit =
      direction === Direction.DEBIT
        ? letter
        : currentValue('amount', Direction.DEBIT)
    template.setTarget(
      'amount',
      credit || debit ? { byDirection: { credit, debit } } : null,
    )
  }
  template.remember()
}
</script>

<template>
  <div class="border-ink-200 bg-ink-50 rounded-card shadow-soft border">
    <div class="flex flex-wrap items-center gap-3 px-5 py-4">
      <AppIcon name="sheet" :size="18" class="text-subtle shrink-0" />

      <div class="min-w-0 flex-1">
        <p class="text-title truncate text-sm font-semibold">{{ fileName }}</p>
        <p class="text-muted mt-0.5 text-xs">
          {{ t('fill.loaded', { sheets: sheets.length, rows: totalRows }) }}
        </p>
      </div>

      <AppButton size="sm" variant="ghost" @click="template.reset()">
        {{ t('fill.replace') }}
      </AppButton>
    </div>

    <div class="border-ink-200 border-t px-5 py-3">
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="text-muted font-medium"
          >{{ t('fill.mappingTitle') }}:</span
        >
        <AppBadge v-for="item in summary" :key="item.field">
          {{ item.label }} → {{ item.column }}
        </AppBadge>
        <span v-if="untouched" class="text-subtle">
          {{ t('fill.untouched', { count: untouched }) }}
        </span>
        <button
          type="button"
          class="text-muted hover:text-title underline underline-offset-2"
          @click="expanded = !expanded"
        >
          {{ t('fill.adjust') }}
        </button>
      </div>

      <div v-if="open" class="mt-4 space-y-3">
        <div v-if="pendingFields.length" class="space-y-0.5">
          <p class="text-warning text-xs font-medium">
            {{ t('fill.pendingTitle') }}
          </p>
          <p class="text-subtle text-xs">{{ t('fill.pendingHint') }}</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label
            v-for="field in FIELDS"
            :key="field"
            class="flex flex-col gap-1"
          >
            <span class="text-muted text-[11px] font-medium">
              {{ t(`fields.${field}`) }}
            </span>

            <AppSelect
              v-if="field !== 'amount'"
              size="sm"
              :label="t(`fields.${field}`)"
              :options="columnOptions"
              :model-value="currentValue(field)"
              @update:model-value="update(field, null, $event)"
            />

            <div v-else class="grid grid-cols-2 gap-1.5">
              <AppSelect
                size="sm"
                :label="t('fill.credit')"
                :options="columnOptions"
                :model-value="currentValue('amount', Direction.CREDIT)"
                @update:model-value="update('amount', Direction.CREDIT, $event)"
              />
              <AppSelect
                size="sm"
                :label="t('fill.debit')"
                :options="columnOptions"
                :model-value="currentValue('amount', Direction.DEBIT)"
                @update:model-value="update('amount', Direction.DEBIT, $event)"
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
