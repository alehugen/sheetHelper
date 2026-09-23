<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { SpreadsheetFormat } from '@/application/ports/SpreadsheetWriter'

import AppBadge from '../components/ui/AppBadge.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppCard from '../components/ui/AppCard.vue'
import AppEmptyState from '../components/ui/AppEmptyState.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import { useReceiptFormat } from '../composables/useReceiptFormat'
import { useSpreadsheetExport } from '../composables/useSpreadsheetExport'
import { useHistoryStore } from '../stores/history'

const { t } = useI18n()
const { money, locale } = useReceiptFormat()

const history = useHistoryStore()
const { entries, isEmpty } = storeToRefs(history)
const { isExporting, downloadEntry } = useSpreadsheetExport()

onMounted(history.refresh)

const dateTime = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
)

function when(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateTime.value.format(date)
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-title text-2xl font-semibold tracking-tight">
          {{ t('history.title') }}
        </h1>
        <p class="text-muted text-sm">{{ t('history.description') }}</p>
      </div>
      <AppButton
        v-if="!isEmpty"
        variant="ghost"
        size="sm"
        @click="history.clear"
      >
        {{ t('history.clear') }}
      </AppButton>
    </header>

    <AppCard v-if="isEmpty" flush>
      <AppEmptyState
        icon="clock"
        :title="t('history.emptyTitle')"
        :description="t('history.emptyDescription')"
      >
        <AppButton :as="'router-link'" :to="{ name: 'upload' }" size="sm">
          {{ t('history.emptyCta') }}
        </AppButton>
      </AppEmptyState>
    </AppCard>

    <div v-else class="grid gap-4">
      <AppCard v-for="entry in entries" :key="entry.id">
        <div class="flex flex-wrap items-center gap-4">
          <div
            class="bg-ink-100 text-muted flex size-10 shrink-0 items-center justify-center rounded-full"
          >
            <AppIcon name="sheet" :size="18" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-2">
              <span class="text-title truncate font-mono text-xs font-medium">
                {{ entry.fileName }}
              </span>
              <AppBadge v-if="entry.target" tone="success">
                {{ t('history.filled') }}
              </AppBadge>
            </p>
            <p class="text-muted mt-0.5 text-xs">
              {{ when(entry.createdAt) }} ·
              {{ t('history.summary', { count: entry.count }) }} ·
              <span class="text-numeric">{{ money(entry.total) }}</span>
              <template v-if="entry.target?.sheets?.length">
                ·
                {{
                  t('history.intoSheets', {
                    sheets: entry.target.sheets.join(', '),
                  })
                }}
              </template>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <AppButton
              size="sm"
              variant="secondary"
              :disabled="isExporting"
              @click="downloadEntry(entry, SpreadsheetFormat.CSV)"
            >
              CSV
            </AppButton>
            <AppButton
              size="sm"
              :disabled="isExporting"
              @click="downloadEntry(entry, SpreadsheetFormat.XLSX)"
            >
              <template #icon><AppIcon name="download" /></template>
              XLSX
            </AppButton>
            <button
              type="button"
              class="text-subtle hover:text-danger rounded p-1.5 transition-colors"
              :aria-label="t('common.remove')"
              @click="history.remove(entry.id)"
            >
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
