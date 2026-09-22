<script setup>
defineProps({
  options: { type: Array, required: true },
  label: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const model = defineModel({ type: String, required: true })
</script>

<template>
  <select
    v-model="model"
    :aria-label="label"
    class="rounded-control border-ink-300 bg-ink-50 text-body hover:border-ink-400 cursor-pointer border font-medium transition-colors"
    :class="size === 'sm' ? 'h-8 px-2 text-xs' : 'h-10 px-3 text-sm'"
  >
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
