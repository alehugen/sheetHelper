import { labelAt } from '../../shared/matching.js'
import { cleanValue, fold, onlyDigits } from '../../shared/text.js'

import { isNoiseLine } from './lines.js'

export const PATTERNS = {
  document:
    /[*x\d]{2}\.[*x\d]{3}\.[*x\d]{3}\/[*x\d]{4}-[*x\d]{2}|[*x\d]{3}\.[*x\d]{3}\.[*x\d]{3}-[*x\d]{2}|[*x]{2,}[*x\d]{6,}|[*x\d]{6,}[*x]{2,}|(?<!\d)\d{14}(?!\d)|(?<!\d)\d{11}(?!\d)/i,
  amount: /R?\$?\s*\d[\d.]*,\d{2}/,
  date: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s+(?:de\s+)?[a-zà-ÿ]{3,9}\.?,?\s+(?:de\s+)?\d{4}\b/i,
  time: /\b([01]?\d|2[0-3])[:h][0-5]\d(?::[0-5]\d)?\b/,
  endToEndId: /\bE[0-9A-Za-zÀ-ÿ]{25,35}\b/,
  authCode: /\b[0-9A-F]{16,64}\b/i,
}

const AGENCY_IN_LINE = /(?:^|[^a-z])ag(?:encia)?\.?\s*:?\s*(\d[\d.-]*)/
const ACCOUNT_IN_LINE =
  /(?:^|[^a-z])(?:conta corrente|conta|c\/c)\.?\s*:?\s*(\d[\d.-]*)/

function extract(value, pattern) {
  if (!value) return null
  if (!pattern) return value
  const match = value.match(pattern)
  return match ? cleanValue(match[0]) : null
}

export function findLabeled(lines, labels, options = {}) {
  const { pattern = null, lookahead = 2 } = options

  for (let i = 0; i < lines.length; i += 1) {
    const inline = labelAt(lines[i], labels)
    if (inline === null) continue

    const direct = extract(inline, pattern)
    if (direct) return direct

    for (let step = 1; step <= lookahead; step += 1) {
      const next = lines[i + step]
      if (next === undefined) break
      if (!pattern && isNoiseLine(next)) break
      const candidate = extract(cleanValue(next), pattern)
      if (candidate) return candidate
    }
  }
  return null
}

export function findLabeledDigits(lines, labels, options = {}) {
  const { minDigits = 20, maxLines = 3 } = options

  for (let i = 0; i < lines.length; i += 1) {
    const inline = labelAt(lines[i], labels)
    if (inline === null) continue

    let digits = onlyDigits(inline)
    for (let step = 1; step <= maxLines; step += 1) {
      const next = lines[i + step]
      if (next === undefined) break
      const compact = next.replace(/\s/g, '')
      const found = onlyDigits(compact)
      if (!found || found.length / compact.length < 0.7) break
      digits += found
    }

    if (digits.length >= minDigits) return digits
  }
  return null
}

function scanLines(lines, pattern) {
  for (const line of lines) {
    const match = fold(line).match(pattern)
    if (match) return match[1]
  }
  return null
}

export function extractAccount(section) {
  const agency = scanLines(section, AGENCY_IN_LINE)
  const account = scanLines(section, ACCOUNT_IN_LINE)
  return [agency, account].filter(Boolean).join(' / ') || null
}

export function guessName(lines) {
  for (const line of lines) {
    const value = cleanValue(line)
    if (!value || value.length < 5 || value.length > 80) continue
    if (isNoiseLine(value)) continue
    if (/\d/.test(value)) continue
    if (value.includes(':')) continue
    if (value.split(/\s+/).length < 2) continue
    if (!/^[\p{L}\s'.&-]+$/u.test(value)) continue
    return value
  }
  return null
}
