import { strFromU8 } from 'fflate'

const SHEET_PART = /^xl\/worksheets\/sheet\d+\.xml$/

function sheetParts(files) {
  return Object.keys(files)
    .filter((name) => SHEET_PART.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
}

export function collectCells(files) {
  const cells = new Map()

  for (const part of sheetParts(files)) {
    const xml = strFromU8(files[part])
    for (const row of xml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)) {
      for (const chunk of row[1].split('<c ').slice(1)) {
        const close = chunk.indexOf('>')
        const head = chunk.slice(0, close)
        const ref = head.match(/r="([A-Z]+\d+)"/)?.[1]
        if (!ref) continue

        const inner = head.trimEnd().endsWith('/')
          ? ''
          : chunk.slice(close + 1, chunk.lastIndexOf('</c'))

        cells.set(
          `${part}!${ref}`,
          `${head.replace(/\/$/, '').trim()}|${inner}`,
        )
      }
    }
  }

  return cells
}

export function diffCells(before, after) {
  const changed = []
  const removed = []
  const added = []

  for (const [key, value] of before) {
    if (!after.has(key)) removed.push(key)
    else if (after.get(key) !== value) changed.push(key)
  }
  for (const key of after.keys()) {
    if (!before.has(key)) added.push(key)
  }

  return { changed, removed, added }
}
