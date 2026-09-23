<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ACCEPTED_TYPES } from '@/infrastructure/extraction'

import SpreadsheetMapping from '../components/spreadsheet/SpreadsheetMapping.vue'
import AppBadge from '../components/ui/AppBadge.vue'
import AppCard from '../components/ui/AppCard.vue'
import AppDropzone from '../components/ui/AppDropzone.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import { useReceiptIntake } from '../composables/useReceiptIntake'
import { FlowMode, useTemplateStore } from '../stores/template'

const { t } = useI18n()
const { rejected, accept, dismissRejected } = useReceiptIntake()

const template = useTemplateStore()
const { mode, isLoaded, error } = storeToRefs(template)

const isFillMode = computed(() => mode.value === FlowMode.FILL)
const canReceive = computed(() => !isFillMode.value || isLoaded.value)

const steps = computed(() =>
  [1, 2, 3].map((index) => ({
    icon: ['upload', 'refresh', 'sheet'][index - 1],
    title: t(`upload.step${index}Title`),
    text: t(`upload.step${index}Text`),
  })),
)

function acceptTemplate(files) {
  if (files[0]) template.load(files[0])
}
</script>

<template>
  <div class="space-y-8">
    <header class="max-w-2xl space-y-3">
      <AppBadge>{{ t('upload.badge') }}</AppBadge>
      <h1 class="text-title text-3xl font-semibold tracking-tight">
        {{ t('upload.title') }}
      </h1>
      <p class="text-muted text-sm leading-relaxed">
        {{ t('upload.description') }}
      </p>
    </header>

    <div
      class="border-ink-200 bg-ink-100 rounded-control inline-flex gap-1 border p-1"
    >
      <button
        v-for="option in [FlowMode.NEW, FlowMode.FILL]"
        :key="option"
        type="button"
        class="rounded-control px-4 py-1.5 text-sm font-medium transition-colors"
        :class="
          mode === option
            ? 'bg-ink-50 text-title shadow-soft'
            : 'text-muted hover:text-title'
        "
        @click="mode = option"
      >
        {{ option === FlowMode.NEW ? t('fill.modeNew') : t('fill.modeFill') }}
      </button>
    </div>

    <SpreadsheetMapping v-if="isFillMode && isLoaded" />

    <AppDropzone
      v-else-if="isFillMode"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      :multiple="false"
      :title="t('fill.dropTitle')"
      :description="t('fill.dropDescription')"
      @files="acceptTemplate"
    />

    <p
      v-if="error"
      class="rounded-card border-danger/30 bg-danger-soft text-danger border px-4 py-3 text-xs"
    >
      {{ error }}
    </p>

    <AppDropzone
      :accept="ACCEPTED_TYPES"
      :disabled="!canReceive"
      :title="t('upload.dropTitle')"
      :description="
        canReceive ? t('upload.dropDescription') : t('fill.needTemplate')
      "
      @files="accept"
    />

    <div
      v-if="rejected.length"
      class="rounded-card border-warning/30 bg-warning-soft text-warning flex items-start gap-3 border px-4 py-3 text-xs"
    >
      <AppIcon name="alert" :size="16" class="mt-0.5" />
      <div class="flex-1">
        <p class="font-medium">{{ t('upload.rejectedTitle') }}</p>
        <p class="mt-0.5 opacity-80">{{ rejected.join(', ') }}</p>
      </div>
      <button
        type="button"
        class="opacity-60 hover:opacity-100"
        :aria-label="t('common.close')"
        @click="dismissRejected"
      >
        <AppIcon name="x" :size="14" />
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <AppCard v-for="(step, index) in steps" :key="step.title">
        <div class="flex items-start gap-3">
          <div
            class="bg-ink-100 text-muted flex size-8 shrink-0 items-center justify-center rounded-full"
          >
            <AppIcon :name="step.icon" :size="16" />
          </div>
          <div class="space-y-1">
            <p class="text-body text-xs font-semibold">
              {{ index + 1 }}. {{ step.title }}
            </p>
            <p class="text-muted text-xs leading-relaxed">{{ step.text }}</p>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
