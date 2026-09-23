import { labelAt } from '../receipt/parsing/labels.js'

export const HEADER_VOCABULARY = {
  date: [
    'data do pagamento',
    'data de pagamento',
    'data pgto',
    'data pag',
    'dt pagamento',
    'data',
    'dt',
  ],
  amount: [
    'valor pago',
    'valor bruto',
    'valor r$',
    'valor',
    'vlr',
    'montante',
    'quantia',
  ],
  payerName: [
    'quem pagou',
    'nome do pagador',
    'pagador',
    'remetente',
    'origem',
    'fornecedor',
    'sacado',
  ],
  payerDocument: [
    'cpf/cnpj do pagador',
    'cnpj do pagador',
    'cpf do pagador',
    'documento do pagador',
    'cpf/cnpj pagador',
  ],
  payerBank: ['banco do pagador', 'banco origem', 'instituicao de origem'],
  payeeName: [
    'quem recebeu',
    'nome do favorecido',
    'nome do beneficiario',
    'favorecido',
    'beneficiario',
    'recebedor',
    'destino',
    'credor',
  ],
  payeeDocument: [
    'cpf/cnpj do recebedor',
    'cnpj do recebedor',
    'cpf do recebedor',
    'documento do recebedor',
    'cpf/cnpj favorecido',
  ],
  payeeBank: ['banco do recebedor', 'banco destino', 'instituicao de destino'],
  transactionId: [
    'id da transacao',
    'identificador',
    'codigo de autenticacao',
    'autenticacao',
    'nosso numero',
    'protocolo',
  ],
  dueDate: ['data de vencimento', 'vencimento', 'venc'],
  description: ['descricao', 'detalhe', 'historico', 'observacao', 'mensagem'],
  type: ['tipo', 'meio', 'forma de pagamento', 'modalidade'],
}

const ENTRIES = Object.entries(HEADER_VOCABULARY)

function matchHeader(title) {
  const text = String(title ?? '').trim()
  if (!text) return null

  let best = null
  for (const [field, synonyms] of ENTRIES) {
    for (const synonym of synonyms) {
      if (labelAt(text, [synonym]) === null) continue
      if (!best || synonym.length > best.synonym.length)
        best = { field, synonym }
    }
  }
  return best
}

export function detectMapping(columns) {
  const claims = new Map()
  const unmapped = []

  for (const column of columns) {
    if (column.hasFormula) continue
    const match = matchHeader(column.title)
    if (!match) {
      if (column.title) unmapped.push(column)
      continue
    }
    if (!claims.has(match.field)) claims.set(match.field, [])
    claims.get(match.field).push({ ...column, matched: match.synonym })
  }

  const mapping = {}
  const ambiguous = {}
  for (const [field, candidates] of claims) {
    if (candidates.length === 1) mapping[field] = candidates[0]
    else ambiguous[field] = candidates
  }

  return { mapping, ambiguous, unmapped }
}
