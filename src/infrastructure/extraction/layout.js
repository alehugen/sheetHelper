import { fold } from '../../domain/shared/text.js'

const ROW_OVERLAP = 0.3
const MIN_GAP_RATIO = 0.03
const GAP_FACTOR = 3
const FRAGMENT_MAX = 4
const WORD_MAX = 12

export function collectWords(blocks) {
  const words = []
  for (const block of blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        for (const word of line.words ?? []) {
          if (!word.text?.trim() || !word.bbox) continue
          words.push({
            text: word.text.trim(),
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1,
          })
        }
      }
    }
  }
  return words
}

function groupRows(words) {
  const sorted = [...words].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
  const rows = []

  for (const word of sorted) {
    const row = rows.at(-1)
    const overlap = row
      ? Math.min(row.y1, word.y1) - Math.max(row.y0, word.y0)
      : 0
    const height = row ? Math.min(row.y1 - row.y0, word.y1 - word.y0) : 1

    if (row && overlap > height * ROW_OVERLAP) {
      row.words.push(word)
      row.y0 = Math.min(row.y0, word.y0)
      row.y1 = Math.max(row.y1, word.y1)
    } else {
      rows.push({ y0: word.y0, y1: word.y1, words: [word] })
    }
  }

  return rows
}

function medianGap(rows) {
  const gaps = []
  for (const row of rows) {
    const words = [...row.words].sort((a, b) => a.x0 - b.x0)
    for (let i = 1; i < words.length; i += 1) {
      gaps.push(words[i].x0 - words[i - 1].x1)
    }
  }
  if (!gaps.length) return 0
  gaps.sort((a, b) => a - b)
  return gaps[Math.floor(gaps.length / 2)]
}

function splitRow(row, threshold) {
  const words = [...row.words].sort((a, b) => a.x0 - b.x0)
  const join = (list) =>
    list
      .map((word) => word.text)
      .join(' ')
      .trim()

  let cut = -1
  let widest = threshold
  for (let i = 1; i < words.length; i += 1) {
    const gap = words[i].x0 - words[i - 1].x1
    if (gap > widest) {
      widest = gap
      cut = i
    }
  }

  return cut === -1
    ? { label: join(words), value: '' }
    : { label: join(words.slice(0, cut)), value: join(words.slice(cut)) }
}

function rowLeft(row) {
  return Math.min(...row.words.map((word) => word.x0))
}

function isContinuation({ label, value }, standalone) {
  if (!label) return false
  if (standalone.has(fold(label))) return false
  if (label.length <= 2) return true
  if (!/\p{Ll}/u.test(label[0])) return false
  if (label.length <= FRAGMENT_MAX) return true
  return value === '' && label.length <= WORD_MAX && !/\d/.test(label)
}

export function composeLayout(words, { standaloneHeaders = [] } = {}) {
  if (!words.length) return ''

  const standalone = new Set(standaloneHeaders.map(fold))

  const rows = groupRows(words)
  const left = Math.min(...words.map((word) => word.x0))
  const right = Math.max(...words.map((word) => word.x1))
  const threshold = Math.max(
    medianGap(rows) * GAP_FACTOR,
    (right - left) * MIN_GAP_RATIO,
  )

  const labelLeft = Math.min(...rows.map(rowLeft))

  const cells = []
  for (const row of rows) {
    const cell = splitRow(row, threshold)
    const previous = cells.at(-1)
    const valueOnly = !cell.value && rowLeft(row) - labelLeft > threshold

    if (previous && valueOnly) {
      previous.value = [previous.value, cell.label].filter(Boolean).join(' ')
    } else if (previous && isContinuation(cell, standalone)) {
      previous.label +=
        cell.label.length <= FRAGMENT_MAX ? cell.label : ` ${cell.label}`
      previous.value = [previous.value, cell.value].filter(Boolean).join(' ')
    } else {
      cells.push(cell)
    }
  }

  return cells
    .map(({ label, value }) => [label, value].filter(Boolean).join(' '))
    .join('\n')
}
