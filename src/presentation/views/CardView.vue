<script setup>
import { Orientation } from '@unovis/ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { FindingKind } from '@/domain/card/findings'
import BankMark from '@/presentation/components/card/BankMark.vue'
import IssuerPicker from '@/presentation/components/card/IssuerPicker.vue'
import RankChart from '@/presentation/components/dashboard/RankChart.vue'
import AppButton from '@/presentation/components/ui/AppButton.vue'
import AppCard from '@/presentation/components/ui/AppCard.vue'
import AppDropzone from '@/presentation/components/ui/AppDropzone.vue'
import { container } from '@/container'
import { useReceiptFormat } from '@/presentation/composables/useReceiptFormat'
import { useCardStore } from '@/presentation/stores/card'

const CATEGORICAL = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
]

const { t } = useI18n()
const { money } = useReceiptFormat()
const card = useCardStore()

const accepts = container.textExtractor.accepts

const kpis = computed(() => [
  { key: 'total', label: t('card.kpi.total'), value: money(card.total) },
  {
    key: 'next',
    label: t('card.kpi.next'),
    value: money(card.nextInvoice),
    accent: 'text-chart-out',
  },
  {
    key: 'installments',
    label: t('card.kpi.installments'),
    value: `${Math.round(card.fromInstallments * 100)}%`,
  },
  {
    key: 'committed',
    label: t('card.kpi.committed'),
    value: money(card.committed),
  },
])

const byCategory = computed(() => {
  const buckets = new Map()
  for (const entry of card.current) {
    const key = entry.category ?? '__none__'
    buckets.set(key, (buckets.get(key) ?? 0) + entry.amount)
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, value], index) => ({
      key,
      label: key === '__none__' ? null : t(`card.categories.${key}`),
      value,
      color: CATEGORICAL[index % CATEGORICAL.length],
    }))
})

const topMerchants = computed(() => {
  const buckets = new Map()
  for (const entry of card.current) {
    const key = entry.merchant ?? '—'
    buckets.set(key, (buckets.get(key) ?? 0) + entry.amount)
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({
      key: label,
      label,
      value,
      color: 'var(--color-chart-1)',
    }))
})

const commitment = computed(() =>
  card.curve.map((month) => ({
    key: `m${month.offset}`,
    label: t('card.commitment.month', { n: month.offset }),
    value: month.amount,
    color: 'var(--color-chart-out)',
  })),
)

function describe(alert) {
  if (alert.kind === FindingKind.DUPLICATE) {
    return t('card.findings.duplicate', {
      merchant: alert.merchant,
      count: alert.count,
      amount: money(alert.amount),
    })
  }
  return t(`card.findings.${alert.kind}`, {
    total: money(alert.total),
    count: alert.count ?? 0,
  })
}

async function onFiles(files) {
  if (files[0]) await card.read(files[0])
}

function exportPdf() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-title text-xl font-semibold tracking-tight">
          {{ t('card.title') }}
        </h1>
        <p class="text-muted mt-1 text-sm print:hidden">
          {{ t('card.subtitle') }}
        </p>
      </div>

      <div
        v-if="card.statement"
        class="flex shrink-0 items-center gap-2 print:hidden"
      >
        <AppButton variant="ghost" size="sm" @click="card.reset()">
          {{ t('card.another') }}
        </AppButton>
        <AppButton
          v-if="card.reconciles"
          variant="secondary"
          size="sm"
          @click="exportPdf"
        >
          {{ t('card.export') }}
        </AppButton>
      </div>
    </header>

    <AppCard v-if="!card.statement" :title="t('card.upload.title')">
      <IssuerPicker />

      <div class="mt-5">
        <AppDropzone
          :accept="accepts"
          :disabled="!card.issuer || card.isReading"
          :multiple="false"
          @files="onFiles"
        />
      </div>

      <p v-if="card.isReading" class="text-muted mt-3 text-sm">
        {{ t('card.upload.reading', { file: card.fileName }) }}
      </p>
      <p v-else-if="card.error" class="text-danger mt-3 text-sm">
        {{ t('card.upload.failed') }}
      </p>
    </AppCard>

    <template v-else>
      <div
        class="border-ink-200 bg-ink-50 rounded-card flex flex-wrap items-center gap-3 border px-4 py-2.5"
      >
        <BankMark :issuer="card.issuer.id" :size="20" />
        <p class="text-title text-sm font-medium">{{ card.issuer.label }}</p>
        <p class="text-muted min-w-0 flex-1 truncate text-xs">
          {{ card.fileName }}
        </p>
        <p
          class="shrink-0 text-xs font-medium"
          :class="card.reconciles ? 'text-success' : 'text-warning'"
        >
          {{ card.reconciles ? t('card.checks.ok') : t('card.checks.failed') }}
        </p>
      </div>

      <AppCard v-if="!card.reconciles" :title="t('card.checks.title')">
        <p class="text-body text-sm">{{ t('card.checks.explain') }}</p>
        <ul class="mt-3 space-y-1.5">
          <li
            v-for="check in card.checks"
            :key="check.label"
            class="flex items-center justify-between gap-4 text-xs"
          >
            <span :class="check.ok ? 'text-muted' : 'text-danger'">{{
              check.label
            }}</span>
            <span class="text-body tabular-nums">
              {{ money(check.read) }} ·
              {{ check.stated === null ? '—' : money(check.stated) }}
            </span>
          </li>
        </ul>
      </AppCard>

      <template v-else>
        <dl class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="kpi in kpis"
            :key="kpi.key"
            class="border-ink-200 bg-ink-50 rounded-card px-4 py-3.5"
          >
            <dt class="text-muted text-xs font-medium">{{ kpi.label }}</dt>
            <dd
              class="mt-1 text-xl font-semibold tracking-tight tabular-nums"
              :class="kpi.accent ?? 'text-title'"
            >
              {{ kpi.value }}
            </dd>
          </div>
        </dl>

        <AppCard
          v-if="commitment.length"
          :title="t('card.commitment.title')"
          :description="t('card.commitment.hint')"
        >
          <RankChart
            :items="commitment"
            :format="money"
            :orientation="Orientation.Vertical"
          />

          <p v-if="card.divergence" class="text-muted mt-4 text-xs">
            {{
              t('card.commitment.divergence', {
                declared: money(card.nextInvoice),
                ours: money(card.divergence.ours),
              })
            }}
          </p>
        </AppCard>

        <AppCard v-if="card.alerts.length" :title="t('card.findings.title')">
          <ul class="space-y-2">
            <li
              v-for="(alert, index) in card.alerts"
              :key="index"
              class="text-body flex items-start gap-2 text-sm"
            >
              <span class="bg-warning mt-1.5 size-1.5 shrink-0 rounded-full" />
              {{ describe(alert) }}
            </li>
          </ul>
        </AppCard>

        <div class="grid gap-6 lg:grid-cols-2">
          <AppCard
            :title="t('card.byCategory.title')"
            :description="
              card.uncategorized
                ? t('card.byCategory.pending', { count: card.uncategorized })
                : ''
            "
          >
            <RankChart
              :items="byCategory"
              :format="money"
              :empty-label="t('card.categories.none')"
            />
          </AppCard>

          <AppCard :title="t('card.topMerchants')">
            <RankChart :items="topMerchants" :format="money" />
          </AppCard>
        </div>
      </template>
    </template>
  </div>
</template>
