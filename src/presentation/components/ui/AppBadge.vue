<script setup>
import { computed } from 'vue'

const props = defineProps({
  tone: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'success', 'warning', 'danger'].includes(v),
  },
})

const TONES = {
  neutral: 'bg-ink-200 text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

const classes = computed(() => TONES[props.tone])
</script>

<template>
  <span
    :class="classes"
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
  >
    <slot />
  </span>
</template>
