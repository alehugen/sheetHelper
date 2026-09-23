<script setup>
import { useI18n } from 'vue-i18n'

import { RECEIPT_FIELDS } from '@/domain/receipt/ReceiptFields'
import { warningMessage } from '@/domain/receipt/ReceiptWarning'

import { useReceiptFormat } from '../../composables/useReceiptFormat'
import AppBadge from '../ui/AppBadge.vue'
import AppIcon from '../ui/AppIcon.vue'
import AppSelect from '../ui/AppSelect.vue'
import EditableCell from './EditableCell.vue'

defineProps({
  rows: { type: Array, required: true },
  sheets: { type: Array, default: () => [] },
})

const emit = defineEmits(['update', 'remove', 'preview', 'sheet'])

const { t } = useI18n()
const { labels } = useReceiptFormat()

const fields = RECEIPT_FIELDS

function confidenceTone(value) {
  if (value >= 0.7) return 'success'
  if (value >= 0.4) return 'warning'
  return 'danger'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-left">
      <thead>
        <tr class="bg-ink-100 border-ink-200 border-b">
          <th
            class="text-muted bg-ink-100 sticky left-0 z-10 px-3 py-2 text-[11px] font-semibold tracking-wide uppercase"
          >
            {{ t('review.reading') }}
          </th>
          <th
            v-if="sheets.length"
            class="text-muted px-2 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase"
          >
            {{ t('fill.sheet') }}
          </th>
          <th
            v-for="field in fields"
            :key="field.key"
            class="text-muted px-2 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase"
            :style="{ minWidth: `${field.width * 7}px` }"
          >
            {{ labels[field.key] }}
          </th>
          <th class="w-20 px-2 py-2"></th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in rows"
          :key="row.key"
          class="border-ink-200 hover:bg-ink-100/50 border-b transition-colors"
        >
          <td class="bg-ink-50 sticky left-0 z-10 px-3 py-1.5">
            <div class="flex items-center gap-1.5">
              <AppBadge :tone="confidenceTone(row.confidence)">
                {{ Math.round(row.confidence * 100) }}%
              </AppBadge>
              <AppBadge
                v-for="code in row.warnings"
                :key="code"
                :tone="code === 'missing-required' ? 'warning' : 'danger'"
                :title="warningMessage(code, t)"
              >
                <AppIcon name="alert" :size="11" />
              </AppBadge>
            </div>
          </td>

          <td v-if="sheets.length" class="px-2 py-1 whitespace-nowrap">
            <div class="flex items-center gap-1.5">
              <AppSelect
                size="sm"
                :label="t('fill.sheet')"
                :options="
                  sheets.map((sheet, index) => ({
                    value: String(index),
                    label: sheet.name,
                  }))
                "
                :model-value="String(row.sheetIndex)"
                @update:model-value="
                  emit('sheet', row.jobId, row.index, Number($event))
                "
              />
              <span class="text-subtle text-numeric text-[11px]">
                {{ t('fill.targetRow') }} {{ row.targetRow }}
              </span>
            </div>
          </td>

          <td v-for="field in fields" :key="field.key" class="px-1 py-1">
            <EditableCell
              :field="field"
              :label="labels[field.key]"
              :model-value="row.receipt[field.key]"
              @update:model-value="
                emit('update', row.jobId, row.index, field.key, $event)
              "
            />
          </td>

          <td class="px-2 py-1">
            <div class="flex items-center gap-0.5">
              <button
                type="button"
                class="text-subtle hover:text-body rounded p-1 transition-colors"
                :aria-label="t('common.view')"
                @click="emit('preview', row.jobId)"
              >
                <AppIcon name="eye" :size="15" />
              </button>
              <button
                type="button"
                class="text-subtle hover:text-danger rounded p-1 transition-colors"
                :aria-label="t('common.remove')"
                @click="emit('remove', row.jobId, row.index)"
              >
                <AppIcon name="trash" :size="15" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
