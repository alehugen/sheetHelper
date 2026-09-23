import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

import { columnIndex, toSerial } from './excelDate'
import { collectCells, diffCells } from './xlsxCells'

const SHEET_PART_NAME = /^xl\/worksheets\/sheet\d+\.xml$/
const CALC_CHAIN = 'xl/calcChain.xml'
const WORKBOOK = 'xl/workbook.xml'
const ALLOWED_PART_CHANGES = new Set([WORKBOOK, CALC_CHAIN])

export class SpreadsheetWriteError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SpreadsheetWriteError'
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function cellXml(ref, attrs, payload) {
  const head = attrs.replace(/\s*t="[^"]*"/g, '').trimEnd()

  if (payload.value === null || payload.value === '') {
    return `<c r="${ref}"${head}/>`
  }

  if (payload.kind === 'text') {
    return `<c r="${ref}"${head} t="inlineStr"><is><t xml:space="preserve">${escapeXml(payload.value)}</t></is></c>`
  }

  const number =
    payload.kind === 'date' ? toSerial(payload.value) : Number(payload.value)
  if (number === null || !Number.isFinite(number))
    return `<c r="${ref}"${head}/>`

  return `<c r="${ref}"${head}><v>${number}</v></c>`
}

function writeCell(rowXml, ref, column, payload) {
  const existing = rowXml.match(
    new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>.*?</c>)`, 's'),
  )

  if (existing) {
    if (/<f[\s/>]/.test(existing[0])) {
      throw new SpreadsheetWriteError(`A célula ${ref} contém fórmula.`)
    }
    return rowXml.replace(existing[0], cellXml(ref, existing[1], payload))
  }

  const target = columnIndex(column)
  const after = [...rowXml.matchAll(/<c r="([A-Z]+)\d+"/g)].find(
    (m) => columnIndex(m[1]) > target,
  )
  const fragment = cellXml(ref, '', payload)

  return after
    ? rowXml.slice(0, after.index) + fragment + rowXml.slice(after.index)
    : rowXml + fragment
}

function sheetPartFor(files, sheetIndex) {
  const parts = Object.keys(files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
  return parts[sheetIndex] ?? null
}

function forceRecalculation(files) {
  delete files[CALC_CHAIN]

  if (!files[WORKBOOK]) return
  let xml = strFromU8(files[WORKBOOK])

  if (/<calcPr[^>]*>/.test(xml)) {
    xml = xml.replace(/<calcPr([^>]*?)\/?>/, (all, attrs) => {
      const cleaned = attrs.replace(/\s*fullCalcOnLoad="[^"]*"/g, '')
      return `<calcPr${cleaned} fullCalcOnLoad="1"/>`
    })
  } else {
    xml = xml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>')
  }
  files[WORKBOOK] = strToU8(xml)
}

const SHARED_FORMULA = /<f[^>]*t="shared"[^>]*>/
const RELATIVE_REF = /(\$?)([A-Z]{1,3})(\$?)(\d+)/g

function shiftFormula(formula, delta) {
  return formula.replace(RELATIVE_REF, (all, colLock, col, rowLock, row) =>
    rowLock ? all : `${colLock}${col}${Number(row) + delta}`,
  )
}

function lastRowOf(xml) {
  const rows = [...xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>.*?<\/row>/gs)]
  return rows.length ? rows[rows.length - 1] : null
}

function blankRowFrom(templateXml, fromRow, toRow) {
  const delta = toRow - fromRow
  const head = templateXml.slice(0, templateXml.indexOf('>') + 1)

  const cells = templateXml
    .split('<c ')
    .slice(1)
    .map((chunk) => {
      const close = chunk.indexOf('>')
      const cellHead = chunk.slice(0, close)
      const ref = cellHead.match(/r="([A-Z]+)\d+"/)
      if (!ref) return ''

      const style = cellHead.match(/\s s="\d+"/)?.[0] ?? ''
      const inner = cellHead.trimEnd().endsWith('/')
        ? ''
        : chunk.slice(close + 1, chunk.lastIndexOf('</c'))

      const formula = inner.match(/<f[^>]*>([^<]*)<\/f>/)
      if (formula && !SHARED_FORMULA.test(inner)) {
        return `<c r="${ref[1]}${toRow}"${style}><f>${shiftFormula(formula[1], delta)}</f></c>`
      }
      return `<c r="${ref[1]}${toRow}"${style}/>`
    })
    .join('')

  return `${head.replace(/r="\d+"/, `r="${toRow}"`)}${cells}</row>`
}

function ensureRow(xml, rowNumber) {
  const existing = xml.match(
    new RegExp(`<row[^>]*r="${rowNumber}"[^>]*>.*?</row>`, 's'),
  )
  if (existing) return { xml, rowXml: existing[0], created: false }

  const template = lastRowOf(xml)
  if (!template) {
    throw new SpreadsheetWriteError('A planilha não tem nenhuma linha modelo.')
  }

  const from = Number(template[1])
  const rowXml = blankRowFrom(template[0], from, rowNumber)
  const next = xml.replace('</sheetData>', `${rowXml}</sheetData>`)
  return { xml: next, rowXml, created: true }
}

function growDimension(xml, lastRow) {
  return xml.replace(
    /<dimension ref="([A-Z]+\d+):([A-Z]+)(\d+)"\/>/,
    (all, start, col, row) =>
      Number(row) >= lastRow
        ? all
        : `<dimension ref="${start}:${col}${lastRow}"/>`,
  )
}

function sameBytes(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function rowKeyOf(cellKey) {
  const [part, ref] = cellKey.split('!')
  return `${part}!${ref.match(/\d+$/)[0]}`
}

function assertOnlyExpectedChanged(original, produced, { expected, created }) {
  const before = collectCells(original)
  const after = collectCells(produced)
  const { changed, removed, added } = diffCells(before, after)

  const unexpected = changed.filter((key) => !expected.has(key))
  const intruders = added.filter((key) => !created.has(rowKeyOf(key)))

  if (unexpected.length || removed.length || intruders.length) {
    throw new SpreadsheetWriteError(
      `A planilha original seria alterada além do previsto: ` +
        `${unexpected.length} célula(s) inesperada(s), ` +
        `${removed.length} removida(s), ${intruders.length} criada(s) fora de linha nova.`,
    )
  }

  const untouched = [...expected].filter(
    (key) => before.get(key) === after.get(key),
  )
  if (untouched.length) {
    throw new SpreadsheetWriteError(
      `${untouched.length} célula(s) deveriam ter sido preenchidas e não foram.`,
    )
  }

  for (const name of Object.keys(original)) {
    if (ALLOWED_PART_CHANGES.has(name) || SHEET_PART_NAME.test(name)) continue
    if (!produced[name] || !sameBytes(original[name], produced[name])) {
      throw new SpreadsheetWriteError(`A parte ${name} foi alterada.`)
    }
  }
}

export function fillXlsx(source, { sheets = [] } = {}) {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source)
  const files = unzipSync(bytes)
  const original = unzipSync(bytes)
  const expected = new Set()
  const created = new Set()

  for (const { sheetIndex = 0, entries = [] } of sheets) {
    if (!entries.length) continue

    const part = sheetPartFor(files, sheetIndex)
    if (!part)
      throw new SpreadsheetWriteError('Aba não encontrada na planilha.')

    let xml = strFromU8(files[part])

    let lastRow = 0

    for (const entry of entries) {
      const found = ensureRow(xml, entry.row)
      xml = found.xml
      if (found.created) created.add(`${part}!${entry.row}`)

      let rowXml = found.rowXml
      for (const [column, payload] of Object.entries(entry.values)) {
        rowXml = writeCell(rowXml, `${column}${entry.row}`, column, payload)
        if (!found.created) expected.add(`${part}!${column}${entry.row}`)
      }
      xml = xml.replace(found.rowXml, rowXml)
      lastRow = Math.max(lastRow, entry.row)
    }

    xml = growDimension(xml, lastRow)
    files[part] = strToU8(xml)
  }

  forceRecalculation(files)

  const produced = zipSync(files)
  assertOnlyExpectedChanged(original, unzipSync(produced), {
    expected,
    created,
  })

  return produced
}
