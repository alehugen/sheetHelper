<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ReceiptPreview from '../components/receipts/ReceiptPreview.vue'
import ReceiptTable from '../components/receipts/ReceiptTable.vue'
import ColumnAssignments from '../components/spreadsheet/ColumnAssignments.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppCard from '../components/ui/AppCard.vue'
import AppDropzone from '../components/ui/AppDropzone.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AppModal from '../components/ui/AppModal.vue'
import { useSpreadsheetFill } from '../composables/useSpreadsheetFill'
import { useReceiptsStore } from '../stores/receipts'
import { useTemplateStore } from '../stores/template'

const { t } = useI18n()
const template = useTemplateStore()
const receipts = useReceiptsStore()
const { isLoaded, fileName, sheets, totalRows, error } = storeToRefs(template)
const {
  fillRows,
  blocked,
  missingAssignments,
  canFill,
  isFilling,
  error: fillError,
  done,
  fill,
} = useSpreadsheetFill()

const destinations = computed(() => {
  const groups = new Map()
  for (const row of fillRows.value) {
    if (!groups.has(row.sheetIndex)) {
      groups.set(row.sheetIndex, { count: 0, from: row.targetRow })
    }
    groups.get(row.sheetIndex).count += 1
  }
  return [...groups.entries()].map(([index, info]) => ({
    name: sheets.value[index]?.name ?? '',
    ...info,
  }))
})

const previewId = ref(null)
const previewJob = computed(
  () => receipts.jobs.find((job) => job.id === previewId.value) ?? null,
)
const isPreviewOpen = computed({
  get: () => previewJob.value !== null,
  set: (value) => {
    if (!value) previewId.value = null
  },
})

const missingLabels = computed(() =>
  missingAssignments.value.map((field) => t(`fields.${field}`)).join(', '),
)

function accept(files) {
  if (files[0]) template.load(files[0])
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-title text-2xl font-semibold tracking-tight">
          {{ t('fill.goToFill') }}
        </h1>
        <p class="text-muted text-sm">{{ t('fill.columnsHint') }}</p>
      </div>

      <div class="flex items-center gap-2">
        <AppButton
          variant="ghost"
          size="sm"
          :as="'router-link'"
          :to="{ name: 'review' }"
        >
          {{ t('fill.back') }}
        </AppButton>
        <AppButton :loading="isFilling" :disabled="!canFill" @click="fill">
          <template #icon><AppIcon name="sheet" /></template>
          {{ t('fill.button') }}
        </AppButton>
      </div>
    </header>

    <Transition name="fade" mode="out-in">
      <p
        v-if="error || fillError"
        class="rounded-card border-danger/30 bg-danger-soft text-danger border px-4 py-3 text-xs"
      >
        {{ error || fillError }}
      </p>
      <p
        v-else-if="done"
        class="rounded-card border-success/30 bg-success-soft text-success border px-4 py-3 text-xs"
      >
        {{ t('fill.done', { count: done }) }}
      </p>
      <p
        v-else-if="!receipts.rows.length"
        class="rounded-card border-warning/30 bg-warning-soft text-warning border px-4 py-3 text-xs"
      >
        {{ t('fill.noRows') }}
      </p>
    </Transition>

    <Transition name="slide-fade" mode="out-in">
      <AppDropzone
        v-if="!isLoaded"
        key="drop"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        :multiple="false"
        :title="t('fill.dropTitle')"
        :description="t('fill.dropDescription')"
        @files="accept"
      />

      <div v-else key="loaded" class="space-y-5">
        <AppCard>
          <div class="flex flex-wrap items-center gap-3">
            <AppIcon name="sheet" :size="18" class="text-subtle shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-title truncate text-sm font-semibold">
                {{ fileName }}
              </p>
              <p class="text-muted mt-0.5 text-xs">
                {{
                  t('fill.loaded', { sheets: sheets.length, rows: totalRows })
                }}
              </p>
            </div>
            <AppButton size="sm" variant="ghost" @click="template.reset()">
              {{ t('fill.replace') }}
            </AppButton>
          </div>
        </AppCard>

        <section class="space-y-3">
          <h2 class="text-title text-sm font-semibold">
            {{ t('fill.columnsTitle') }}
          </h2>
          <ColumnAssignments :receipts="receipts.receipts" />
        </section>

        <Transition name="fade">
          <p v-if="missingAssignments.length" class="text-warning text-xs">
            {{ t('fill.missingRequired', { fields: missingLabels }) }}
          </p>
        </Transition>

        <Transition name="fade">
          <p v-if="blocked.length" class="text-warning text-xs">
            {{ t('review.incomplete', { count: blocked.length }) }}
          </p>
        </Transition>

        <AppCard v-if="fillRows.length" flush>
          <template #header>
            <h2 class="text-title text-sm font-semibold">
              {{ t('review.tableTitle') }}
            </h2>
            <p class="text-muted mt-0.5 text-xs">{{ t('fill.columnsHint') }}</p>
          </template>

          <ReceiptTable
            :rows="fillRows"
            :sheets="sheets"
            @update="receipts.updateField"
            @remove="receipts.removeRow"
            @sheet="receipts.setSheetOverride"
            @preview="previewId = $event"
          />
        </AppCard>

        <Transition name="fade">
          <p v-if="destinations.length" class="text-muted text-xs">
            <span
              v-for="(destination, index) in destinations"
              :key="destination.name"
            >
              <template v-if="index">· </template>
              {{ destination.count }} ×
              <strong>{{ destination.name }}</strong> ({{ t('fill.targetRow') }}
              {{ destination.from }})
            </span>
          </p>
        </Transition>
      </div>
    </Transition>

    <AppModal
      v-model:open="isPreviewOpen"
      :title="previewJob?.fileName ?? t('preview.title')"
      :close-label="t('common.close')"
    >
      <ReceiptPreview v-if="previewJob" :job="previewJob" />
    </AppModal>
  </div>
</template>
