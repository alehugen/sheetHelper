import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { container } from '@/container'

export const useHistoryStore = defineStore('history', () => {
  const entries = ref(container.historyStore.read())

  const isEmpty = computed(() => entries.value.length === 0)

  function refresh() {
    entries.value = container.historyStore.read()
  }

  function remove(id) {
    entries.value = container.historyStore.remove(id)
  }

  function clear() {
    entries.value = container.historyStore.clear()
  }

  return { entries, isEmpty, refresh, remove, clear }
})
