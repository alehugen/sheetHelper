<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import IdentityForm from '@/presentation/components/dashboard/IdentityForm.vue'
import AppCard from '@/presentation/components/ui/AppCard.vue'
import AppIcon from '@/presentation/components/ui/AppIcon.vue'
import { useIdentityStore } from '@/presentation/stores/identity'

const { t } = useI18n()
const identity = useIdentityStore()

const open = ref(false)
</script>

<template>
  <AppCard
    v-if="!identity.isReady"
    :title="t('dashboard.identity.title')"
    :description="t('dashboard.identity.hint')"
  >
    <IdentityForm />
  </AppCard>

  <div v-else class="border-ink-200 bg-ink-50 rounded-card border">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
      <p class="text-title min-w-0 flex-1 truncate text-sm font-medium">
        {{ identity.selectedParties.map((party) => party.label).join(' · ') }}
      </p>

      <p class="text-muted shrink-0 text-xs">
        {{
          t('dashboard.identity.summary', {
            accounts: identity.accountCount,
            resolved: identity.resolvedCount,
            total: identity.entries.length,
          })
        }}
      </p>

      <button
        type="button"
        class="text-subtle hover:bg-ink-100 hover:text-body rounded-control -mr-1.5 flex shrink-0 items-center gap-1 px-2 py-1 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] print:hidden"
        :aria-expanded="open"
        @click="open = !open"
      >
        {{ t('dashboard.identity.adjust') }}
        <AppIcon
          name="chevron"
          :size="14"
          class="transition-transform duration-200"
          :class="open ? 'rotate-180' : ''"
        />
      </button>
    </div>

    <Transition name="slide-fade">
      <div v-if="open" class="border-ink-200 border-t px-4 py-4 print:hidden">
        <IdentityForm />
      </div>
    </Transition>
  </div>
</template>
