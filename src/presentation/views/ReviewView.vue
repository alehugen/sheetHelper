<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { SpreadsheetFormat } from '@/application/ports/SpreadsheetWriter'
import { ACCEPTED_TYPES } from '@/infrastructure/extraction'

import ProcessingPanel from '../components/receipts/ProcessingPanel.vue'
import ReceiptPreview from '../components/receipts/ReceiptPreview.vue'
import ReceiptTable from '../components/receipts/ReceiptTable.vue'
import AppBadge from '../components/ui/AppBadge.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppCard from '../components/ui/AppCard.vue'
import AppDropzone from '../components/ui/AppDropzone.vue'
import AppEmptyState from '../components/ui/AppEmptyState.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AppModal from '../components/ui/AppModal.vue'
import AppProgress from '../components/ui/AppProgress.vue'
import { useReceiptFormat } from '../composables/useReceiptFormat'
import { useReceiptIntake } from '../composables/useReceiptIntake'
import { useSpreadsheetExport } from '../composables/useSpreadsheetExport'
import { useReceiptsStore } from '../stores/receipts'

const { t } = useI18n()
const store = useReceiptsStore()
const router = useRouter()
const { accept } = useReceiptIntake()
const { money } = useReceiptFormat()
const { isExporting, pendingFormat, error, exportReceipts } =
  useSpreadsheetExport()

const {
  jobs,
  readyJobs,
  pendingJobs,
  failedJobs,
  incompleteJobs,
  warnedJobs,
  receipts,
  totalAmount,
  overallProgress,
  isRunning,
} = storeToRefs(store)

const previewId = ref(null)
const previewJob = computed(
  () => readyJobs.value.find((job) => job.id === previewId.value) ?? null,
)
const isPreviewOpen = computed({
  get: () => previewJob.value !== null,
  set: (value) => {
    if (!value) previewId.value = null
  },
})

const unfinished = computed(() => [...pendingJobs.value, ...failedJobs.value])

const attention = computed(
  () => new Set([...incompleteJobs.value, ...warnedJobs.value]).size,
)

const stats = computed(() => [
  { label: t('review.statRead'), value: String(readyJobs.value.length) },
  { label: t('review.statTotal'), value: money(totalAmount.value) },
  { label: t('review.statAttention'), value: String(attention.value) },
])

function startOver() {
  store.reset()
  router.push({ name: 'upload' })
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-title text-2xl font-semibold tracking-tight">
          {{ t('review.title') }}
        </h1>
        <p class="text-muted text-sm">{{ t('review.description') }}</p>
      </div>

      <div class="flex items-center gap-2">
        <AppButton variant="ghost" size="sm" @click="startOver">
          {{ t('review.restart') }}
        </AppButton>
        <AppButton
          variant="secondary"
          :loading="isExporting && pendingFormat === SpreadsheetFormat.CSV"
          :disabled="!readyJobs.length || isExporting"
          @click="exportReceipts(receipts, SpreadsheetFormat.CSV)"
        >
          <template #icon><AppIcon name="download" /></template>
          CSV
        </AppButton>
        <AppButton
          :loading="isExporting && pendingFormat === SpreadsheetFormat.XLSX"
          :disabled="!readyJobs.length || isExporting"
          @click="exportReceipts(receipts, SpreadsheetFormat.XLSX)"
        >
          <template #icon><AppIcon name="sheet" /></template>
          {{ t('review.download') }}
        </AppButton>
      </div>
    </header>

    <p
      v-if="error"
      class="rounded-card border-danger/30 bg-danger-soft text-danger border px-4 py-3 text-xs"
    >
      {{ error }}
    </p>

    <div class="grid gap-4 sm:grid-cols-3">
      <AppCard v-for="stat in stats" :key="stat.label">
        <p class="text-subtle text-[11px] font-medium tracking-wide uppercase">
          {{ stat.label }}
        </p>
        <p class="text-title text-numeric mt-1 text-xl font-semibold">
          {{ stat.value }}
        </p>
      </AppCard>
    </div>

    <AppCard
      v-if="isRunning"
      :title="t('review.processingTitle')"
      :description="
        t('review.processingProgress', { percent: overallProgress })
      "
    >
      <AppProgress :value="overallProgress" />
    </AppCard>

    <AppCard
      v-if="unfinished.length"
      :title="t('review.queueTitle')"
      :description="t('review.queueCount', { count: unfinished.length })"
      flush
    >
      <div class="px-4">
        <ProcessingPanel
          :jobs="unfinished"
          @retry="store.retry"
          @remove="store.removeJob"
        />
      </div>
    </AppCard>

    <AppCard flush>
      <template #header>
        <div class="flex items-center gap-2">
          <h2 class="text-title text-sm font-semibold">
            {{ t('review.tableTitle') }}
          </h2>
          <AppBadge v-if="incompleteJobs.length" tone="warning">
            {{ t('review.incomplete', { count: incompleteJobs.length }) }}
          </AppBadge>
        </div>
        <p class="text-muted mt-0.5 text-xs">{{ t('review.tableHint') }}</p>
      </template>

      <ReceiptTable
        v-if="readyJobs.length"
        :jobs="readyJobs"
        @update="store.updateField"
        @remove="store.removeJob"
        @preview="previewId = $event"
      />
      <AppEmptyState
        v-else-if="!jobs.length"
        :title="t('review.emptyTitle')"
        :description="t('review.emptyDescription')"
      />
      <AppEmptyState
        v-else
        icon="clock"
        :title="t('review.waitingTitle')"
        :description="t('review.waitingDescription')"
      />
    </AppCard>

    <AppDropzone
      :accept="ACCEPTED_TYPES"
      :title="t('review.addMoreTitle')"
      :description="t('review.addMoreDescription')"
      @files="accept"
    />

    <AppModal
      v-model:open="isPreviewOpen"
      :title="previewJob?.fileName ?? t('preview.title')"
      :close-label="t('common.close')"
    >
      <ReceiptPreview v-if="previewJob" :job="previewJob" />
    </AppModal>
  </div>
</template>
