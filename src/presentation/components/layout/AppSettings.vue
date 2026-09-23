<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '../ui/AppIcon.vue'
import AppSelect from '../ui/AppSelect.vue'
import { useTheme } from '../../composables/useTheme'
import { usePreferencesStore } from '../../stores/preferences'

const { t } = useI18n()
const { isDark, toggle } = useTheme()

const preferences = usePreferencesStore()
const { locale, currency, ratesFailed, activeRate } = storeToRefs(preferences)

const quote = computed(() => {
  const rate = activeRate.value
  if (!Number.isFinite(rate) || rate === 1) return null

  return rate < 1
    ? { from: currency.value, to: 'BRL', rate: (1 / rate).toFixed(2) }
    : { from: 'BRL', to: currency.value, rate: rate.toFixed(2) }
})

const localeOptions = computed(() =>
  preferences.locales.map(({ code, label }) => ({ value: code, label })),
)

const currencyOptions = computed(() =>
  preferences.currencies.map(({ code }) => ({ value: code, label: code })),
)
</script>

<template>
  <div class="flex items-center gap-1.5">
    <AppSelect
      v-model="locale"
      size="sm"
      :label="t('settings.language')"
      :options="localeOptions"
    />
    <AppSelect
      v-model="currency"
      size="sm"
      :label="t('settings.currency')"
      :options="currencyOptions"
    />

    <button
      type="button"
      class="text-muted hover:bg-ink-100 hover:text-body rounded-control p-2 transition-colors"
      :aria-label="isDark ? t('theme.toLight') : t('theme.toDark')"
      @click="toggle"
    >
      <AppIcon :name="isDark ? 'sun' : 'moon'" :size="17" />
    </button>

    <span
      v-if="ratesFailed"
      class="text-warning hidden text-[11px] sm:inline"
      :title="t('settings.rateUnavailable')"
    >
      <AppIcon name="alert" :size="13" />
    </span>
    <span
      v-else-if="quote"
      class="text-subtle text-numeric hidden text-[11px] lg:inline"
    >
      {{ t('settings.rateNote', quote) }}
    </span>
  </div>
</template>
