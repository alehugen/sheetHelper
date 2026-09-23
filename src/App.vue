<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView } from 'vue-router'

import AppFooter from './presentation/components/layout/AppFooter.vue'
import AppSettings from './presentation/components/layout/AppSettings.vue'

const { t } = useI18n()

const nav = computed(() => [
  { to: { name: 'upload' }, label: t('nav.upload') },
  { to: { name: 'review' }, label: t('nav.review') },
  { to: { name: 'history' }, label: t('nav.history') },
])
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <header class="border-ink-200 bg-ink-50 border-b">
      <div
        class="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6"
      >
        <RouterLink
          :to="{ name: 'upload' }"
          class="text-title flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <img
            src="/icon.svg"
            alt=""
            class="logo-mark size-7 shrink-0"
            width="28"
            height="28"
          />
          <span class="logo-type"
            >ticket<span class="text-subtle">Export</span></span
          >
        </RouterLink>

        <nav class="ml-auto flex items-center gap-1">
          <RouterLink
            v-for="item in nav"
            :key="item.label"
            :to="item.to"
            class="text-muted hover:bg-ink-100 hover:text-body rounded-control px-3 py-1.5 text-sm font-medium transition-colors"
            active-class="!bg-ink-200 !text-title"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <AppSettings />
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />
  </div>
</template>
