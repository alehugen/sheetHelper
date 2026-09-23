<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ACCEPTED_TYPES } from '@/infrastructure/extraction'

import AppBadge from '../components/ui/AppBadge.vue'
import AppCard from '../components/ui/AppCard.vue'
import AppDropzone from '../components/ui/AppDropzone.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import { useReceiptIntake } from '../composables/useReceiptIntake'

const { t } = useI18n()
const { rejected, accept, dismissRejected } = useReceiptIntake()

const steps = computed(() =>
  [1, 2, 3].map((index) => ({
    icon: ['upload', 'refresh', 'sheet'][index - 1],
    title: t(`upload.step${index}Title`),
    text: t(`upload.step${index}Text`),
  })),
)
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

    <AppDropzone
      :accept="ACCEPTED_TYPES"
      :title="t('upload.dropTitle')"
      :description="t('upload.dropDescription')"
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
