import { documentDigits, isMasked } from '../shared/document.js'

const MASK = /[*x]/i

function maskPattern(value) {
  return String(value ?? '')
    .replace(/[^\d*xX]/g, '')
    .toLowerCase()
    .replace(/x/g, '*')
}

export function maskedMatches(masked, full) {
  const pattern = maskPattern(masked)
  const digits = documentDigits(full)

  if (!pattern || !digits) return false
  if (pattern.length !== digits.length) return false
  if (!MASK.test(pattern)) return pattern === digits

  let visible = 0
  for (let i = 0; i < pattern.length; i += 1) {
    if (pattern[i] === '*') continue
    if (pattern[i] !== digits[i]) return false
    visible += 1
  }

  return visible >= MIN_VISIBLE_DIGITS
}

const MIN_VISIBLE_DIGITS = 4

export function documentMatches(value, documents) {
  if (!value) return null
  const digits = documentDigits(value)

  if (!isMasked(value) && digits) {
    return documents.some((doc) => documentDigits(doc) === digits)
      ? 'document'
      : null
  }

  return documents.some((doc) => maskedMatches(value, doc)) ? 'masked' : null
}
