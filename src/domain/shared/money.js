const CURRENCY_PATTERN = /R?\$?\s*(-?[\d.\s]*\d(?:[.,]\d{1,2})?)/

export function parseAmount(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null
  if (!input) return null

  const match = String(input).match(CURRENCY_PATTERN)
  if (!match) return null

  let raw = match[1].replace(/\s/g, '')
  const hasComma = raw.includes(',')
  const hasDot = raw.includes('.')

  if (hasComma && hasDot) {
    raw =
      raw.lastIndexOf(',') > raw.lastIndexOf('.')
        ? raw.replace(/\./g, '').replace(',', '.')
        : raw.replace(/,/g, '')
  } else if (hasComma) {
    raw = raw.replace(',', '.')
  } else if (hasDot) {
    const decimals = raw.slice(raw.lastIndexOf('.') + 1)
    if (raw.split('.').length > 2 || decimals.length === 3) {
      raw = raw.replace(/\./g, '')
    }
  }

  const value = Number(raw)
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null
}
