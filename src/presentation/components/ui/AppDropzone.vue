<script setup>
import { useDropZone, useFileDialog } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'

import AppIcon from './AppIcon.vue'

const props = defineProps({
  accept: { type: String, default: '*/*' },
  multiple: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  title: { type: String, default: 'Arraste seus arquivos aqui' },
  description: { type: String, default: '' },
})

const emit = defineEmits(['files'])

const zone = useTemplateRef('zone')

const acceptedTypes = computed(() =>
  props.accept === '*/*'
    ? null
    : props.accept
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
)

function emitFiles(files) {
  if (props.disabled) return
  const list = Array.from(files ?? []).filter(Boolean)
  if (list.length) emit('files', list)
}

const { isOverDropZone } = useDropZone(zone, {
  multiple: props.multiple,
  preventDefaultForUnhandled: true,
  onDrop: emitFiles,
})

const { open, onChange, reset } = useFileDialog({
  accept: props.accept,
  multiple: props.multiple,
  reset: true,
})

onChange((files) => {
  emitFiles(files)
  reset()
})

const isActive = computed(() => isOverDropZone.value && !props.disabled)
</script>

<template>
  <div
    ref="zone"
    role="button"
    tabindex="0"
    :aria-disabled="disabled || undefined"
    class="rounded-card flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
    :class="[
      isActive
        ? 'border-ink-500 bg-ink-200 scale-[1.01]'
        : 'border-ink-300 bg-ink-50 hover:border-ink-400 hover:bg-ink-100/70',
      disabled && 'pointer-events-none opacity-50',
    ]"
    @click="open()"
    @keydown.enter.prevent="open()"
    @keydown.space.prevent="open()"
  >
    <div
      class="flex size-12 items-center justify-center rounded-full transition-colors"
      :class="isActive ? 'bg-ink-600 text-ink-50' : 'bg-ink-100 text-subtle'"
    >
      <AppIcon name="upload" :size="22" />
    </div>

    <div class="space-y-1">
      <p class="text-body text-sm font-medium">{{ title }}</p>
      <p v-if="description" class="text-subtle text-xs">{{ description }}</p>
      <p v-if="acceptedTypes" class="text-subtle font-mono text-[11px]">
        {{ acceptedTypes.join(' · ') }}
      </p>
    </div>

    <slot />
  </div>
</template>
