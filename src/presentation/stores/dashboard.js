import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const CHARTS = ['flow', 'types', 'accounts']

export const useDashboardStore = defineStore('dashboard', () => {
  const hidden = useStorage('sheethelper:charts-hidden', [])

  function shows(chart) {
    return !hidden.value.includes(chart)
  }

  function toggle(chart) {
    hidden.value = shows(chart)
      ? [...hidden.value, chart]
      : hidden.value.filter((entry) => entry !== chart)
  }

  return { charts: CHARTS, shows, toggle }
})
