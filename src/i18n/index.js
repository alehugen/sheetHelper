import { createI18n } from 'vue-i18n'

const modules = import.meta.glob('./locales/*.json', { eager: true })

function codeFromPath(path) {
  return path.match(/([\w-]+)\.json$/)[1]
}

const messages = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [
    codeFromPath(path),
    module.default ?? module,
  ]),
)

export const DEFAULT_LOCALE = 'pt-BR'

export const SUPPORTED_LOCALES = Object.entries(messages)
  .map(([code, value]) => ({ code, label: value._meta?.label ?? code }))
  .sort((a, b) =>
    a.code === DEFAULT_LOCALE ? -1 : a.label.localeCompare(b.label),
  )

export function isSupportedLocale(code) {
  return Object.hasOwn(messages, code)
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

export const { t } = i18n.global
