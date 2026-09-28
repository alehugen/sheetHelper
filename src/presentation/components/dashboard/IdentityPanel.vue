<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatDocument } from '@/domain/shared/document'
import AppBadge from '@/presentation/components/ui/AppBadge.vue'
import AppButton from '@/presentation/components/ui/AppButton.vue'
import AppCard from '@/presentation/components/ui/AppCard.vue'
import { useIdentityStore } from '@/presentation/stores/identity'

const { t } = useI18n()
const identity = useIdentityStore()

const draft = ref('')
const invalid = ref(false)

function submit() {
  invalid.value = !identity.addDocument(draft.value)
  if (!invalid.value) draft.value = ''
}

function accountsOf(party) {
  return party.accounts.map((entry) =>
    entry.split('|').filter(Boolean).join(' · '),
  )
}
</script>

<template>
  <AppCard
    :title="t('dashboard.identity.title')"
    :description="t('dashboard.identity.hint')"
  >
    <form class="flex flex-wrap items-start gap-2" @submit.prevent="submit">
      <div class="min-w-48 flex-1">
        <input
          v-model="draft"
          type="text"
          inputmode="numeric"
          :placeholder="t('dashboard.identity.placeholder')"
          :aria-invalid="invalid"
          class="border-ink-300 bg-ink-50 text-body rounded-control focus:border-ink-500 w-full border px-3 py-2 text-sm transition-colors duration-200"
          @input="invalid = false"
        />
        <p v-if="invalid" class="text-danger mt-1 text-xs">
          {{ t('dashboard.identity.invalid') }}
        </p>
      </div>
      <AppButton type="submit" size="sm" :disabled="!draft.trim()">
        {{ t('dashboard.identity.add') }}
      </AppButton>
    </form>

    <ul v-if="identity.documents.length" class="mt-3 flex flex-wrap gap-2">
      <li v-for="document in identity.documents" :key="document">
        <button
          type="button"
          class="border-ink-300 text-body hover:border-danger hover:text-danger rounded-control flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs transition-colors duration-200"
          :aria-label="t('dashboard.identity.remove')"
          @click="identity.removeDocument(document)"
        >
          {{ formatDocument(document) }}
          <span aria-hidden="true">&times;</span>
        </button>
      </li>
    </ul>

    <div class="border-ink-200 mt-5 border-t pt-4">
      <p class="text-muted text-xs">{{ t('dashboard.identity.pick') }}</p>

      <ul class="mt-3 grid gap-2 sm:grid-cols-2">
        <li v-for="party in identity.parties" :key="party.key">
          <label
            class="rounded-control flex cursor-pointer items-start gap-3 border px-3 py-2.5 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
            :class="
              identity.selected.includes(party.key)
                ? 'border-ink-500 bg-ink-100'
                : 'border-ink-200 hover:border-ink-400'
            "
          >
            <input
              type="checkbox"
              class="accent-ink-700 mt-0.5 size-4 shrink-0"
              :checked="identity.selected.includes(party.key)"
              @change="identity.toggle(party.key)"
            />
            <span class="min-w-0 flex-1">
              <span
                class="text-title flex items-center gap-2 text-sm font-medium"
              >
                <span class="truncate">{{ party.label }}</span>
                <AppBadge
                  v-if="identity.suggested.includes(party.key)"
                  tone="success"
                >
                  {{ t('dashboard.identity.matched') }}
                </AppBadge>
              </span>
              <span class="text-subtle mt-0.5 block truncate font-mono text-xs">
                {{
                  [
                    ...party.documents,
                    ...party.maskedDocuments,
                    ...accountsOf(party),
                  ].join(' · ') || '—'
                }}
              </span>
              <span class="text-muted mt-1 block text-xs">
                {{
                  t('dashboard.identity.counts', {
                    rows: party.rows,
                    payer: party.asPayer,
                    payee: party.asPayee,
                  })
                }}
              </span>
            </span>
          </label>
        </li>
      </ul>

      <p v-if="identity.matchedBy.length" class="text-muted mt-3 text-xs">
        {{ t('dashboard.identity.matchedBy') }}
        <span
          v-for="(item, index) in identity.matchedBy"
          :key="item.level"
          class="text-body"
        >
          {{ index ? ' · ' : '' }}{{ item.count }}
          {{ t(`dashboard.matchLevel.${item.level}`) }}
        </span>
        <span v-if="identity.unresolved" class="text-subtle">
          ·
          {{
            t('dashboard.identity.unresolved', { count: identity.unresolved })
          }}
        </span>
      </p>
    </div>
  </AppCard>
</template>
