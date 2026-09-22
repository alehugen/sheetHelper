<script setup>
import { useI18n } from 'vue-i18n'

import { JobStatus } from '@/application/ReceiptJob'

import AppButton from '../ui/AppButton.vue'
import AppIcon from '../ui/AppIcon.vue'
import AppProgress from '../ui/AppProgress.vue'

defineProps({
  jobs: { type: Array, required: true },
})

const emit = defineEmits(['retry', 'remove'])

const { t } = useI18n()
</script>

<template>
  <ul class="divide-ink-200 divide-y">
    <li
      v-for="job in jobs"
      :key="job.id"
      class="flex items-center gap-3 px-1 py-3"
    >
      <AppIcon
        :name="job.status === JobStatus.FAILED ? 'alert' : 'file'"
        :size="18"
        :class="job.status === JobStatus.FAILED ? 'text-danger' : 'text-subtle'"
      />

      <div class="min-w-0 flex-1">
        <p class="text-body truncate text-xs font-medium">
          {{ job.fileName }}
        </p>

        <p v-if="job.status === JobStatus.FAILED" class="text-danger text-xs">
          {{ job.error }}
        </p>
        <AppProgress
          v-else
          class="mt-1.5"
          :value="job.progress * 100"
          :indeterminate="job.status === JobStatus.QUEUED"
        />
      </div>

      <AppButton
        v-if="job.status === JobStatus.FAILED"
        size="sm"
        variant="secondary"
        @click="emit('retry', job.id)"
      >
        {{ t('common.retry') }}
      </AppButton>

      <button
        type="button"
        class="text-subtle hover:text-danger rounded p-1 transition-colors"
        :aria-label="t('common.remove')"
        @click="emit('remove', job.id)"
      >
        <AppIcon name="x" :size="15" />
      </button>
    </li>
  </ul>
</template>
