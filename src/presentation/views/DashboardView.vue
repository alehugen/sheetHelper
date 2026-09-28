<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  byOwnAccount,
  byType,
  concentration,
  topCounterparties,
} from '@/domain/insights/aggregate'
import BarList from '@/presentation/components/dashboard/BarList.vue'
import ChartToggles from '@/presentation/components/dashboard/ChartToggles.vue'
import FlowChart from '@/presentation/components/dashboard/FlowChart.vue'
import IdentityPanel from '@/presentation/components/dashboard/IdentityPanel.vue'
import KpiTiles from '@/presentation/components/dashboard/KpiTiles.vue'
import AppButton from '@/presentation/components/ui/AppButton.vue'
import AppCard from '@/presentation/components/ui/AppCard.vue'
import AppEmptyState from '@/presentation/components/ui/AppEmptyState.vue'
import { useReceiptFormat } from '@/presentation/composables/useReceiptFormat'
import { useDashboardStore } from '@/presentation/stores/dashboard'
import { useIdentityStore } from '@/presentation/stores/identity'

const CATEGORICAL = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4']
const TOP_PARTIES = 5

const { t } = useI18n()
const { money, translateType, locale } = useReceiptFormat()
const identity = useIdentityStore()
const dashboard = useDashboardStore()

const entries = computed(() => identity.entries)

const counterparties = computed(() =>
  topCounterparties(entries.value, { limit: 8 }).map((item) => ({
    key: item.key,
    label: item.isOther ? t('dashboard.other') : item.label,
    value: item.total,
    segments: [
      { key: `${item.key}:in`, value: item.credit, color: 'bg-chart-in' },
      { key: `${item.key}:out`, value: item.debit, color: 'bg-chart-out' },
    ],
  })),
)

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
    value: item.total,
    color: CATEGORICAL[index % CATEGORICAL.length],
  })),
)

const focus = computed(() => concentration(entries.value, { top: TOP_PARTIES }))

const period = computed(() => {
  const dates = entries.value
    .map((entry) => entry.receipt.date)
    .filter(Boolean)
    .sort()
  if (!dates.length) return null
  const format = new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' })
  const first = format.format(new Date(`${dates[0]}T12:00:00`))
  const last = format.format(new Date(`${dates.at(-1)}T12:00:00`))
  return first === last ? first : `${first} — ${last}`
})

function exportPdf() {
  window.print()
}

const percent = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      style: 'percent',
      maximumFractionDigits: 0,
    }),
)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
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

      <AppButton
        v-if="identity.isReady"
        variant="secondary"
        size="sm"
        class="print:hidden"
        @click="exportPdf"
      >
        {{ t('dashboard.export') }}
      </AppButton>
    </header>

    <IdentityPanel class="print:hidden" />

    <template v-if="identity.isReady">
      <ChartToggles />

      <KpiTiles :entries="entries" />

      <AppCard
        v-if="dashboard.shows('flow')"
        :title="t('dashboard.flow.title')"
        :description="t('dashboard.flow.hint')"
      >
        <FlowChart :entries="entries" />
      </AppCard>

      <AppCard
        v-if="dashboard.shows('counterparties')"
        :title="t('dashboard.charts.counterparties')"
        :description="t('dashboard.counterparties.hint')"
      >
        <BarList
          :items="counterparties"
          :format="money"
          :empty-label="t('dashboard.unknownParty')"
        />
      </AppCard>

      <div class="grid gap-6 lg:grid-cols-2">
        <AppCard
          v-if="dashboard.shows('types')"
          :title="t('dashboard.charts.types')"
        >
          <BarList
            :items="types"
            :format="money"
            :empty-label="t('dashboard.unknownType')"
          />
        </AppCard>

        <AppCard
          v-if="dashboard.shows('accounts')"
          :title="t('dashboard.charts.accounts')"
          :description="t('dashboard.accounts.hint')"
        >
          <BarList
            :items="accounts"
            :format="money"
            :empty-label="t('dashboard.unknownAccount')"
          />
        </AppCard>
      </div>

      <AppCard
        v-if="dashboard.shows('concentration') && focus.parties"
        :title="t('dashboard.charts.concentration')"
      >
        <p
          class="text-title text-2xl font-semibold tracking-tight tabular-nums"
        >
          {{ percent.format(focus.share) }}
        </p>
        <p class="text-muted mt-1 text-sm">
          {{
            t('dashboard.concentration.body', {
              top: Math.min(focus.top, focus.parties),
              parties: focus.parties,
            })
          }}
        </p>
        <p v-if="focus.unnamed" class="text-subtle mt-2 text-xs">
          {{ t('dashboard.concentration.unnamed', { count: focus.unnamed }) }}
        </p>
      </AppCard>
    </template>

    <AppEmptyState
      v-else
      :title="t('dashboard.empty.title')"
      :description="t('dashboard.empty.hint')"
    />
  </div>
</template>
