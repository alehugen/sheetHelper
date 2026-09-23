<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AppIcon from '../ui/AppIcon.vue'
import { useReceiptsStore } from '../../stores/receipts'

const { t } = useI18n()
const route = useRoute()
const receipts = useReceiptsStore()
const { rows } = storeToRefs(receipts)

const ORDER = ['upload', 'review', 'fill']

const currentIndex = computed(() => {
  const index = ORDER.indexOf(route.name)
  return index === -1 ? 0 : index
})

const unlocked = computed(() => rows.value.length > 0)

const steps = computed(() =>
  ORDER.map((name, index) => ({
    name,
    index,
    label: t(`steps.${name}`),
    hint: t(`steps.${name}Hint`),
    available: index === 0 || unlocked.value,
    done: index < currentIndex.value && (index === 0 || unlocked.value),
    current: index === currentIndex.value,
  })),
)
</script>

<template>
  <nav class="flex items-start gap-1 sm:gap-2" :aria-label="t('steps.upload')">
    <template v-for="step in steps" :key="step.name">
      <div
        v-if="step.index"
        class="bg-ink-200 relative mt-4 h-0.5 flex-1 overflow-hidden rounded-full"
      >
        <span
          class="bg-ink-500 absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :style="{ width: step.done || step.current ? '100%' : '0%' }"
        />
      </div>

      <component
        :is="step.available ? 'RouterLink' : 'div'"
        :to="step.available ? { name: step.name } : undefined"
        class="group flex min-w-0 shrink-0 flex-col items-center gap-1.5 text-center"
        :class="[
          step.available ? 'cursor-pointer' : 'cursor-not-allowed',
          !step.available && 'opacity-45',
        ]"
        :aria-current="step.current ? 'step' : undefined"
        :title="step.available ? step.hint : t('steps.locked')"
      >
        <span
          class="relative flex size-9 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :class="
            step.current
              ? 'border-ink-800 bg-ink-800 text-ink-50 shadow-raised scale-110'
              : step.done
                ? 'border-ink-500 bg-ink-500 text-ink-50'
                : 'border-ink-300 bg-ink-50 text-subtle group-hover:border-ink-400'
          "
        >
          <Transition name="fade" mode="out-in">
            <AppIcon v-if="step.done" key="done" name="check" :size="16" />
            <span v-else key="number">{{ step.index + 1 }}</span>
          </Transition>
        </span>

        <span class="flex flex-col">
          <span
            class="text-[11px] font-semibold transition-colors duration-300 sm:text-xs"
            :class="step.current ? 'text-title' : 'text-muted'"
          >
            {{ step.label }}
          </span>
          <span class="text-subtle hidden text-[10px] sm:block">
            {{ step.hint }}
          </span>
        </span>
      </component>
    </template>
  </nav>
</template>
