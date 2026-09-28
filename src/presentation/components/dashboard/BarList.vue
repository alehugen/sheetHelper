<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  format: { type: Function, required: true },
  emptyLabel: { type: String, default: '—' },
})

const active = ref(null)

const scale = computed(() =>
  Math.max(...props.items.map((item) => item.value), 0),
)

function width(value) {
  if (!scale.value || value <= 0) return 0
  return Math.max((value / scale.value) * 100, 1.5)
}

function segmentsOf(item) {
  return (
    item.segments ?? [{ key: item.key, value: item.value, color: item.color }]
  ).filter((segment) => segment.value > 0)
}
</script>

<template>
  <ul class="space-y-2.5">
    <li
      v-for="item in items"
      :key="item.key"
      class="group grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3"
      @mouseenter="active = item.key"
      @mouseleave="active = null"
    >
      <span
        class="truncate text-xs"
        :class="item.label ? 'text-body' : 'text-subtle italic'"
        :title="item.label ?? emptyLabel"
      >
        {{ item.label ?? emptyLabel }}
      </span>

      <span
        class="flex h-5 items-center gap-0.5 transition-opacity duration-200"
        :class="active && active !== item.key ? 'opacity-50' : ''"
        :style="{ width: `${width(item.value)}%` }"
      >
        <span
          v-for="(segment, index) in segmentsOf(item)"
          :key="segment.key"
          class="h-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :class="[
            segment.color,
            index === 0 ? 'rounded-l-[4px]' : '',
            index === segmentsOf(item).length - 1 ? 'rounded-r-[4px]' : '',
          ]"
          :style="{ flex: `${segment.value} 1 0%` }"
        />
      </span>

      <span class="text-title text-xs font-medium tabular-nums">
        {{ format(item.value) }}
      </span>
    </li>
  </ul>
</template>
