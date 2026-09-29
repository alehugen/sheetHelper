<script setup>
import { computed } from 'vue'

import { BANK_MARKS, MARK_VIEWBOX } from './bankMarks.js'

const props = defineProps({
  issuer: { type: String, required: true },
  label: { type: String, default: '' },
  size: { type: Number, default: 24 },
})

const mark = computed(() => BANK_MARKS[props.issuer] ?? null)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`"
    role="img"
    :aria-label="label || issuer"
    class="shrink-0 overflow-visible"
  >
    <g v-if="mark" :transform="mark.transform" :fill="mark.background">
      <path v-for="(d, index) in mark.paths" :key="index" :d="d" />
    </g>
    <text
      v-else
      :x="MARK_VIEWBOX / 2"
      :y="MARK_VIEWBOX / 2"
      text-anchor="middle"
      dominant-baseline="central"
      :font-size="MARK_VIEWBOX * 0.5"
      class="fill-ink-500 font-semibold"
    >
      ?
    </text>
  </svg>
</template>
