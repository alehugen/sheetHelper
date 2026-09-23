export const BASE_CURRENCY = 'BRL'

export const CURRENCIES = [
  { code: 'BRL', fractionDigits: 2 },
  { code: 'USD', fractionDigits: 2 },
]

export function isSupportedCurrency(code) {
  return CURRENCIES.some((currency) => currency.code === code)
}

function getCurrency(code) {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0]
}

export function convertAmount(amount, currency, rates) {
  if (!Number.isFinite(amount)) return null
  if (currency === BASE_CURRENCY) return amount
  const rate = rates?.[currency]
  if (!Number.isFinite(rate)) return null
  return Math.round(amount * rate * 100) / 100
}

export function formatMoney(amount, { currency = BASE_CURRENCY, locale } = {}) {
  if (!Number.isFinite(amount)) return ''
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: getCurrency(currency).fractionDigits,
  }).format(amount)
}

export function moneyFormatParts(currency, locale) {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).formatToParts(1234.56)

  const find = (type) => parts.find((part) => part.type === type)?.value ?? ''
  const symbolIndex = parts.findIndex((part) => part.type === 'currency')
  const numberIndex = parts.findIndex((part) => part.type === 'integer')

  return {
    symbol: find('currency'),
    group: find('group'),
    decimal: find('decimal'),
    prefix: symbolIndex < numberIndex,
  }
}
