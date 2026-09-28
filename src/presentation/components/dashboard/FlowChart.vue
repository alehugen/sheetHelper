<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { byPeriod, suggestUnit } from '@/domain/insights/aggregate'
import { useReceiptFormat } from '@/presentation/composables/useReceiptFormat'

const props = defineProps({
  entries: { type: Array, required: true },
})

const { t } = useI18n()
const { money, locale } = useReceiptFormat()

const unit = computed(() => suggestUnit(props.entries))
const buckets = computed(() => byPeriod(props.entries, unit.value))

const scale = computed(() =>
  Math.max(
    ...buckets.value.flatMap((bucket) => [bucket.credit, bucket.debit]),
    0,
  ),
)

const active = ref(null)

const MAX_LABELS = 12

const labelEvery = computed(() => Math.ceil(buckets.value.length / MAX_LABELS))

function showsLabel(index) {
  return index % labelEvery.value === 0
}

function height(value) {
  if (!scale.value) return 0
  return Math.max((value / scale.value) * 100, value > 0 ? 2 : 0)
}

const periodFormat = computed(
  () =>
    new Intl.DateTimeFormat(
      locale.value,
      unit.value === 'month'
        ? { year: '2-digit', month: 'short' }
        : { day: '2-digit', month: 'short' },
    ),
)

function periodLabel(key) {
  const date = new Date(
    `${unit.value === 'month' ? `${key}-01` : key}T12:00:00`,
  )
  if (Number.isNaN(date.getTime())) return key
  return periodFormat.value.format(date)
}
</script>

<template>
  <figure v-if="buckets.length" class="m-0">
    <figcaption class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-muted text-xs">{{ t(`dashboard.flow.unit.${unit}`) }}</p>
      <ul class="flex items-center gap-4">
        <li class="text-body flex items-center gap-1.5 text-xs">
          <span class="bg-chart-in size-2.5 rounded-xs" aria-hidden="true" />
          {{ t('dashboard.kpi.in') }}
        </li>
        <li class="text-body flex items-center gap-1.5 text-xs">
          <span class="bg-chart-out size-2.5 rounded-xs" aria-hidden="true" />
          {{ t('dashboard.kpi.out') }}
        </li>
      </ul>
    </figcaption>

    <div class="relative mt-4 flex items-stretch gap-1.5" style="height: 15rem">
      <div
        v-for="bucket in buckets"
        :key="bucket.key"
        class="group relative flex min-w-0 flex-1 flex-col"
        @mouseenter="active = bucket.key"
        @mouseleave="active = null"
        @focusin="active = bucket.key"
        @focusout="active = null"
      >
        <button
          type="button"
          class="absolute inset-0 z-10 cursor-default rounded-sm"
          :aria-label="`${periodLabel(bucket.key)}: ${t('dashboard.kpi.in')} ${money(bucket.credit)}, ${t('dashboard.kpi.out')} ${money(bucket.debit)}`"
        />

        <div class="flex flex-1 items-end pb-px">
          <div
            class="bg-chart-in w-full rounded-t-[4px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            :style="{ height: `${height(bucket.credit)}%` }"
            :class="active && active !== bucket.key ? 'opacity-40' : ''"
          />
        </div>

        <div class="bg-chart-grid h-px w-full" aria-hidden="true" />

        <div class="flex flex-1 items-start pt-px">
          <div
            class="bg-chart-out w-full rounded-b-[4px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            :style="{ height: `${height(bucket.debit)}%` }"
            :class="active && active !== bucket.key ? 'opacity-40' : ''"
          />
        </div>

        <Transition name="fade">
          <div
            v-if="active === bucket.key"
            class="border-ink-300 bg-ink-50 shadow-raised rounded-control pointer-events-none absolute -top-2 left-1/2 z-20 w-40 -translate-x-1/2 -translate-y-full border px-3 py-2"
          >
            <p class="text-title text-xs font-semibold">
              {{ periodLabel(bucket.key) }}
            </p>
            <dl class="mt-1.5 space-y-0.5 text-xs">
              <div class="flex justify-between gap-3">
                <dt class="text-muted">{{ t('dashboard.kpi.in') }}</dt>
                <dd class="text-body tabular-nums">
                  {{ money(bucket.credit) }}
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">{{ t('dashboard.kpi.out') }}</dt>
                <dd class="text-body tabular-nums">
                  {{ money(bucket.debit) }}
                </dd>
              </div>
              <div
                class="border-ink-200 flex justify-between gap-3 border-t pt-0.5"
              >
                <dt class="text-muted">{{ t('dashboard.kpi.net') }}</dt>
                <dd class="text-title font-medium tabular-nums">
                  {{ money(bucket.net) }}
                </dd>
              </div>
            </dl>
          </div>
        </Transition>
      </div>
    </div>

    <ul class="mt-2 flex items-stretch gap-1.5">
      <li
        v-for="(bucket, index) in buckets"
        :key="bucket.key"
        class="text-subtle min-w-0 flex-1 truncate text-center text-[11px]"
      >
        {{ showsLabel(index) ? periodLabel(bucket.key) : '' }}
      </li>
    </ul>
  </figure>
</template>
