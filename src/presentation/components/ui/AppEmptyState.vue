<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  icon: { type: String, default: 'file' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center gap-3 px-6 py-14 text-center">
    <div
      class="bg-ink-100 text-subtle flex size-12 items-center justify-center rounded-full"
    >
      <AppIcon :name="icon" :size="22" />
    </div>
    <div class="space-y-1">
      <p class="text-body text-sm font-medium">{{ title }}</p>
      <p v-if="description" class="text-subtle max-w-sm text-xs">
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
