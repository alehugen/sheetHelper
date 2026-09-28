<script setup>
import { Orientation } from '@unovis/ts'
import {
  VisAxis,
  VisGroupedBar,
  VisGroupedBarSelectors,
  VisTooltip,
  VisXYContainer,
} from '@unovis/vue'
import { computed } from 'vue'

import ChartFrame from '@/presentation/components/dashboard/ChartFrame.vue'
import { chartTooltip } from '@/presentation/components/dashboard/tooltip'

const ROW_HEIGHT = 34
const ROW_PADDING = 32
const MIN_HEIGHT = 120
const VERTICAL_HEIGHT = 240
const LABEL_WIDTH = 132
const LABEL_CHARS = 22

const props = defineProps({
  items: { type: Array, required: true },
  format: { type: Function, required: true },
  emptyLabel: { type: String, default: '—' },
  orientation: { type: String, default: Orientation.Horizontal },
})

const isHorizontal = computed(
  () => props.orientation === Orientation.Horizontal,
)

const height = computed(() =>
  isHorizontal.value
    ? Math.max(props.items.length * ROW_HEIGHT + ROW_PADDING, MIN_HEIGHT)
    : VERTICAL_HEIGHT,
)

const margin = computed(() => ({
  top: 8,
  right: 16,
  bottom: 8,
  left: isHorizontal.value ? LABEL_WIDTH : 8,
}))

const tickValues = computed(() => props.items.map((_, index) => index))

const x = (_, index) => index
const y = (item) => item.value

function color(item) {
  return item?.color ?? 'var(--color-chart-1)'
}

function nameOf(item) {
  return item?.label ?? props.emptyLabel
}

function categoryAt(value) {
  if (!Number.isInteger(value)) return ''
  const item = props.items[value]
  if (!item) return ''
  const text = nameOf(item)
  return text.length > LABEL_CHARS ? `${text.slice(0, LABEL_CHARS - 1)}…` : text
}

const triggers = computed(() => ({
  [VisGroupedBarSelectors.bar]: (item) =>
    chartTooltip({
      title: nameOf(item),
      rows: [{ value: props.format(item.value) }],
    }),
}))
</script>

<template>
  <ChartFrame :height="height">
    <VisXYContainer :data="items" :height="height" :margin="margin">
      <VisGroupedBar
        :x="x"
        :y="y"
        :color="color"
        :orientation="orientation"
        :rounded-corners="4"
        :bar-padding="0.2"
        :bar-min-height="2"
      />
      <VisAxis
        :type="isHorizontal ? 'y' : 'x'"
        :tick-format="categoryAt"
        :tick-values="tickValues"
        :grid-line="false"
        :domain-line="false"
        :tick-line="false"
      />
      <VisAxis
        :type="isHorizontal ? 'x' : 'y'"
        :tick-format="format"
        :num-ticks="4"
        :domain-line="false"
        :tick-line="false"
      />
      <VisTooltip :triggers="triggers" />
    </VisXYContainer>
  </ChartFrame>
</template>
