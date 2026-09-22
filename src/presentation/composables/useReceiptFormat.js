import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatFieldValue } from '@/domain/receipt/Receipt'
import { RECEIPT_FIELDS } from '@/domain/receipt/ReceiptFields'
import { convertAmount, formatMoney } from '@/domain/shared/currency'

import { usePreferencesStore } from '../stores/preferences'

export function useReceiptFormat() {
  const { t } = useI18n()
  const preferences = usePreferencesStore()
  const { formatContext, effectiveCurrency, locale } = storeToRefs(preferences)

  function translateType(value) {
    return t(`receiptType.${value}`)
  }

  const context = computed(() => ({
    ...formatContext.value,
    translateType,
  }))

  const labels = computed(() =>
    Object.fromEntries(
      RECEIPT_FIELDS.map((field) => [field.key, t(`fields.${field.key}`)]),
    ),
  )

  function formatValue(key, value) {
    return formatFieldValue(key, value, context.value)
  }

  function toDisplay(amountInBase) {
    return convertAmount(
      Number(amountInBase),
      effectiveCurrency.value,
      preferences.rates,
    )
  }

  function toBase(amountInDisplay) {
    if (!Number.isFinite(amountInDisplay)) return null
    const rate = preferences.rates?.[effectiveCurrency.value]
    if (!Number.isFinite(rate) || rate === 1) return amountInDisplay
    return Math.round((amountInDisplay / rate) * 100) / 100
  }

  function money(amountInBase) {
    const converted = toDisplay(amountInBase)
    return converted === null
      ? ''
      : formatMoney(converted, {
          currency: effectiveCurrency.value,
          locale: locale.value,
        })
  }

  return {
    context,
    labels,
    locale,
    currency: effectiveCurrency,
    translateType,
    formatValue,
    money,
    toDisplay,
    toBase,
  }
}
