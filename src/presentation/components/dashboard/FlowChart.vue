<script setup>
import { CurveType } from '@unovis/ts'
import {
  VisArea,
  VisAxis,
  VisCrosshair,
  VisTooltip,
  VisXYContainer,
} from '@unovis/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { byPeriod, suggestUnit } from '@/domain/insights/aggregate'
import ChartFrame from '@/presentation/components/dashboard/ChartFrame.vue'
import { chartTooltip } from '@/presentation/components/dashboard/tooltip'
import { useReceiptFormat } from '@/presentation/composables/useReceiptFormat'

const HEIGHT = 260
const MAX_TICKS = 7

const props = defineProps({
  entries: { type: Array, required: true },
  series: { type: Array, required: true },
})

const { t } = useI18n()
const { money, locale } = useReceiptFormat()

const unit = computed(() => suggestUnit(props.entries))
const buckets = computed(() => byPeriod(props.entries, unit.value))

const periodFormat = computed(
  () =>
    new Intl.DateTimeFormat(
      locale.value,
      unit.value === 'month'
        ? { year: '2-digit', month: 'short' }
        : { day: '2-digit', month: 'short' },
    ),
)

function periodLabel(key) {
  const date = new Date(
    `${unit.value === 'month' ? `${key}-01` : key}T12:00:00`,
  )
  return Number.isNaN(date.getTime()) ? key : periodFormat.value.format(date)
}

const x = (_, index) => index
const y = computed(() =>
  props.series.map((serie) => (bucket) => bucket[serie.key] ?? 0),
)
const color = (_, index) => props.series[index]?.color

function tickFormat(value) {
  return periodLabel(buckets.value[value]?.key ?? '')
}

function crosshairTemplate(bucket) {
  return chartTooltip({
    title: periodLabel(bucket.key),
    rows: props.series.map((serie) => ({
      label: serie.label,
      value: money(bucket[serie.key] ?? 0),
      color: serie.color,
    })),
    footer: { label: t('dashboard.kpi.net'), value: money(bucket.net) },
  })
}
</script>

<template>
  <ChartFrame :series="series" :height="HEIGHT">
    <VisXYContainer
      :data="buckets"
      :height="HEIGHT"
      :margin="{ top: 8, right: 8, bottom: 4, left: 8 }"
    >
      <VisArea
        :x="x"
        :y="y"
        :color="color"
        :curve-type="CurveType.MonotoneX"
        :opacity="0.85"
        line
        :line-width="2"
      />
      <VisAxis
        type="x"
        :tick-format="tickFormat"
        :num-ticks="Math.min(buckets.length, MAX_TICKS)"
        :grid-line="false"
        :domain-line="false"
        :tick-line="false"
      />
      <VisAxis
        type="y"
        :tick-format="money"
        :num-ticks="4"
        :domain-line="false"
        :tick-line="false"
      />
      <VisCrosshair
        :x="x"
        :y="y"
        :color="color"
        :template="crosshairTemplate"
      />
      <VisTooltip />
    </VisXYContainer>
  </ChartFrame>
</template>
