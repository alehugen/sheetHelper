<script setup>
import { onKeyStroke, useScrollLock } from '@vueuse/core'
import { watch } from 'vue'

import AppIcon from './AppIcon.vue'

const props = defineProps({
  title: { type: String, default: '' },
  closeLabel: { type: String, default: 'Fechar' },
})

const open = defineModel('open', { type: Boolean, default: false })

const locked = useScrollLock(document.body)
watch(open, (value) => {
  locked.value = value
})

onKeyStroke('Escape', () => {
  if (open.value) open.value = false
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
      >
        <div
          class="bg-ink-800/50 absolute inset-0 backdrop-blur-sm"
          @click="open = false"
        />

        <div
          class="border-ink-200 bg-ink-50 rounded-card shadow-raised relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden border"
        >
          <header
            class="border-ink-200 flex items-center gap-4 border-b px-5 py-3"
          >
            <h2 class="text-title flex-1 truncate text-sm font-semibold">
              {{ props.title }}
            </h2>
            <button
              type="button"
              class="text-subtle hover:bg-ink-100 hover:text-body rounded-control p-1.5 transition-colors"
              :aria-label="props.closeLabel"
              @click="open = false"
            >
              <AppIcon name="x" :size="16" />
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-auto">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
