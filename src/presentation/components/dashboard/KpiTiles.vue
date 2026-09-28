<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { summarize } from '@/domain/insights/aggregate'
import { useReceiptFormat } from '@/presentation/composables/useReceiptFormat'

const props = defineProps({
  entries: { type: Array, required: true },
})

const { t } = useI18n()
const { money } = useReceiptFormat()

const totals = computed(() => summarize(props.entries))

const tiles = computed(() => [
  {
    key: 'in',
    label: t('dashboard.kpi.in'),
    value: money(totals.value.credit),
    accent: 'text-chart-in',
  },
  {
    key: 'out',
    label: t('dashboard.kpi.out'),
    value: money(totals.value.debit),
    accent: 'text-chart-out',
  },
  {
    key: 'net',
    label: t('dashboard.kpi.net'),
    value: money(totals.value.net),
    accent: totals.value.net < 0 ? 'text-danger' : 'text-title',
  },
  {
    key: 'count',
    label: t('dashboard.kpi.count'),
    value: String(totals.value.count),
    accent: 'text-title',
  },
])
</script>

<template>
  <div>
    <dl class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        class="border-ink-200 bg-ink-50 rounded-card px-4 py-3.5"
      >
        <dt class="text-muted text-xs font-medium">{{ tile.label }}</dt>
        <dd
          class="mt-1 text-xl font-semibold tracking-tight tabular-nums"
          :class="tile.accent"
        >
          {{ tile.value }}
        </dd>
      </div>
    </dl>

    <p v-if="totals.skipped" class="text-muted mt-2 text-xs">
      {{ t('dashboard.kpi.skipped', { count: totals.skipped }) }}
    </p>
  </div>
</template>
