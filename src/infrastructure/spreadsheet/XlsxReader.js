import { strFromU8, unzipSync } from 'fflate'

import { serialToIso } from './excelDate'

const DATE_FORMATS = /[dmy]/i
const BUILTIN_DATE_IDS = new Set(['14', '15', '16', '17', '22'])
const FORMULA_MAJORITY = 0.6
const MIN_HEADER_CELLS = 3

function textOf(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gs'))].map(
    (m) => m[1],
  )
}

function parseSharedStrings(xml) {
  if (!xml) return []
  return textOf(xml, 'si').map((si) =>
    [...si.matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map((m) => m[1]).join(''),
  )
}

function parseStyles(xml) {
  const formats = Object.fromEntries(
    [...xml.matchAll(/numFmtId="(\d+)"\s+formatCode="([^"]*)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  )
  const block = xml.match(/<cellXfs[^>]*>(.*?)<\/cellXfs>/s)?.[1] ?? ''
  const ids = [...block.matchAll(/<xf\b[^>]*>/g)].map(
    (m) => m[0].match(/numFmtId="(\d+)"/)?.[1] ?? '0',
  )
  return ids.map((id) => ({
    numFmtId: id,
    code: formats[id] ?? '',
    isDate: BUILTIN_DATE_IDS.has(id) || DATE_FORMATS.test(formats[id] ?? ''),
  }))
}

function decodeEntity(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function parseCells(body, shared) {
  const cells = {}
  for (const chunk of body.split('<c ').slice(1)) {
    const head = chunk.slice(0, chunk.indexOf('>'))
    const ref = head.match(/r="([A-Z]+)(\d+)"/)
    if (!ref) continue

    const selfClosed = head.trimEnd().endsWith('/')
    const inner = selfClosed
      ? ''
      : chunk.slice(chunk.indexOf('>') + 1, chunk.lastIndexOf('</c'))
    const type = head.match(/t="(\w+)"/)?.[1] ?? 'n'
    const style = Number(head.match(/s="(\d+)"/)?.[1] ?? 0)
    const raw = inner.match(/<v>(.*?)<\/v>/s)?.[1] ?? null

    let value = raw
    if (type === 's' && raw !== null) value = shared[Number(raw)] ?? ''
    else if (type === 'inlineStr') {
      value = [...inner.matchAll(/<t[^>]*>(.*?)<\/t>/gs)]
        .map((m) => m[1])
        .join('')
    }

    cells[ref[1]] = {
      column: ref[1],
      type,
      style,
      value: value === null ? null : decodeEntity(value),
      hasFormula: /<f[\s/>]/.test(inner),
    }
  }
  return cells
}

function isBlank(cell) {
  return !cell || cell.hasFormula || cell.value === null || cell.value === ''
}

function readSheet(xml, shared, styles, name) {
  const rows = new Map()
  for (const m of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs)) {
    rows.set(Number(m[1]), parseCells(m[2], shared))
  }

  const numbers = [...rows.keys()].sort((a, b) => a - b)

  const isText = (cell) =>
    !cell.hasFormula &&
    typeof cell.value === 'string' &&
    cell.value.trim() !== '' &&
    Number.isNaN(Number(cell.value))

  const headerRow = numbers.find(
    (n) => Object.values(rows.get(n)).filter(isText).length >= MIN_HEADER_CELLS,
  )
  if (!headerRow) return null

  const header = rows.get(headerRow)
  const sample = numbers.filter((n) => n > headerRow)

  const columns = Object.values(header)
    .filter((c) => c.value)
    .map((c) => {
      const cells = sample.map((n) => rows.get(n)[c.column]).filter(Boolean)
      const used = cells.filter((cell) => cell.hasFormula || cell.value)
      const withFormula = used.filter((cell) => cell.hasFormula).length
      const style = cells.find((cell) => cell.style !== undefined)?.style ?? 0

      return {
        letter: c.column,
        title: c.value,
        hasFormula:
          used.length > 0 && withFormula / used.length >= FORMULA_MAJORITY,
        style,
        isDate: styles[style]?.isDate ?? false,
      }
    })

  const dataColumns = columns.filter((c) => !c.hasFormula).map((c) => c.letter)
  const lastFilled = [...numbers]
    .reverse()
    .find(
      (n) =>
        n > headerRow && dataColumns.some((col) => !isBlank(rows.get(n)[col])),
    )

  const firstWritableRow = (lastFilled ?? headerRow) + 1
  const lastRow = numbers.at(-1) ?? headerRow

  const dateColumns = new Set(
    columns.filter((c) => c.isDate).map((c) => c.letter),
  )

  const data = numbers
    .filter((n) => n > headerRow && n < firstWritableRow)
    .map((n) => {
      const cells = rows.get(n)
      const values = {}
      for (const column of columns) {
        const cell = cells[column.letter]
        if (
          !cell ||
          cell.hasFormula ||
          cell.value === null ||
          cell.value === ''
        )
          continue
        values[column.letter] = dateColumns.has(column.letter)
          ? serialToIso(cell.value)
          : cell.type === 'n' || cell.type === undefined
            ? Number(cell.value)
            : cell.value
      }
      return { row: n, values }
    })
    .filter((entry) => Object.keys(entry.values).length > 0)

  return {
    name,
    headerRow,
    columns,
    data,
    firstWritableRow,
    lastRow,
    filledRows: numbers.filter(
      (n) =>
        n > headerRow && dataColumns.some((col) => !isBlank(rows.get(n)[col])),
    ).length,
    preformattedRows: Math.max(0, lastRow - firstWritableRow + 1),
    writeMode: firstWritableRow <= lastRow ? 'fill' : 'append',
  }
}

export function readXlsx(source) {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source)
  const files = unzipSync(bytes)
  const read = (name) => (files[name] ? strFromU8(files[name]) : null)

  const shared = parseSharedStrings(read('xl/sharedStrings.xml'))
  const styles = parseStyles(read('xl/styles.xml') ?? '')

  const workbook = read('xl/workbook.xml') ?? ''
  const names = [...workbook.matchAll(/<sheet[^>]*name="([^"]*)"/g)].map((m) =>
    decodeEntity(m[1]),
  )

  const parts = Object.keys(files)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))

  const sheets = parts
    .map((part, index) =>
      readSheet(read(part), shared, styles, names[index] ?? part),
    )
    .filter(Boolean)

  return { sheets }
}
