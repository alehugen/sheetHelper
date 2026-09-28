<script setup>
import { onClickOutside } from '@vueuse/core'
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/presentation/components/ui/AppIcon.vue'
import { useDashboardStore } from '@/presentation/stores/dashboard'

const { t } = useI18n()
const dashboard = useDashboardStore()

const open = ref(false)
const root = useTemplateRef('root')

onClickOutside(root, () => {
  open.value = false
})
</script>

<template>
  <div ref="root" class="relative print:hidden">
    <button
      type="button"
      class="border-ink-300 text-body hover:bg-ink-100 rounded-control flex items-center gap-1.5 border px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :aria-expanded="open"
      @click="open = !open"
    >
      <AppIcon name="sliders" :size="15" />
      {{ t('dashboard.toggles.button') }}
    </button>

    <Transition name="slide-fade">
      <div
        v-if="open"
        class="border-ink-200 bg-ink-50 shadow-raised rounded-card absolute right-0 z-20 mt-1.5 w-60 border p-1.5"
      >
        <p class="text-subtle px-2.5 pt-1 pb-1.5 text-xs">
          {{ t('dashboard.toggles.hint') }}
        </p>
        <label
          v-for="chart in dashboard.charts"
          :key="chart"
          class="text-body hover:bg-ink-100 rounded-control flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-sm transition-colors duration-150"
        >
          <input
            type="checkbox"
            class="accent-ink-700 size-3.5 shrink-0"
            :checked="dashboard.shows(chart)"
            @change="dashboard.toggle(chart)"
          />
          {{ t(`dashboard.charts.${chart}`) }}
        </label>
      </div>
    </Transition>
  </div>
</template>
