<script setup>
import { nextTick, watch } from 'vue'
import { useCurrencyInput } from 'vue-currency-input'

import { useReceiptFormat } from '../../composables/useReceiptFormat'

const props = defineProps({
  modelValue: { type: Number, default: null },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { currency, locale, toDisplay, toBase } = useReceiptFormat()

function currencyOptions() {
  return {
    currency: currency.value,
    locale: locale.value,
    precision: 2,
    hideCurrencySymbolOnFocus: false,
    hideGroupingSeparatorOnFocus: false,
    hideNegligibleDecimalDigitsOnFocus: false,
    valueRange: { min: 0 },
  }
}

const { inputRef, numberValue, setOptions, setValue } = useCurrencyInput(
  currencyOptions(),
  false,
)

let syncing = false

watch(
  () => [props.modelValue, currency.value, locale.value],
  async () => {
    syncing = true
    setOptions(currencyOptions())
    setValue(props.modelValue === null ? null : toDisplay(props.modelValue))
    await nextTick()
    syncing = false
  },
  { immediate: true },
)

watch(numberValue, (value) => {
  if (syncing) return

  const next = value === null || value === undefined ? null : toBase(value)
  if (next === props.modelValue) return

  const unchanged =
    next !== null &&
    props.modelValue !== null &&
    Math.abs(next - props.modelValue) < 0.005
  if (unchanged) return

  emit('update:modelValue', next)
})
</script>

<template>
  <input
    ref="inputRef"
    :aria-label="label"
    placeholder="—"
    class="rounded-control text-title placeholder:text-subtle hover:bg-ink-100 focus:bg-ink-50 focus:ring-ink-400 text-numeric h-8 w-full border border-transparent bg-transparent px-2 text-right text-xs font-medium transition-colors focus:ring-1 focus:outline-none"
    :class="modelValue === null && 'bg-warning-soft/60'"
  />
</template>
