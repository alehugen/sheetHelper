<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  label: { type: String, default: '' },
  indeterminate: { type: Boolean, default: false },
})

const pct = computed(() => Math.min(100, Math.max(0, Math.round(props.value))))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div v-if="label" class="text-muted flex justify-between text-xs">
      <span class="truncate">{{ label }}</span>
      <span v-if="!indeterminate" class="text-numeric tabular-nums">
        {{ pct }}%
      </span>
    </div>

    <div
      class="bg-ink-200 h-1.5 w-full overflow-hidden rounded-full"
      role="progressbar"
      :aria-valuenow="indeterminate ? undefined : pct"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="bg-ink-600 h-full rounded-full transition-[width] duration-300 ease-out"
        :class="indeterminate && 'w-1/3 animate-pulse'"
        :style="indeterminate ? undefined : { width: `${pct}%` }"
      />
    </div>
  </div>
</template>
