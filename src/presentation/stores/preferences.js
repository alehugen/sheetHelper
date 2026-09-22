import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { container } from '@/container'
import {
  BASE_CURRENCY,
  CURRENCIES,
  isSupportedCurrency,
} from '@/domain/shared/currency'
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  i18n,
  isSupportedLocale,
} from '@/i18n'

export const usePreferencesStore = defineStore('preferences', () => {
  const locale = useStorage('ticketexport:locale', DEFAULT_LOCALE)
  const currency = useStorage('ticketexport:currency', BASE_CURRENCY)

  const rates = ref(
    container.exchangeRates.cached()?.rates ?? { [BASE_CURRENCY]: 1 },
  )
  const isLoadingRates = ref(false)
  const ratesFailed = ref(false)

  if (!isSupportedLocale(locale.value)) locale.value = DEFAULT_LOCALE
  if (!isSupportedCurrency(currency.value)) currency.value = BASE_CURRENCY

  const activeRate = computed(() => rates.value?.[currency.value] ?? null)

  const needsRate = computed(
    () =>
      currency.value !== BASE_CURRENCY && !Number.isFinite(activeRate.value),
  )

  const effectiveCurrency = computed(() =>
    needsRate.value ? BASE_CURRENCY : currency.value,
  )

  const formatContext = computed(() => ({
    locale: locale.value,
    currency: effectiveCurrency.value,
    rates: rates.value,
  }))

  async function loadRates() {
    isLoadingRates.value = true
    try {
      const snapshot = await container.exchangeRates.load()
      if (snapshot?.rates) {
        rates.value = snapshot.rates
        ratesFailed.value = false
      } else {
        ratesFailed.value = true
      }
    } finally {
      isLoadingRates.value = false
    }
  }

  function setLocale(next) {
    if (isSupportedLocale(next)) locale.value = next
  }

  function setCurrency(next) {
    if (isSupportedCurrency(next)) currency.value = next
  }

  watch(
    locale,
    (value) => {
      i18n.global.locale.value = value
      document.documentElement.lang = value
    },
    { immediate: true },
  )

  watch(
    currency,
    (value) => {
      if (value !== BASE_CURRENCY) loadRates()
    },
    { immediate: true },
  )

  return {
    locale,
    currency,
    rates,
    activeRate,
    isLoadingRates,
    ratesFailed,
    effectiveCurrency,
    formatContext,
    locales: SUPPORTED_LOCALES,
    currencies: CURRENCIES,
    setLocale,
    setCurrency,
    loadRates,
  }
})
