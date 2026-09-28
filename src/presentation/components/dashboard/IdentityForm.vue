<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatDocument, maskDocument } from '@/domain/shared/document'
import AppBadge from '@/presentation/components/ui/AppBadge.vue'
import { useIdentityStore } from '@/presentation/stores/identity'

const { t } = useI18n()
const identity = useIdentityStore()

const showAll = ref(false)

function onDocumentInput(event) {
  const masked = maskDocument(event.target.value)
  identity.documentFilter = masked
  event.target.value = masked
}

function accountsOf(party) {
  return party.accounts.map((entry) =>
    entry.split('|').filter(Boolean).join(' · '),
  )
}

function detailsOf(party) {
  return [
    ...party.documents.map(formatDocument),
    ...party.maskedDocuments,
    ...accountsOf(party),
  ].join(' · ')
}
</script>

<template>
  <div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label
          class="text-muted block text-xs font-medium"
          for="identity-document"
        >
          {{ t('dashboard.identity.documentLabel') }}
        </label>
        <input
          id="identity-document"
          :value="identity.documentFilter"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          maxlength="18"
          :placeholder="t('dashboard.identity.placeholder')"
          class="border-ink-300 bg-ink-50 text-body rounded-control focus:border-ink-500 mt-1 w-full border px-3 py-2 font-mono text-sm transition-colors duration-200"
          @input="onDocumentInput"
        />
      </div>

      <div>
        <label class="text-muted block text-xs font-medium" for="identity-name">
          {{ t('dashboard.identity.nameLabel') }}
        </label>
        <input
          id="identity-name"
          v-model="identity.nameFilter"
          type="text"
          autocomplete="off"
          :placeholder="t('dashboard.identity.namePlaceholder')"
          class="border-ink-300 bg-ink-50 text-body rounded-control focus:border-ink-500 mt-1 w-full border px-3 py-2 text-sm transition-colors duration-200"
        />
      </div>
    </div>

    <p class="text-muted mt-4 text-xs">
      {{
        identity.isFiltering
          ? t('dashboard.identity.pickFiltered')
          : t('dashboard.identity.pick')
      }}
    </p>

    <p
      v-if="identity.isFiltering && !identity.listedParties.length"
      class="text-warning mt-2 text-xs"
    >
      {{ t('dashboard.identity.noMatch') }}
    </p>

    <ul class="mt-2 grid gap-2 sm:grid-cols-2">
      <li
        v-for="party in showAll ? identity.parties : identity.listedParties"
        :key="party.key"
      >
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
            <span
              v-if="detailsOf(party)"
              class="text-subtle mt-0.5 block truncate font-mono text-xs"
            >
              {{ detailsOf(party) }}
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

    <button
      v-if="identity.parties.length > identity.listedParties.length"
      type="button"
      class="text-subtle hover:text-body mt-3 text-xs underline underline-offset-2 transition-colors duration-200"
      @click="showAll = !showAll"
    >
      {{
        showAll
          ? t('dashboard.identity.showLess')
          : t('dashboard.identity.showAll', { count: identity.parties.length })
      }}
    </button>

    <p v-if="identity.matchedBy.length" class="text-muted mt-4 text-xs">
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
        {{ t('dashboard.identity.unresolved', { count: identity.unresolved }) }}
      </span>
    </p>
  </div>
</template>
