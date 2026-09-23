<script setup>
defineProps({
  lines: { type: Number, default: 1 },
  height: { type: String, default: 'h-4' },
})
</script>

<template>
  <div class="space-y-2" aria-hidden="true">
    <div
      v-for="line in lines"
      :key="line"
      class="bg-ink-200 skeleton rounded-control"
      :class="height"
      :style="{ width: line === lines && lines > 1 ? '70%' : '100%' }"
    />
  </div>
</template>
