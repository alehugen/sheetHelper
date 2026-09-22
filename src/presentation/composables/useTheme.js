import { useColorMode, usePreferredDark } from '@vueuse/core'
import { computed } from 'vue'

export function useTheme() {
  const mode = useColorMode({
    attribute: 'data-theme',
    storageKey: 'ticketexport:theme',
    emitAuto: true,
    modes: { light: 'light', dark: 'dark' },
  })

  const preferredDark = usePreferredDark()

  const isDark = computed(
    () =>
      mode.value === 'dark' || (mode.value === 'auto' && preferredDark.value),
  )

  function toggle() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, toggle }
}
