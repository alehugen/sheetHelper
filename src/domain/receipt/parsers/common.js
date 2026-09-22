import { parseDate, parseTime } from '../../shared/datetime.js'
import { formatDocument, isValidDocument } from '../../shared/document.js'
import { parseAmount } from '../../shared/money.js'
import { upperCase } from '../../shared/text.js'
import {
  PATTERNS,
  findFirst,
  findLabeled,
  guessName,
  labelAt,
  sliceSection,
} from './support.js'

const NAME_LABELS = ['nome completo', 'razao social', 'nome']
const DOCUMENT_LABELS = ['cpf/cnpj', 'cnpj/cpf', 'cpf', 'cnpj', 'documento']
const BANK_LABELS = [
  'instituicao financeira',
  'instituicao',
  'emissor',
  'banco',
  'ispb',
]

export const SHARED_STOP_LABELS = [
  'informacoes adicionais',
  'codigo de barras',
  'linha digitavel',
  'documento',
  'autenticacao',
  'id da transacao',
]

export function extractParty(lines, startLabels, stopLabels) {
  const section = sliceSection(lines, startLabels, stopLabels)
  if (!section.length) return { name: null, document: null, bank: null }

  const header = labelAt(section[0], startLabels)

  const name =
    findLabeled(section, NAME_LABELS) ||
    header ||
    guessName(section.slice(1)) ||
    null

  const labeled = findLabeled(section, DOCUMENT_LABELS, {
    pattern: PATTERNS.document,
  })
  const loose = findFirst(section, PATTERNS.document)
  const document = labeled ?? (isValidDocument(loose) ? loose : null)

  const bank = findLabeled(section, BANK_LABELS)

  return {
    name: name ? upperCase(name) : null,
    document: document ? formatDocument(document) : null,
    bank: bank ? upperCase(bank) : null,
  }
}

export function extractAmount(lines, labels = ['valor']) {
  const labeled = findLabeled(lines, labels, { pattern: PATTERNS.amount })
  return parseAmount(labeled ?? findFirst(lines, PATTERNS.amount))
}

export function extractMoment(lines, dateLabels, timeLabels) {
  const labeledDate = findLabeled(lines, dateLabels, { pattern: PATTERNS.date })
  const labeledTime = findLabeled(lines, timeLabels, { pattern: PATTERNS.time })

  return {
    date: parseDate(labeledDate ?? findFirst(lines, PATTERNS.date)),
    time: parseTime(labeledTime ?? findFirst(lines, PATTERNS.time)),
  }
}

export function extractDueDate(lines) {
  return parseDate(
    findLabeled(lines, ['data de vencimento', 'vencimento'], {
      pattern: PATTERNS.date,
    }),
  )
}

export function extractDescription(lines) {
  return findLabeled(lines, [
    'descricao',
    'mensagem',
    'observacao',
    'finalidade',
  ])
}

export function extractEndToEndId(body, footer) {
  return (
    findFirst(body, PATTERNS.endToEndId) ??
    findFirst(footer, PATTERNS.endToEndId) ??
    findLabeled(body, ['id da transacao', 'identificador']) ??
    findLabeled(footer, ['id da transacao', 'identificador'])
  )
}
