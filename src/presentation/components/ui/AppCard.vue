<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  flush: { type: Boolean, default: false },
})
</script>

<template>
  <section
    class="border-ink-200 bg-ink-50 rounded-card shadow-soft overflow-hidden border"
  >
    <header
      v-if="title || $slots.header || $slots.actions"
      class="border-ink-200 flex items-start gap-4 border-b px-5 py-4"
    >
      <div class="min-w-0 flex-1">
        <slot name="header">
          <h2 class="text-title truncate text-sm font-semibold">
            {{ title }}
          </h2>
          <p v-if="description" class="text-muted mt-0.5 text-xs">
            {{ description }}
          </p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <div :class="flush ? '' : 'px-5 py-4'">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="border-ink-200 bg-ink-100/60 border-t px-5 py-3"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>
