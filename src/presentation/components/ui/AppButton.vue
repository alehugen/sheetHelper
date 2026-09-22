<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  as: { type: [String, Object], default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const VARIANTS = {
  primary:
    'bg-ink-800 text-ink-50 hover:bg-ink-700 active:bg-ink-800 shadow-soft',
  secondary:
    'bg-ink-50 text-body border border-ink-300 hover:bg-ink-100 hover:border-ink-400',
  ghost: 'text-muted hover:bg-ink-200 hover:text-title',
  danger: 'bg-danger text-ink-50 hover:opacity-90',
}

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

const isInert = computed(() => props.disabled || props.loading)

const classes = computed(() => [
  'rounded-control inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 select-none',
  VARIANTS[props.variant],
  SIZES[props.size],
  props.block && 'w-full',
  isInert.value && 'pointer-events-none opacity-50',
])
</script>

<template>
  <component
    :is="as"
    :class="classes"
    :disabled="as === 'button' ? isInert : undefined"
    :aria-busy="loading || undefined"
  >
    <svg
      v-if="loading"
      class="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        class="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2Z"
      />
    </svg>
    <slot name="icon" />
    <slot />
  </component>
</template>
