import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const CHARTS = [
  'flow',
  'counterparties',
  'types',
  'accounts',
  'concentration',
]

export const useDashboardStore = defineStore('dashboard', () => {
  const hidden = useStorage('sheethelper:charts-hidden', [])

  const visible = computed(() =>
    CHARTS.filter((chart) => !hidden.value.includes(chart)),
  )

  function shows(chart) {
    return !hidden.value.includes(chart)
  }

  function toggle(chart) {
    hidden.value = shows(chart)
      ? [...hidden.value, chart]
      : hidden.value.filter((entry) => entry !== chart)
  }

  return { charts: CHARTS, hidden, visible, shows, toggle }
})
