<script setup>
import { computed } from 'vue'

import { FieldKind } from '@/domain/receipt/ReceiptFields'

import { useReceiptFormat } from '../../composables/useReceiptFormat'
import CurrencyCell from './CurrencyCell.vue'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Number], default: null },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { translateType } = useReceiptFormat()

const INPUT_TYPES = {
  [FieldKind.DATE]: 'date',
  [FieldKind.TIME]: 'time',
}

const inputType = computed(() => INPUT_TYPES[props.field.kind] ?? 'text')
const isEmpty = computed(
  () => props.modelValue === null || props.modelValue === '',
)

const value = computed({
  get: () => props.modelValue ?? '',
  set: (next) => emit('update:modelValue', next === '' ? null : next),
})

const controlClass = computed(() => [
  'rounded-control text-title placeholder:text-subtle hover:bg-ink-100 focus:bg-ink-50 focus:ring-ink-400 h-8 w-full border border-transparent bg-transparent px-2 text-xs transition-colors focus:ring-1 focus:outline-none',
  isEmpty.value && 'bg-warning-soft/60',
  props.field.kind === FieldKind.DOCUMENT && 'font-mono text-numeric',
])
</script>

<template>
  <CurrencyCell
    v-if="field.kind === FieldKind.MONEY"
    :model-value="modelValue === null ? null : Number(modelValue)"
    :label="label"
    @update:model-value="emit('update:modelValue', $event)"
  />

  <select
    v-else-if="field.kind === FieldKind.ENUM"
    v-model="value"
    :aria-label="label"
    :class="controlClass"
  >
    <option v-for="option in field.options" :key="option" :value="option">
      {{ translateType(option) }}
    </option>
  </select>

  <input
    v-else
    v-model="value"
    :type="inputType"
    :aria-label="label"
    :placeholder="isEmpty ? '—' : ''"
    :class="controlClass"
  />
</template>
