<script setup>
import { useI18n } from 'vue-i18n'

import { useDashboardStore } from '@/presentation/stores/dashboard'

const { t } = useI18n()
const dashboard = useDashboardStore()
</script>

<template>
  <div class="print:hidden">
    <p class="text-muted text-xs">{{ t('dashboard.toggles.hint') }}</p>
    <ul class="mt-2 flex flex-wrap gap-2">
      <li v-for="chart in dashboard.charts" :key="chart">
        <button
          type="button"
          class="rounded-control border px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :class="
            dashboard.shows(chart)
              ? 'border-ink-500 bg-ink-200 text-title'
              : 'border-ink-200 text-subtle hover:border-ink-400'
          "
          :aria-pressed="dashboard.shows(chart)"
          @click="dashboard.toggle(chart)"
        >
          {{ t(`dashboard.charts.${chart}`) }}
        </button>
      </li>
    </ul>
  </div>
</template>
