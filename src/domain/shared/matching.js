import { cleanValue, fold } from './text.js'

const MIN_PREFIX = 6

function isBoundary(char) {
  return char === undefined || !/[\p{L}\d]/u.test(char)
}

export function labelAt(line, labels) {
  const folded = fold(line)
  let best = -1

  for (const label of labels) {
    const needle = fold(label)
    if (folded.startsWith(needle) && isBoundary(folded[needle.length])) {
      if (needle.length > best) best = needle.length
      continue
    }
    if (needle.length < MIN_PREFIX + 2) continue
    for (let size = needle.length - 1; size >= MIN_PREFIX; size -= 1) {
      if (isBoundary(needle[size])) continue
      if (
        folded.startsWith(needle.slice(0, size)) &&
        isBoundary(folded[size])
      ) {
        if (size > best) best = size
        break
      }
    }
  }

  return best === -1 ? null : cleanValue(line.slice(best))
}

export function scoreKeywords(text, weighted) {
  const haystack = fold(text)
  return weighted.reduce((total, [keyword, weight]) => {
    const needle = fold(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matcher = new RegExp(`(?<![\\p{L}\\d])${needle}(?![\\p{L}\\d])`, 'u')
    return matcher.test(haystack) ? total + weight : total
  }, 0)
}
