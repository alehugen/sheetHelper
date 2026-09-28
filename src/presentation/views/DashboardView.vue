<script setup>
import { computed } from 'vue'
import { Orientation } from '@unovis/ts'
import { useI18n } from 'vue-i18n'

import { byOwnAccount, byType, dateRange } from '@/domain/insights/aggregate'
import RankChart from '@/presentation/components/dashboard/RankChart.vue'
import ChartMenu from '@/presentation/components/dashboard/ChartMenu.vue'
import FlowChart from '@/presentation/components/dashboard/FlowChart.vue'
import IdentityPanel from '@/presentation/components/dashboard/IdentityPanel.vue'
import KpiTiles from '@/presentation/components/dashboard/KpiTiles.vue'
import AppButton from '@/presentation/components/ui/AppButton.vue'
import AppCard from '@/presentation/components/ui/AppCard.vue'
import { useReceiptFormat } from '@/presentation/composables/useReceiptFormat'
import { useDashboardStore } from '@/presentation/stores/dashboard'
import { useIdentityStore } from '@/presentation/stores/identity'

const CATEGORICAL = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
]

const { t } = useI18n()
const { money, translateType, locale } = useReceiptFormat()
const identity = useIdentityStore()
const dashboard = useDashboardStore()

const entries = computed(() => identity.entries)

const flowSeries = computed(() => [
  {
    key: 'credit',
    label: t('dashboard.kpi.in'),
    color: 'var(--color-chart-in)',
  },
  {
    key: 'debit',
    label: t('dashboard.kpi.out'),
    color: 'var(--color-chart-out)',
  },
])

const types = computed(() =>
  byType(entries.value).map((item, index) => ({
    key: item.key,
    label: item.label ? translateType(item.label) : null,
    value: item.total,
    color: CATEGORICAL[index % CATEGORICAL.length],
  })),
)

const accounts = computed(() =>
  byOwnAccount(entries.value).map((item, index) => ({
    key: item.key,
    label: item.label
      ? [item.label.bank, item.label.account].filter(Boolean).join(' · ')
      : null,
    value: item.net,
    color:
      item.net < 0
        ? 'var(--color-chart-out)'
        : CATEGORICAL[index % CATEGORICAL.length],
  })),
)

const period = computed(() => {
  const range = dateRange(entries.value)
  if (!range) return null
  const format = new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' })
  const first = format.format(new Date(`${range.first}T12:00:00`))
  const last = format.format(new Date(`${range.last}T12:00:00`))
  return first === last ? first : `${first} — ${last}`
})

function exportPdf() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-title text-xl font-semibold tracking-tight">
          {{ t('dashboard.title') }}
        </h1>
        <p class="text-muted mt-1 text-sm print:hidden">
          {{ t('dashboard.subtitle') }}
        </p>
        <p v-if="period" class="text-muted mt-1 hidden text-sm print:block">
          {{ period }}
        </p>
        <p
          v-if="identity.selectedParties.length"
          class="text-subtle mt-0.5 hidden text-xs print:block"
        >
          {{ identity.selectedParties.map((party) => party.label).join(' · ') }}
        </p>
      </div>

      <div v-if="identity.isReady" class="flex shrink-0 items-center gap-2">
        <ChartMenu />
        <AppButton
          variant="secondary"
          size="sm"
          class="print:hidden"
          @click="exportPdf"
        >
          {{ t('dashboard.export') }}
        </AppButton>
      </div>
    </header>

    <IdentityPanel />

    <template v-if="identity.isReady">
      <KpiTiles :entries="entries" />

      <AppCard
        v-if="dashboard.shows('flow')"
        :title="t('dashboard.flow.title')"
        :description="t('dashboard.flow.hint')"
      >
        <FlowChart :entries="entries" :series="flowSeries" />
      </AppCard>

      <div class="grid gap-6 lg:grid-cols-2">
        <AppCard
          v-if="dashboard.shows('types')"
          :title="t('dashboard.charts.types')"
        >
          <RankChart
            :items="types"
            :format="money"
            :orientation="Orientation.Vertical"
            :empty-label="t('dashboard.unknownType')"
          />
        </AppCard>

        <AppCard
          v-if="dashboard.shows('accounts')"
          :title="t('dashboard.charts.accounts')"
          :description="t('dashboard.accounts.hint')"
        >
          <RankChart
            :items="accounts"
            :format="money"
            :empty-label="t('dashboard.unknownAccount')"
          />
        </AppCard>
      </div>
    </template>
  </div>
</template>
