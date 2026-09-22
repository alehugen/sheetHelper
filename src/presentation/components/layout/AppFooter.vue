<script setup>
import { useI18n } from 'vue-i18n'

import AppIcon from '../ui/AppIcon.vue'

const { t } = useI18n()

const LINKEDIN_URL = 'https://www.linkedin.com/in/alehugen'
</script>

<template>
  <footer class="border-ink-200 border-t py-6">
    <div
      class="text-subtle mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 text-xs sm:flex-row sm:justify-between sm:px-6"
    >
      <p>{{ t('footer') }}</p>

      <a
        :href="LINKEDIN_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:bg-ink-200 hover:text-title rounded-control inline-flex items-center gap-1.5 px-2 py-1 font-medium transition-colors"
      >
        <AppIcon name="linkedin" :size="15" />
        <span>Alessandro Hugen</span>
      </a>
    </div>
  </footer>
</template>
