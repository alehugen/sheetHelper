<script setup>
import { useObjectUrl } from '@vueuse/core'
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { warningMessage } from '@/domain/receipt/ReceiptWarning'

import AppIcon from '../ui/AppIcon.vue'

const props = defineProps({
  job: { type: Object, required: true },
})

const { t } = useI18n()

const file = toRef(() => props.job.file)
const url = useObjectUrl(file)

const isImage = computed(() => props.job.file?.type?.startsWith('image/'))
const isPdf = computed(() => props.job.file?.type === 'application/pdf')
</script>

<template>
  <div class="grid gap-0 md:grid-cols-2">
    <div class="bg-ink-100 flex items-start justify-center p-4">
      <img
        v-if="isImage && url"
        :src="url"
        :alt="job.fileName"
        class="rounded-control shadow-soft max-h-[70vh] w-auto max-w-full object-contain"
      />
      <iframe
        v-else-if="isPdf && url"
        :src="url"
        :title="job.fileName"
        class="rounded-control h-[70vh] w-full border-0 bg-white"
      />
      <p v-else class="text-subtle py-12 text-center text-xs">
        {{ t('preview.unsupported') }}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-3 p-5">
      <div
        v-for="code in job.warnings"
        :key="code"
        class="rounded-control border-warning/30 bg-warning-soft text-warning flex items-start gap-2 border px-3 py-2 text-xs"
      >
        <AppIcon name="alert" :size="14" class="mt-0.5" />
        <span>{{ warningMessage(code, t) }}</span>
      </div>

      <p class="text-subtle text-[11px] font-medium tracking-wide uppercase">
        {{ t('preview.extracted') }}
      </p>
      <pre
        class="text-muted bg-ink-100 rounded-control max-h-[60vh] flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
        >{{ job.rawText || t('preview.empty') }}</pre>
    </div>
  </div>
</template>
